import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'

const DISPUTE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  UPHELD: 'success',
  REJECTED: 'error',
  SUBMITTED: 'warning',
  UNDER_REVIEW: 'warning',
}
const DISPUTE_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'New',
  UNDER_REVIEW: 'Being reviewed',
  UPHELD: 'Upheld',
  REJECTED: 'Rejected',
}
const BATCH_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Ready to export',
  SUBMITTED: 'Sent',
  ACKNOWLEDGED: 'Confirmed by bureau',
  FAILED: 'Failed',
}

function MemberPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const { data } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder="Search by email or member number"
        value={value ? '' : search}
        onChange={(e) => { setSearch(e.target.value); onChange('') }}
        className="w-full p-2 border rounded bg-white"
        disabled={!!value}
      />
      {value ? (
        <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1">
          <span className="text-ink font-medium">Member selected</span>
          <button type="button" onClick={() => onChange('')} className="text-violet-700 font-semibold">Change</button>
        </div>
      ) : search && (data?.results ?? []).length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {(data?.results ?? []).map((m: any) => (
            <button type="button" key={m.id} onClick={() => onChange(m.id)} className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded">
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CreditBureau() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'scores' | 'passports' | 'submissions' | 'disputes'>('scores')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 5000) }

  // Credit scores
  const [scoreMembershipId, setScoreMembershipId] = useState('')
  const [reviewDecision, setReviewDecision] = useState<'CONFIRMED' | 'OVERRIDDEN'>('CONFIRMED')
  const [overrideBand, setOverrideBand] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('C')
  const [reviewReason, setReviewReason] = useState('')

  const { data: scoreData } = useQuery({
    queryKey: ['creditbureau-score', scoreMembershipId],
    queryFn: () => api.creditbureau.getCreditScore(scoreMembershipId),
    enabled: !!scoreMembershipId,
  })

  const computeMutation = useMutation({
    mutationFn: () => api.creditbureau.computeCreditScore(scoreMembershipId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creditbureau-score', scoreMembershipId] }); notify('Score computed.') },
    onError: (err: any) => notify(err?.message || 'Failed to compute this score.'),
  })

  const reviewMutation = useMutation({
    mutationFn: () => api.creditbureau.reviewCreditScore(scoreData!.latest!.id, { decision: reviewDecision, override_band: reviewDecision === 'OVERRIDDEN' ? overrideBand : undefined, reason: reviewReason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creditbureau-score', scoreMembershipId] }); setReviewReason(''); notify('Review recorded.') },
    onError: (err: any) => notify(err?.message || 'Failed to record this review — if you\'re overriding the score, the reason needs to be at least 10 characters.'),
  })

  // There is no list endpoint for explanation requests anywhere in this
  // backend — a member's request only surfaces via whatever notification
  // channel points an officer at it, so this resolves by ID (e.g. from a
  // support ticket), not from a discoverable queue.
  const [explanationRequestId, setExplanationRequestId] = useState('')
  const [explanationNotes, setExplanationNotes] = useState('')
  const resolveExplanationMutation = useMutation({
    mutationFn: (data: { status: 'UNDER_REVIEW' | 'RESOLVED' }) =>
      api.creditbureau.resolveCreditScoreExplanation(explanationRequestId, { status: data.status, resolution_notes: explanationNotes || undefined }),
    onSuccess: () => { setExplanationRequestId(''); setExplanationNotes(''); notify('Explanation request updated.') },
    onError: (err: any) => notify(err?.message || 'Failed to update this request.'),
  })

  // Repayment passport verification (cross-tenant)
  const [verifyToken, setVerifyToken] = useState('')
  const [verifyRecipientSaccoId, setVerifyRecipientSaccoId] = useState('')
  const [verifyResult, setVerifyResult] = useState<any | null>(null)

  const verifyPassportMutation = useMutation({
    mutationFn: () => api.creditbureau.verifyRepaymentPassport({ token: verifyToken, recipient_sacco_id: verifyRecipientSaccoId || undefined }),
    onSuccess: (result) => { setVerifyResult(result); notify('Passport verified. This was logged, since it shows you another SACCO\'s member data.') },
    onError: (err: any) => { setVerifyResult(null); notify(err?.message || 'Failed to verify this passport.') },
  })

  // Submission batches
  const [period, setPeriod] = useState('')
  const { data: batches = [] } = useQuery({ queryKey: ['creditbureau-submission-batches'], queryFn: () => api.creditbureau.getSubmissionBatches(), enabled: activeTab === 'submissions' })

  const createBatchMutation = useMutation({
    mutationFn: () => api.creditbureau.createSubmissionBatch({ period }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creditbureau-submission-batches'] }); setPeriod(''); notify('Batch generated — download it below and send it to the bureau yourself.') },
    onError: (err: any) => notify(err?.message || 'Failed to generate this batch.'),
  })

  const exportBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const blob = await api.creditbureau.exportSubmissionBatch(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crb_submission_${id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (err: any) => notify(err?.message || 'Failed to export this batch.'),
  })

  // Listing disputes
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [disputeNotes, setDisputeNotes] = useState('')
  const { data: disputes = [] } = useQuery({ queryKey: ['creditbureau-listing-disputes'], queryFn: () => api.creditbureau.getListingDisputes(), enabled: activeTab === 'disputes' })

  const resolveDisputeMutation = useMutation({
    mutationFn: (data: { id: string; status: 'UNDER_REVIEW' | 'UPHELD' | 'REJECTED' }) =>
      api.creditbureau.resolveListingDispute(data.id, { status: data.status, officer_notes: disputeNotes || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creditbureau-listing-disputes'] }); setSelectedDisputeId(null); setDisputeNotes(''); notify('Dispute updated.') },
    onError: (err: any) => notify(err?.message || 'Failed to update this dispute.'),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Credit Bureau"
        subtitle="A member's internal credit score, a shareable repayment history, and reports sent to credit reference bureaus."
        info="Only someone with a SACCO-admin role at this specific SACCO can use this page — a pure platform-staff login with no admin role anywhere will be refused, unlike most other pages here."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium flex-wrap">
        {([
          ['scores', 'Credit Scores'],
          ['passports', 'Verify Repayment Passport'],
          ['submissions', `CRB Submission Batches (${batches.length})`],
          ['disputes', `Listing Disputes (${disputes.length})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'scores' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Select Member</div>
            <MemberPicker value={scoreMembershipId} onChange={setScoreMembershipId} />
            {scoreMembershipId && (
              <button onClick={() => computeMutation.mutate()} disabled={computeMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                Compute New Score
              </button>
            )}

            <div className="border-t pt-3 space-y-2">
              <div className="font-bold text-ink flex items-center gap-1.5">
                Answer a Member's Question About Their Score
                <InfoTip text="There's no list of these to browse — a member's request only reaches you through whatever notification or support ticket told you about it. Paste in the ID from that message." label="Why there's no list here" />
              </div>
              <input type="text" placeholder="Explanation request ID" value={explanationRequestId} onChange={(e) => setExplanationRequestId(e.target.value)} className="w-full p-2 border rounded bg-white font-mono" />
              <input type="text" placeholder="Resolution notes (optional)" value={explanationNotes} onChange={(e) => setExplanationNotes(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <div className="flex gap-2">
                <button onClick={() => explanationRequestId && resolveExplanationMutation.mutate({ status: 'UNDER_REVIEW' })} disabled={!explanationRequestId} className="flex-1 py-1.5 bg-amber-600 text-white font-bold rounded cursor-pointer">Mark Under Review</button>
                <button onClick={() => explanationRequestId && resolveExplanationMutation.mutate({ status: 'RESOLVED' })} disabled={!explanationRequestId} className="flex-1 py-1.5 bg-mint-600 text-white font-bold rounded cursor-pointer">Resolve</button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            {!scoreMembershipId ? <div className="text-ink-muted py-4 text-center">Select a member to view their credit score.</div> : !scoreData?.latest ? (
              <div className="text-ink-muted py-4 text-center">No score has ever been computed for this member.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-ink">Band {scoreData.latest.band} · {scoreData.latest.numeric_score}</div>
                    <div className="text-ink-muted">Computed {scoreData.latest.computed_at} · model {scoreData.latest.model_version}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(scoreData.latest.reason_codes ?? []).map((rc: string) => <span key={rc} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">{rc}</span>)}
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold">This scoring model hasn't been signed off by the credit committee yet — treat it as a draft, not a final decision.</div>

                <div className="border-t pt-3 space-y-2">
                  <div className="font-semibold text-ink">Confirm or Override This Score</div>
                  <div className="flex gap-2">
                    <select value={reviewDecision} onChange={(e) => setReviewDecision(e.target.value as any)} className="p-2 border rounded bg-white">
                      <option value="CONFIRMED">Confirm it's correct</option>
                      <option value="OVERRIDDEN">Override it</option>
                    </select>
                    {reviewDecision === 'OVERRIDDEN' && (
                      <select value={overrideBand} onChange={(e) => setOverrideBand(e.target.value as any)} className="p-2 border rounded bg-white">
                        {['A', 'B', 'C', 'D', 'E'].map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={reviewDecision === 'OVERRIDDEN' ? 'Reason (min. 10 characters when overriding)...' : 'Reason...'}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  />
                  <button onClick={() => reviewReason && reviewMutation.mutate()} disabled={!reviewReason} className="px-3 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Record Review</button>
                </div>

                <div className="border-t pt-3">
                  <div className="font-semibold text-ink mb-1">History ({scoreData.history.length})</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {scoreData.history.map((h: any) => (
                      <div key={h.id} className="px-2 py-1 bg-surface-2 rounded">Band {h.band} · {h.numeric_score} · {h.computed_at}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'passports' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm max-w-xl">
          <div className="font-bold text-base text-ink">Verify a Repayment Passport</div>
          <div className="text-ink-muted">
            A member from another SACCO has shared their repayment history with you. Paste the code they gave you below to see it — this is the one place this platform lets you look at another SACCO's member data, and it's logged every time.
          </div>
          <textarea placeholder="Signed passport token (JWS)" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} rows={3} className="w-full p-2 border rounded bg-white font-mono" />
          <input type="text" placeholder="Recipient SACCO ID (platform staff only)" value={verifyRecipientSaccoId} onChange={(e) => setVerifyRecipientSaccoId(e.target.value)} className="w-full p-2 border rounded bg-white font-mono" />
          <button onClick={() => verifyToken && verifyPassportMutation.mutate()} disabled={!verifyToken} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Verify</button>
          {verifyResult && (
            <div className="p-3 bg-mint-50 border border-mint-200 rounded space-y-1">
              <div className="font-bold text-mint-800">Valid passport</div>
              <div>Issued {verifyResult.issued_at} · expires {verifyResult.expires_at} · model {verifyResult.model_version}</div>
              <div className="font-mono text-[10px]">{JSON.stringify(verifyResult.claims)}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Generate Batch</div>
            <input type="text" placeholder="Period (YYYY-MM)" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button onClick={() => period && createBatchMutation.mutate()} disabled={!period} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Generate</button>
            <div className="text-ink-muted flex items-start gap-1.5">
              <span>This builds a file for you to send to the bureau yourself — nothing is submitted automatically.</span>
              <InfoTip text="The exported file uses a sample layout — the real format a bureau like Metropol expects hasn't been confirmed yet, so don't treat this as submission-ready without checking first." label="About the file format" />
            </div>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Period</th><th className="py-2 px-3">Status</th><th></th></tr></thead>
              <tbody className="divide-y">
                {batches.length === 0 ? <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No batches generated yet.</td></tr> : batches.map((b: any) => (
                  <tr key={b.id}>
                    <td className="py-2 px-3 font-medium text-ink">{b.period}</td>
                    <td className="py-2 px-3">{BATCH_STATUS_LABELS[b.status] ?? b.status}</td>
                    <td className="py-2 px-3 text-right"><button onClick={() => exportBatchMutation.mutate(b.id)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Export CSV</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="font-bold text-base text-ink mb-3">Listing Disputes</div>
          <div className="space-y-2">
            {disputes.length === 0 ? <div className="text-ink-muted py-4 text-center">No listing disputes filed.</div> : disputes.map((d: any) => (
              <div key={d.id} className="border border-[#e5ede9] rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-ink">{d.member_statement}</div>
                  <Badge variant={DISPUTE_STATUS_VARIANT[d.status] ?? 'warning'}>{DISPUTE_STATUS_LABELS[d.status] ?? d.status}</Badge>
                </div>
                {d.status !== 'UPHELD' && d.status !== 'REJECTED' && (
                  selectedDisputeId === d.id ? (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Officer notes (optional)" value={disputeNotes} onChange={(e) => setDisputeNotes(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                      <button onClick={() => resolveDisputeMutation.mutate({ id: d.id, status: 'UPHELD' })} className="px-2 py-1 bg-mint-600 text-white font-bold text-[10px] rounded cursor-pointer">Uphold</button>
                      <button onClick={() => resolveDisputeMutation.mutate({ id: d.id, status: 'REJECTED' })} className="px-2 py-1 bg-red-600 text-white font-bold text-[10px] rounded cursor-pointer">Reject</button>
                      <button onClick={() => resolveDisputeMutation.mutate({ id: d.id, status: 'UNDER_REVIEW' })} className="px-2 py-1 bg-gray-100 text-ink-muted font-bold text-[10px] rounded cursor-pointer">Mark Under Review</button>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedDisputeId(d.id)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Resolve</button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

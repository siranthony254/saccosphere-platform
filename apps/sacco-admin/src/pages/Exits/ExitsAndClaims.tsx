import { useState } from 'react'
import { useMembers } from '../../hooks/useMembers'
import {
  useRefundQueue,
  useMarkRefundBankPayout,
  useDeceasedClaims,
  useCreateDeceasedClaim,
  useUploadClaimDocument,
  useVerifyClaimDocument,
  useSettleDeceasedClaim,
} from '../../hooks/useExits'

const formatCurrency = (val: number) => `KES ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

const DOCUMENT_TYPES = [
  { value: 'DEATH_CERTIFICATE', label: 'Death certificate' },
  { value: 'SUCCESSION_CERTIFICATE', label: 'Succession certificate / grant of probate' },
  { value: 'NOMINEE_ID', label: 'Nominee national ID' },
  { value: 'BURIAL_PERMIT', label: 'Burial permit' },
  { value: 'OTHER', label: 'Other' },
]

function RefundsTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: refunds = [], isLoading } = useRefundQueue(statusFilter || undefined)
  const markPaid = useMarkRefundBankPayout()
  const [payoutModal, setPayoutModal] = useState<{ id: string } | null>(null)
  const [bankReference, setBankReference] = useState('')

  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
      <div className="text-[11px] text-ink-faint bg-surface-2 p-2.5 rounded-lg">
        One queue for both voluntary-exit net refunds and deceased-claim nominee payouts. The backend
        doesn't currently return who each entry belongs to — cross-reference with the member or claim
        you just processed by amount/date if you need to confirm identity.
      </div>
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm bg-white"
        >
          <option value="">All statuses</option>
          {['PENDING_APPROVAL', 'APPROVED', 'LIQUIDITY_HOLD', 'PAYOUT_INITIATED', 'PAID', 'FAILED'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Due</th>
              <th className="py-2.5 px-3">Reference</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5ede9]">
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-muted text-sm">Loading refund queue…</td></tr>
            ) : refunds.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-muted text-sm">No refund entries at this filter.</td></tr>
            ) : (
              refunds.map((r) => (
                <tr key={r.id} className="hover:bg-surface-1">
                  <td className="py-2.5 px-3 text-xs font-semibold text-ink">{formatCurrency(r.amount)}</td>
                  <td className="py-2.5 px-3 text-xs text-ink-muted">{r.payout_method}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-ink-soft">{r.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-ink-muted">{r.due_date ? new Date(r.due_date).toLocaleDateString() : '—'}</td>
                  <td className="py-2.5 px-3 text-xs text-ink-muted font-mono">{r.payout_reference || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {r.payout_method === 'BANK' && r.status !== 'PAID' ? (
                      <button
                        onClick={() => setPayoutModal({ id: r.id })}
                        className="px-2.5 py-1 rounded-[6px] border border-ink-faint bg-white hover:bg-surface-2 text-ink text-[11px] font-semibold cursor-pointer"
                      >
                        Mark paid
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="font-bold text-base text-ink">Record bank payout</div>
            <p className="text-[11px] text-ink-muted">
              Only record this once you've actually sent the bank transfer outside SaccoSphere — this marks
              state, it doesn't move money.
            </p>
            <input
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              placeholder="Bank reference"
              className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
            />
            <div className="flex gap-2">
              <button onClick={() => { setPayoutModal(null); setBankReference('') }} className="flex-1 py-2 border border-ink-faint rounded text-xs text-ink-muted font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={() => {
                  if (!bankReference.trim()) return
                  markPaid.mutate({ id: payoutModal.id, bankReference: bankReference.trim() }, {
                    onSuccess: () => { setPayoutModal(null); setBankReference('') },
                  })
                }}
                disabled={markPaid.isPending || !bankReference.trim()}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {markPaid.isPending ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeceasedClaimsTab() {
  const { data: claims = [], isLoading } = useDeceasedClaims()
  const createClaim = useCreateDeceasedClaim()
  const uploadDoc = useUploadClaimDocument()
  const verifyDoc = useVerifyClaimDocument()
  const settleClaim = useSettleDeceasedClaim()

  const [memberSearch, setMemberSearch] = useState('')
  const { data: memberResults } = useMembers({ search: memberSearch || undefined })
  const [reportError, setReportError] = useState<string | null>(null)

  const [activeClaimId, setActiveClaimId] = useState<string | null>(null)
  const activeClaim = claims.find((c) => c.id === activeClaimId) ?? null
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0].value)
  const [settleMethod, setSettleMethod] = useState<'NONE_OUTSTANDING' | 'WELFARE_FUND' | 'INSURER' | 'ESTATE_OFFSET'>('NONE_OUTSTANDING')
  const [settleReference, setSettleReference] = useState('')
  const [settleError, setSettleError] = useState<string | null>(null)

  const deathCertVerified = activeClaim?.documents.some((d: { document_type: string; is_verified: boolean }) => d.document_type === 'DEATH_CERTIFICATE' && d.is_verified)
  const successionCertVerified = activeClaim?.documents.some((d: { document_type: string; is_verified: boolean }) => d.document_type === 'SUCCESSION_CERTIFICATE' && d.is_verified)
  const canSettle = deathCertVerified && successionCertVerified

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeClaimId) return
    uploadDoc.mutate({ claimId: activeClaimId, documentType: docType, file })
    e.target.value = ''
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
        <div className="font-bold text-sm text-ink">Report a deceased member</div>
        {reportError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{reportError}</div>}
        <input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Search by email or member number"
          className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
        />
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {(memberResults?.results ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between px-2.5 py-1.5 bg-surface-2 rounded text-[11px]">
              <div>
                <div className="font-semibold text-ink">{m.first_name} {m.last_name}</div>
                <div className="text-ink-faint">{m.member_number}</div>
              </div>
              <button
                onClick={() => {
                  setReportError(null)
                  createClaim.mutate(m.id, {
                    onSuccess: (claim) => setActiveClaimId(claim.id),
                    onError: (err: any) => setReportError(err?.message || 'Failed to report this member.'),
                  })
                }}
                disabled={createClaim.isPending}
                className="px-2 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-semibold cursor-pointer disabled:opacity-50"
              >
                Report
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-2 shadow-sm md:col-span-2">
        <div className="font-bold text-sm text-ink mb-2">Claims</div>
        {isLoading ? (
          <div className="text-xs text-ink-muted py-4">Loading claims…</div>
        ) : claims.length === 0 ? (
          <div className="text-xs text-ink-muted py-4">No deceased-member claims reported.</div>
        ) : (
          <div className="space-y-1.5">
            {claims.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveClaimId(c.id)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer ${activeClaimId === c.id ? 'bg-violet-50 border border-violet-200' : 'bg-surface-2'}`}
              >
                <span className="font-mono text-ink-faint">{c.id.slice(0, 8)}</span>
                <span className="font-semibold text-ink">{c.status}</span>
                <span className="text-ink-muted">{c.reported_at ? new Date(c.reported_at).toLocaleDateString() : '—'}</span>
              </button>
            ))}
          </div>
        )}

        {activeClaim && (
          <div className="border-t border-[#e5ede9] pt-3 mt-3 space-y-3">
            <div className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Documents</div>
            <div className="space-y-1.5">
              {activeClaim.documents.length === 0 ? (
                <div className="text-[11px] text-ink-muted">No documents uploaded yet.</div>
              ) : (
                activeClaim.documents.map((d: { id: string; document_type: string; file_name: string; is_verified: boolean }) => (
                  <div key={d.id} className="flex items-center justify-between px-2.5 py-1.5 bg-surface-2 rounded text-[11px]">
                    <div>
                      <span className="font-semibold text-ink">{DOCUMENT_TYPES.find((t) => t.value === d.document_type)?.label ?? d.document_type}</span>
                      <span className="ml-2 text-ink-faint">{d.file_name}</span>
                    </div>
                    {d.is_verified ? (
                      <span className="text-mint-700 font-bold">Verified</span>
                    ) : (
                      <button
                        onClick={() => verifyDoc.mutate({ claimId: activeClaim.id, documentId: d.id, isVerified: true })}
                        disabled={verifyDoc.isPending}
                        className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {activeClaim.status !== 'COMPLETED' && activeClaim.status !== 'REJECTED' && (
              <div className="flex gap-2 items-end">
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="p-2 border border-[#e5ede9] rounded text-[11px] bg-white">
                  {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <label className="px-3 py-2 rounded bg-white border border-ink-faint text-[11px] font-semibold cursor-pointer hover:bg-surface-2">
                  Upload file
                  <input type="file" onChange={handleFilePick} className="hidden" />
                </label>
              </div>
            )}

            {activeClaim.status !== 'COMPLETED' && activeClaim.status !== 'REJECTED' && (
              <div className="border-t border-[#e5ede9] pt-3 space-y-2">
                <div className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Settle claim</div>
                <p className="text-[11px] text-ink-faint">
                  Needs a verified death certificate and succession certificate.{' '}
                  {!canSettle && <span className="text-amber-700 font-semibold">Both are not yet verified.</span>}
                </p>
                {settleError && <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded font-semibold">{settleError}</div>}
                <select value={settleMethod} onChange={(e) => setSettleMethod(e.target.value as any)} className="w-full p-2 border border-[#e5ede9] rounded text-[11px] bg-white">
                  <option value="NONE_OUTSTANDING">No outstanding loan</option>
                  <option value="WELFARE_FUND">Welfare fund</option>
                  <option value="INSURER">Insurer</option>
                  <option value="ESTATE_OFFSET">Estate offset (own deposits)</option>
                </select>
                <input
                  value={settleReference}
                  onChange={(e) => setSettleReference(e.target.value)}
                  placeholder="Clearance reference (optional)"
                  className="w-full p-2 border border-[#e5ede9] rounded text-[11px] bg-white"
                />
                <button
                  onClick={() => {
                    setSettleError(null)
                    settleClaim.mutate(
                      { claimId: activeClaim.id, data: { loan_clearance_method: settleMethod, loan_clearance_reference: settleReference.trim() || undefined } },
                      { onError: (err: any) => setSettleError(err?.message || 'Failed to settle claim.') }
                    )
                  }}
                  disabled={!canSettle || settleClaim.isPending}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {settleClaim.isPending ? 'Submitting…' : 'Settle & queue nominee payouts'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ExitsAndClaims() {
  const [tab, setTab] = useState<'refunds' | 'deceased'>('refunds')

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-xl font-bold text-ink">Exits, refunds &amp; deceased-member claims</div>
        <div className="text-xs text-ink-muted">
          Voluntary-exit refund payouts and the deceased-member claim document/settlement workflow.
        </div>
      </div>

      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setTab('refunds')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${tab === 'refunds' ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
        >
          Refund queue
        </button>
        <button
          onClick={() => setTab('deceased')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${tab === 'deceased' ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
        >
          Deceased-member claims
        </button>
      </div>

      {tab === 'refunds' ? <RefundsTab /> : <DeceasedClaimsTab />}
    </div>
  )
}

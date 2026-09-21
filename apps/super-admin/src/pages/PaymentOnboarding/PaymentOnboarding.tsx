import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAllSaccos } from '../../hooks/usePlatformData'
import {
  usePaymentOnboardingQueue,
  useVerifyPaymentConfig,
  useApprovePaymentConfig,
  useRejectPaymentConfig,
} from '../../hooks/usePaymentOnboarding'

const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  VERIFIED: 'bg-blue-50 text-blue-700',
  VERIFICATION_FAILED: 'bg-red-50 text-red-700',
  APPROVED: 'bg-mint-50 text-mint-700',
  REJECTED: 'bg-red-50 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  VERIFICATION_FAILED: 'Verification failed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const OPEN = ['PENDING', 'VERIFIED', 'VERIFICATION_FAILED']

export function PaymentOnboarding() {
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  const { data: submissions, isLoading } = usePaymentOnboardingQueue()
  const { data: saccos } = useAllSaccos()
  const verify = useVerifyPaymentConfig()
  const approve = useApprovePaymentConfig()
  const reject = useRejectPaymentConfig()

  const saccoNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of saccos?.results ?? []) map.set(String(s.id), s.name)
    return map
  }, [saccos])

  const rows = (submissions ?? []).filter(s => (filter === 'open' ? OPEN.includes(s.status) : true))
  const busy = verify.isPending || approve.isPending || reject.isPending

  const run = async (fn: () => Promise<any>, okText: string) => {
    setNotice(null)
    try {
      const result = await fn()
      // Verify reports a failed check as a normal response, not an HTTP error.
      if (result?.status === 'VERIFICATION_FAILED') {
        setNotice({ ok: false, text: result.verification_result || 'Verification failed.' })
      } else {
        setNotice({ ok: true, text: okText })
      }
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Action failed.' })
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setNotice({ ok: false, text: 'A rejection reason is required — the SACCO admin sees it.' })
      return
    }
    await run(() => reject.mutateAsync({ id, reason: rejectReason.trim() }), 'Submission rejected.')
    setRejectingId(null)
    setRejectReason('')
  }

  return (
    <div className="p-5">
      <PageHeader
        title="Payment onboarding"
        subtitle="SACCO M-Pesa payment setups awaiting verification and approval"
        actions={
          <select
            className="py-1.5 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
            value={filter}
            onChange={e => setFilter(e.target.value as 'open' | 'all')}
          >
            <option value="open">Needs action</option>
            <option value="all">All submissions</option>
          </select>
        }
      />

      <p className="text-[11px] text-ink-faint mb-3">
        Verify checks the submitted Daraja app credentials against Safaricom (no money moves). Approving
        turns on M-Pesa payments for that SACCO and replaces its live setup. Passkeys and secrets are never
        shown here — only the paybill/till number and environment.
      </p>

      {notice && (
        <div className={`text-[12px] rounded-lg px-3 py-2 mb-3 ${notice.ok ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'}`}>
          {notice.text}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-ink-muted py-6">Loading submissions…</div>
      ) : rows.length === 0 ? (
        <div className="bg-surface border border-mid rounded-[10px] p-8 text-center text-sm text-ink-muted">
          {filter === 'open' ? 'Nothing waiting for review.' : 'No payment setups submitted yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(s => {
            const isOpen = OPEN.includes(s.status)
            const canVerify = s.status === 'PENDING' || s.status === 'VERIFICATION_FAILED'
            return (
              <div key={s.id} className="bg-surface border border-mid rounded-[10px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-ink">{saccoNames.get(s.sacco_id) ?? s.sacco_id}</div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {s.shortcode_type === 'TILL_NUMBER' ? 'Till' : 'Paybill'} {s.shortcode} ·{' '}
                      <span className={s.environment === 'LIVE' ? 'font-semibold text-red-700' : ''}>
                        {s.environment === 'LIVE' ? 'LIVE' : 'Sandbox'}
                      </span>{' '}
                      · {s.has_own_daraja_app ? 'Own Daraja app' : 'Shared platform app'}
                    </div>
                    <div className="text-[11px] text-ink-faint mt-0.5">
                      Submitted {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                      {s.submitted_by_email ? ` by ${s.submitted_by_email}` : ''}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${STATUS_TONE[s.status] ?? ''}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>

                {s.verification_result && (
                  <p className={`text-[11px] mt-2 ${s.status === 'VERIFICATION_FAILED' ? 'text-red-700' : 'text-ink-muted'}`}>
                    {s.verification_result}
                  </p>
                )}
                {s.status === 'REJECTED' && s.rejection_reason && (
                  <p className="text-[11px] mt-2 text-red-700">Rejected: {s.rejection_reason}</p>
                )}
                {s.reviewed_by_email && !isOpen && (
                  <p className="text-[10px] text-ink-faint mt-1">
                    Reviewed by {s.reviewed_by_email}
                    {s.reviewed_at ? ` on ${new Date(s.reviewed_at).toLocaleDateString()}` : ''}
                  </p>
                )}

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-surface-2">
                    {rejectingId === s.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-2 border border-mid rounded-lg text-[13px] outline-none min-h-[56px]"
                          placeholder="Why is this being rejected? The SACCO admin will see this."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(s.id)}
                            disabled={busy}
                            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            Confirm rejection
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason('') }}
                            className="px-4 py-1.5 rounded-lg border border-mid bg-surface text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {canVerify && (
                          <button
                            onClick={() => run(() => verify.mutateAsync(s.id), 'Credentials verified with Safaricom. Ready to approve.')}
                            disabled={busy}
                            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            {verify.isPending && verify.variables === s.id ? 'Verifying…' : 'Verify'}
                          </button>
                        )}
                        {s.status === 'VERIFIED' && (
                          <button
                            onClick={() => run(() => approve.mutateAsync(s.id), 'Approved — M-Pesa payments are now live for this SACCO.')}
                            disabled={busy}
                            className="px-4 py-1.5 rounded-lg bg-mint-600 hover:bg-mint-700 text-white text-xs font-semibold disabled:opacity-50"
                          >
                            {approve.isPending && approve.variables === s.id ? 'Approving…' : 'Approve & go live'}
                          </button>
                        )}
                        <button
                          onClick={() => setRejectingId(s.id)}
                          disabled={busy}
                          className="px-4 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

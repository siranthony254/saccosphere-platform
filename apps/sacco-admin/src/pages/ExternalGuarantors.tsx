import { useState } from 'react'
import { useExternalGuarantors, useReviewExternalGuarantor } from '../hooks/useExternalGuarantors'
import { InfoTip } from '@saccosphere/ui'
import { Badge } from '../components/ui/Badge'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'violet' | 'neutral'> = {
  PENDING_SMS: 'warning',
  SMS_SENT: 'warning',
  ACCEPTED: 'violet',
  UNDER_ADMIN_REVIEW: 'violet',
  DECLINED: 'error',
  APPROVED_BY_ADMIN: 'success',
  REJECTED_BY_ADMIN: 'error',
}

export function ExternalGuarantors() {
  const { data, isLoading } = useExternalGuarantors()
  const { mutate: reviewGuarantor, isPending: reviewing } = useReviewExternalGuarantor()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const rows = data?.results ?? []
  const pendingReview = rows.filter((g: any) => g.can_approve).length

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink flex items-center gap-1.5">
            External Guarantors
            <InfoTip text="People outside this SACCO who have agreed to guarantee a member's loan — review and confirm their consent here." label="About External Guarantors" />
          </div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total · {pendingReview} awaiting admin review
          </div>
        </div>
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No external guarantors found.
        </div>
      )}

      {isLoading ? (
        [1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        rows.map((guarantor: any) => {
          const statusVariant = STATUS_VARIANT[guarantor.status] ?? 'neutral'
          const isExpanded = activeId === guarantor.id

          return (
            <div key={guarantor.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2.5 items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    EG
                  </div>
                  <div>
                    <div className="font-medium text-sm">{guarantor.guarantor_name}</div>
                    <div className="text-[10px] text-ink-faint font-mono">{guarantor.guarantor_phone}</div>
                  </div>
                </div>
                <div className="text-sm">{guarantor.member_name}</div>
                <div className="text-sm font-semibold">KES {guarantor.amount.toLocaleString()}</div>
                <div className="text-xs text-ink-muted">{guarantor.guarantor_national_id}</div>
                <div>
                  <Badge variant={statusVariant}>{guarantor.status_label}</Badge>
                </div>
                <div className="flex gap-1.5">
                  {!guarantor.is_final ? (
                    <button
                      className="px-3 py-1 rounded-[6px] border-none bg-mint-600 text-white text-xs font-semibold cursor-pointer hover:bg-mint-700 transition-colors"
                      onClick={() => {
                        setActiveId(isExpanded ? null : guarantor.id)
                        setNotes('')
                      }}
                    >
                      {isExpanded ? 'Close' : 'Review'}
                    </button>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-surface-3 pt-3.5 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <div className="font-semibold text-xs text-ink-soft mb-2">Guarantor details</div>
                      {[
                        { l: 'Loan ID', v: guarantor.loan_id ? `${String(guarantor.loan_id).slice(0, 8)}…` : '—' },
                        { l: 'Applicant', v: guarantor.member_name },
                        { l: 'Phone', v: guarantor.guarantor_phone },
                        { l: 'National ID', v: guarantor.guarantor_national_id },
                        { l: 'Employment', v: guarantor.employment_status || '—' },
                        { l: 'Monthly income', v: `KES ${Number(guarantor.monthly_income || 0).toLocaleString()}` },
                        { l: 'Guarantee amount', v: `KES ${guarantor.amount.toLocaleString()}` },
                        { l: 'SMS response', v: guarantor.guarantor_response ?? 'No response yet' },
                        { l: 'Created', v: guarantor.created_at ? new Date(guarantor.created_at).toLocaleDateString() : '—' },
                      ].map((row) => (
                        <div key={row.l} className="flex justify-between py-1 border-b border-ink-faint text-xs last:border-0">
                          <span className="text-ink-muted">{row.l}</span>
                          <span className="font-medium text-ink">{row.v}</span>
                        </div>
                      ))}
                      {(guarantor.id_front_url || guarantor.id_back_url) && (
                        <div className="flex gap-3 mt-2 text-[11px]">
                          {guarantor.id_front_url && (
                            <a href={guarantor.id_front_url} target="_blank" rel="noreferrer" className="text-violet-700 underline">
                              ID front
                            </a>
                          )}
                          {guarantor.id_back_url && (
                            <a href={guarantor.id_back_url} target="_blank" rel="noreferrer" className="text-violet-700 underline">
                              ID back
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      {!guarantor.can_approve && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mb-2">
                          The guarantor must accept the SMS request before you can approve.
                        </div>
                      )}
                      <textarea
                        className="w-full p-2.5 border border-ink-faint rounded-lg text-sm resize-y min-h-[80px] box-border mb-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Review notes (optional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors disabled:opacity-50`}
                          onClick={() =>
                            reviewGuarantor({ id: guarantor.id, action: 'approve', notes }, { onSuccess: () => setActiveId(null) })
                          }
                          disabled={reviewing || !guarantor.can_approve}
                        >
                          {reviewing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          className="flex-1 py-2 rounded-lg border-none bg-red-50 text-red-700 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-50"
                          onClick={() =>
                            reviewGuarantor({ id: guarantor.id, action: 'reject', notes }, { onSuccess: () => setActiveId(null) })
                          }
                          disabled={reviewing}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

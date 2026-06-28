import { useState } from 'react'
import { useExternalGuarantors, useReviewExternalGuarantor } from '../hooks/useExternalGuarantors'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'bg-amber-50', color: 'text-amber-700' },
  APPROVED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  REJECTED: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function ExternalGuarantors() {
  const { data, isLoading } = useExternalGuarantors()
  const { mutate: reviewGuarantor, isPending: reviewing } = useReviewExternalGuarantor()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">External Guarantors</div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total · {data?.results.filter((g) => g.status === 'PENDING').length ?? 0} pending review
          </div>
        </div>
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No external guarantors found.</div>
      )}

      {isLoading ? (
        [1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map((guarantor) => {
          const sc = STATUS_COLORS[guarantor.status] ?? STATUS_COLORS.PENDING
          const isExpanded = activeId === guarantor.id

          return (
            <div key={guarantor.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2.5 items-center mb-3">
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
                  <span className={`${sc.bg} ${sc.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>{guarantor.status}</span>
                </div>
                <div className="flex gap-1.5">
                  {guarantor.status === 'PENDING' ? (
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

              {/* Expanded review panel */}
              {isExpanded && (
                <div className="border-t border-surface-3 pt-3.5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <div className="font-semibold text-xs text-ink-soft mb-2">Guarantor details</div>
                      {[
                        { l: 'Loan ID', v: guarantor.loan_id },
                        { l: 'Member', v: guarantor.member_name },
                        { l: 'Phone', v: guarantor.guarantor_phone },
                        { l: 'National ID', v: guarantor.guarantor_national_id },
                        { l: 'Amount', v: `KES ${guarantor.amount.toLocaleString()}` },
                        { l: 'Created at', v: guarantor.created_at ? new Date(guarantor.created_at).toLocaleDateString() : '—' },
                      ].map((row) => (
                        <div key={row.l} className="flex justify-between py-1 border-b border-ink-faint text-xs">
                          <span className="text-ink-muted">{row.l}</span>
                          <span className="font-medium text-ink">{row.v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <textarea
                        className="w-full p-2.5 border border-ink-faint rounded-lg text-sm resize-y min-h-[80px] box-border mb-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Review notes (optional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors ${reviewing ? 'opacity-60' : ''}`}
                          onClick={() => reviewGuarantor({ id: guarantor.id, action: 'approve', notes }, { onSuccess: () => setActiveId(null) })}
                          disabled={reviewing}
                        >
                          {reviewing ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          className="flex-1 py-2 rounded-lg border-none bg-red-50 text-red-700 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => reviewGuarantor({ id: guarantor.id, action: 'reject', notes }, { onSuccess: () => setActiveId(null) })}
                          disabled={reviewing}
                        >
                          ✗ Reject
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

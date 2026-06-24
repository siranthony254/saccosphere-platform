import { useState } from 'react'
import { useAdminLoans, useReviewLoan } from '../../hooks/useLoans'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  submitted:          { bg: 'bg-amber-50', color: 'text-amber-700' },
  under_review:       { bg: 'bg-blue-50', color: 'text-blue-700' },
  approved:           { bg: 'bg-mint-50', color: 'text-mint-700' },
  rejected:           { bg: 'bg-red-50', color: 'text-red-700' },
  disbursed:          { bg: 'bg-mint-50', color: 'text-mint-700' },
  guarantors_pending: { bg: 'bg-violet-50', color: 'text-violet-700' },
}

export function LoansList() {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data, isLoading } = useAdminLoans({ status: statusFilter === 'all' ? undefined : statusFilter })
  const { mutate: reviewLoan, isPending: reviewing } = useReviewLoan()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Loan review</div>
          <div className="text-xs text-ink-muted">{data?.count ?? 0} total · {data?.results.filter(l => l.status === 'submitted').length ?? 0} pending decision</div>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="submitted">Pending</option>
            <option value="under_review">In review</option>
            <option value="approved">Approved — not disbursed</option>
            <option value="disbursed">Disbursed</option>
          </select>
        </div>
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Loan list data is not available from the current backend admin contract. Admin loan status changes are available via the backend path <code className="font-mono">/api/v1/management/loans/&lt;id&gt;/status/</code>.
        </div>
      )}

      {isLoading ? (
        [1,2,3].map(i => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map(loan => {
          const sc = STATUS_COLORS[loan.status] ?? STATUS_COLORS.submitted
          const isExpanded = activeId === loan.id
          const guarantorsReady = loan.guarantors_confirmed >= loan.guarantors_required

          return (
            <div key={loan.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-2.5 items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-mint-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {loan.member_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{loan.member_name}</div>
                    <div className="text-[10px] text-ink-faint font-mono">{loan.ref}</div>
                  </div>
                </div>
                <div className="text-sm">{loan.loan_product_label}</div>
                <div className="text-sm font-semibold">KES {loan.amount_requested.toLocaleString()}</div>
                <div className="text-xs text-ink-muted">{loan.period_months} mo</div>
                <div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${guarantorsReady ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'}`}>
                    {loan.guarantors_confirmed}/{loan.guarantors_required} guarantors
                  </span>
                </div>
                <div>
                  <span className={`${sc.bg} ${sc.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>{loan.status}</span>
                </div>
                <div className="flex gap-1.5">
                  {loan.status === 'submitted' || loan.status === 'under_review' ? (
                    <button
                      className="px-3 py-1 rounded-[6px] border-none bg-mint-600 text-white text-xs font-semibold cursor-pointer hover:bg-mint-700 transition-colors"
                      onClick={() => { setActiveId(isExpanded ? null : loan.id); setNotes('') }}
                    >
                      {isExpanded ? 'Close' : 'Review'}
                    </button>
                  ) : loan.status === 'approved' ? (
                    <button
                      className="px-3 py-1 rounded-[6px] border-none bg-slate-200 text-slate-600 text-xs font-semibold cursor-not-allowed"
                      disabled
                    >
                      Review in backend
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
                      <div className="font-semibold text-xs text-ink-soft mb-2">Loan summary</div>
                      {[
                        { l: 'Interest rate', v: `${loan.interest_rate}% p.a.` },
                        { l: 'Monthly instalment', v: `KES ${loan.monthly_instalment.toLocaleString()}` },
                        { l: 'Disbursement', v: `${loan.disbursement_method} · ${loan.disbursement_account}` },
                      ].map(row => (
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
                        onChange={e => setNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors ${reviewing ? 'opacity-60' : ''}`}
                          onClick={() => reviewLoan({ id: loan.id, action: 'approve', notes }, { onSuccess: () => setActiveId(null) })}
                          disabled={reviewing}
                        >
                          {reviewing ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          className="flex-1 py-2 rounded-lg border-none bg-red-50 text-red-700 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => reviewLoan({ id: loan.id, action: 'reject', notes }, { onSuccess: () => setActiveId(null) })}
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
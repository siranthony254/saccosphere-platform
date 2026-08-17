import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useAdminLoans, useReviewLoan, useDisburseLoan } from '../../hooks/useLoans'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING_APPROVAL: { bg: 'bg-amber-50', color: 'text-amber-700' },
  UNDER_REVIEW: { bg: 'bg-blue-50', color: 'text-blue-700' },
  APPROVED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  REJECTED: { bg: 'bg-red-50', color: 'text-red-700' },
  DISBURSED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  BOARD_REVIEW: { bg: 'bg-violet-50', color: 'text-violet-700' },
}

// Strict backend status transition rules:
// PENDING_APPROVAL / BOARD_REVIEW -> UNDER_REVIEW or REJECTED
// UNDER_REVIEW -> APPROVED or REJECTED
// APPROVED -> DISBURSED
const VALID_TRANSITIONS: Record<string, { canMoveToReview: boolean; canApprove: boolean; canReject: boolean; canDisburse: boolean }> = {
  PENDING_APPROVAL: { canMoveToReview: true, canApprove: false, canReject: true, canDisburse: false },
  BOARD_REVIEW: { canMoveToReview: true, canApprove: false, canReject: true, canDisburse: false },
  UNDER_REVIEW: { canMoveToReview: false, canApprove: true, canReject: true, canDisburse: false },
  APPROVED: { canMoveToReview: false, canApprove: false, canReject: false, canDisburse: true },
  REJECTED: { canMoveToReview: false, canApprove: false, canReject: false, canDisburse: false },
  DISBURSED: { canMoveToReview: false, canApprove: false, canReject: false, canDisburse: false },
}

export function LoansList() {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data, isLoading } = useAdminLoans({ status: statusFilter === 'all' ? undefined : statusFilter })
  const { mutate: reviewLoan, isPending: reviewing } = useReviewLoan()
  const { mutate: disburseLoan, isPending: disbursing } = useDisburseLoan()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Amortization Schedule Modal state
  const [scheduleLoanId, setScheduleLoanId] = useState<string | null>(null)
  const [scheduleLoanInfo, setScheduleLoanInfo] = useState<any>(null)

  const { data: scheduleItems, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['loan-schedule', scheduleLoanId],
    queryFn: () => api.loans.getSchedule(scheduleLoanId!),
    enabled: Boolean(scheduleLoanId),
  })

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message })
    setTimeout(() => setAlertInfo(null), 3000)
  }

  const handleReview = (loan: any, action: 'under_review' | 'approve' | 'reject') => {
    if (action === 'approve' && loan.crb_listed_negative && overrideReason.trim().length < 10) {
      showAlert('error', 'CRB check shows negative listing. Override reason (min 10 characters) is required.')
      return
    }

    reviewLoan(
      { id: loan.loan_id, action, notes, override_reason: overrideReason },
      {
        onSuccess: () => {
          setActiveId(null)
          setNotes('')
          setOverrideReason('')
          const msg = action === 'under_review' ? 'moved to under review' : action === 'approve' ? 'approved' : 'rejected'
          showAlert('success', `Loan ${msg} successfully`)
        },
        onError: (error: any) => {
          console.error('Failed to process loan:', error)
          showAlert('error', error?.response?.data?.detail || error?.message || 'Failed to process loan. Please try again.')
        }
      }
    )
  }

  const handleDisburse = (loan: any) => {
    disburseLoan(
      { loanId: loan.loan_id, notes },
      {
        onSuccess: () => {
          setActiveId(null)
          setNotes('')
          setOverrideReason('')
          showAlert('success', `Loan disbursed successfully`)
        },
        onError: (error: any) => {
          console.error('Failed to disburse loan:', error)
          showAlert('error', error?.response?.data?.detail || error?.message || 'Failed to disburse loan. Please try again.')
        }
      }
    )
  }

  return (
    <div className="p-5 relative">
      {alertInfo && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg ${alertInfo.type === 'success' ? 'bg-mint-500 text-white' : 'bg-red-500 text-white'}`}>
          {alertInfo.message}
        </div>
      )}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Loan review</div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total · {data?.results.filter((l: any) => l.status === 'PENDING_APPROVAL').length ?? 0} pending decision
          </div>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Loan status filter"
            title="Loan status filter"
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="UNDER_REVIEW">In review</option>
            <option value="APPROVED">Approved — not disbursed</option>
            <option value="DISBURSED">Disbursed</option>
          </select>
        </div>
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No loan approvals found.</div>
      )}

      {isLoading ? (
        [1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map((loan: any) => {
          const sc = STATUS_COLORS[loan.status] ?? STATUS_COLORS.PENDING_APPROVAL
          const isExpanded = activeId === loan.loan_id
          const rules = VALID_TRANSITIONS[loan.status] ?? { canMoveToReview: false, canApprove: false, canReject: false, canDisburse: false }

          return (
            <div key={loan.loan_id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_auto] gap-2.5 items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-mint-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(loan.member_name || 'M').split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{loan.member_name}</div>
                    <div className="text-[10px] text-ink-faint font-mono">{loan.member_number}</div>
                  </div>
                </div>
                <div className="text-sm">{loan.loan_type_name || '—'}</div>
                <div className="text-sm font-semibold">KES {loan.amount.toLocaleString()}</div>
                <div className="text-xs text-ink-muted">{loan.term_months} mo</div>
                <div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted">
                    Guarantors
                  </span>
                </div>
                <div>
                  <span className={`${sc.bg} ${sc.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>{loan.status}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className="px-2.5 py-1 rounded-[6px] border border-ink-faint bg-white hover:bg-surface-2 text-ink text-xs font-semibold cursor-pointer transition-colors"
                    onClick={() => {
                      setScheduleLoanId(loan.loan_id)
                      setScheduleLoanInfo(loan)
                    }}
                  >
                    📅 Schedule
                  </button>
                  {rules.canMoveToReview || rules.canApprove || rules.canDisburse ? (
                    <button
                      className={`px-3 py-1 rounded-[6px] border-none text-white text-xs font-semibold cursor-pointer transition-colors ${
                        loan.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-mint-600 hover:bg-mint-700'
                      }`}
                      onClick={() => {
                        setActiveId(isExpanded ? null : loan.loan_id)
                        setNotes('')
                        setOverrideReason('')
                      }}
                    >
                      {isExpanded ? 'Close' : loan.status === 'APPROVED' ? 'Disburse' : loan.status === 'UNDER_REVIEW' ? 'Approve/Reject' : 'Review'}
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
                        { l: 'Current status', v: loan.status },
                        { l: 'Loan type', v: loan.loan_type_name || '—' },
                        { l: 'Term', v: `${loan.term_months} months` },
                        { l: 'Applied at', v: loan.applied_at ? new Date(loan.applied_at).toLocaleDateString() : '—' },
                        { l: 'Notes', v: loan.application_notes || 'None' },
                        { l: 'CRB Score', v: loan.crb_score != null ? `${loan.crb_score} (${loan.crb_status || '—'})` : 'No CRB record' },
                      ].map((row) => (
                        <div key={row.l} className="flex justify-between py-1 border-b border-ink-faint text-xs">
                          <span className="text-ink-muted">{row.l}</span>
                          <span className="font-medium text-ink">{row.v}</span>
                        </div>
                      ))}

                      {loan.crb_listed_negative && (
                        <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                          ⚠️ CRB Warning: Negative listing detected. Approval requires an override reason (min 10 chars).
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-ink-muted mb-2">
                        {loan.status === 'PENDING_APPROVAL' || loan.status === 'BOARD_REVIEW'
                          ? 'Step 1: Move loan to UNDER_REVIEW before approval'
                          : loan.status === 'UNDER_REVIEW'
                          ? 'Step 2: Approve or Reject loan'
                          : loan.status === 'APPROVED'
                          ? 'Step 3: Disburse funds to borrower'
                          : 'No valid actions'}
                      </div>

                      <textarea
                        className="w-full p-2.5 border border-ink-faint rounded-lg text-sm resize-y min-h-[70px] box-border mb-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Review notes (optional)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />

                      {loan.crb_listed_negative && rules.canApprove && (
                        <div className="mb-2.5">
                          <label className="block text-[11px] font-bold text-red-700 mb-1">
                            CRB Override Reason (Required for approval - min 10 chars):
                          </label>
                          <textarea
                            className="w-full p-2.5 border border-red-300 rounded-lg text-sm resize-y min-h-[60px] box-border focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50/50"
                            placeholder="State justification for approving despite negative CRB listing..."
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {rules.canDisburse && (
                          <button
                            className={`flex-1 py-2 rounded-lg border-none bg-blue-600 text-white text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors ${disbursing ? 'opacity-60' : ''}`}
                            onClick={() => handleDisburse(loan)}
                            disabled={disbursing}
                          >
                            {disbursing ? 'Processing...' : '💸 Disburse Funds'}
                          </button>
                        )}

                        {rules.canMoveToReview && (
                          <button
                            className={`flex-1 py-2 rounded-lg border-none text-white text-sm font-semibold cursor-pointer bg-blue-600 hover:bg-blue-700 transition-colors ${reviewing ? 'opacity-60' : ''}`}
                            onClick={() => handleReview(loan, 'under_review')}
                            disabled={reviewing}
                          >
                            {reviewing ? 'Processing...' : '📋 Move to Under Review'}
                          </button>
                        )}

                        {rules.canApprove && (
                          <button
                            className={`flex-1 py-2 rounded-lg border-none text-white text-sm font-semibold cursor-pointer bg-mint-600 hover:bg-mint-700 transition-colors ${reviewing ? 'opacity-60' : ''}`}
                            onClick={() => handleReview(loan, 'approve')}
                            disabled={reviewing}
                          >
                            {reviewing ? 'Processing...' : '✓ Approve Loan'}
                          </button>
                        )}

                        {rules.canReject && (
                          <button
                            className={`flex-1 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 transition-colors ${reviewing ? 'opacity-60' : ''}`}
                            onClick={() => handleReview(loan, 'reject')}
                            disabled={reviewing}
                          >
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Amortization Repayment Schedule Modal */}
      {scheduleLoanId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#e5ede9]">
              <div>
                <div className="text-lg font-bold text-ink">Loan Amortization Schedule</div>
                <div className="text-xs text-ink-muted">
                  Borrower: {scheduleLoanInfo?.member_name} ({scheduleLoanInfo?.member_number})
                </div>
              </div>
              <button
                onClick={() => {
                  setScheduleLoanId(null)
                  setScheduleLoanInfo(null)
                }}
                className="p-1 rounded-lg border border-ink-faint hover:bg-surface-2 text-ink text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="my-4 grid grid-cols-3 gap-3 bg-surface-2 p-3 rounded-lg text-xs">
              <div>
                <span className="text-ink-muted block">Principal Amount</span>
                <span className="font-bold text-sm text-ink">KES {Number(scheduleLoanInfo?.amount ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-ink-muted block">Repayment Term</span>
                <span className="font-bold text-sm text-ink">{scheduleLoanInfo?.term_months} Months</span>
              </div>
              <div>
                <span className="text-ink-muted block">Loan Status</span>
                <span className="font-bold text-sm text-violet-700">{scheduleLoanInfo?.status}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="text-xs font-bold text-ink uppercase tracking-wider">Instalment Schedule Breakdown</div>
              <div className="overflow-x-auto border border-[#e5ede9] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Principal</th>
                      <th className="py-2.5 px-3 text-right">Interest</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance After</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ede9]">
                    {isScheduleLoading ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-ink-muted">
                          Loading schedule breakdown...
                        </td>
                      </tr>
                    ) : (scheduleItems ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-ink-muted">
                          No schedule items generated yet for this loan.
                        </td>
                      </tr>
                    ) : (
                      (scheduleItems ?? []).map((inst: any) => {
                        const statusColors: Record<string, string> = {
                          paid: 'bg-mint-50 text-mint-700',
                          pending: 'bg-amber-50 text-amber-700',
                          overdue: 'bg-red-50 text-red-700',
                          partial: 'bg-blue-50 text-blue-700',
                        }
                        const st = String(inst.status || 'pending').toLowerCase()
                        return (
                          <tr key={inst.instalment_number} className="hover:bg-surface-1">
                            <td className="py-2.5 px-3 font-semibold">{inst.instalment_number}</td>
                            <td className="py-2.5 px-3 text-ink-muted">
                              {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-ink">
                              KES {Number(inst.principal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                              KES {Number(inst.interest ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-ink">
                              KES {Number(inst.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right text-ink-muted font-medium">
                              KES {Number(inst.balance_after ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[st] || 'bg-gray-100 text-gray-700'}`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



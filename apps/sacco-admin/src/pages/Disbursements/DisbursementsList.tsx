import { useState } from 'react'
import { useAdminLoans, useDisburseLoan } from '../../hooks/useLoans'

export function DisbursementsList() {
  const [statusFilter, setStatusFilter] = useState('approved')
  const { data, isLoading } = useAdminLoans({ status: statusFilter === 'all' ? undefined : statusFilter })
  const { mutate: disburse, isPending: disbursing } = useDisburseLoan()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Loan disbursements</div>
          <div className="text-xs text-ink-muted">{data?.results.filter(l => l.status === 'approved').length ?? 0} approved loans awaiting disbursement</div>
        </div>
        <div className="flex gap-2">
          <select aria-label="Loan status filter" 
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="approved">Approved — not disbursed</option>
            <option value="disbursed">Disbursed</option>
            <option value="all">All statuses</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        [1,2,3].map(i => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map(loan => {
          const isExpanded = activeId === loan.id
          const canDisburse = loan.status === 'approved'

          return (
            <div key={loan.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-2.5 items-center mb-3">
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
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${canDisburse ? 'bg-mint-50 text-mint-700' : 'bg-surface-2 text-ink-muted'}`}>
                    {loan.status}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {canDisburse ? (
                    <button
                      className="px-3 py-1 rounded-[6px] border-none bg-violet-500 text-white text-xs font-semibold cursor-pointer hover:bg-violet-600 transition-colors"
                      onClick={() => { setActiveId(isExpanded ? null : loan.id); setPhone(''); setAmount(loan.amount_requested.toString()) }}
                    >
                      {isExpanded ? 'Close' : 'Disburse'}
                    </button>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </div>
              </div>

              {/* Expanded disbursement panel */}
              {isExpanded && (
                <div className="border-t border-surface-3 pt-3.5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <div className="font-semibold text-xs text-ink-soft mb-2">Loan summary</div>
                      {[
                        { l: 'Interest rate', v: `${loan.interest_rate}% p.a.` },
                        { l: 'Monthly instalment', v: `KES ${loan.monthly_instalment.toLocaleString()}` },
                        { l: 'Disbursement method', v: loan.disbursement_method },
                        { l: 'Disbursement account', v: loan.disbursement_account },
                      ].map(row => (
                        <div key={row.l} className="flex justify-between py-1 border-b border-ink-faint text-xs">
                          <span className="text-ink-muted">{row.l}</span>
                          <span className="font-medium text-ink">{row.v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-3">
                        <label className="text-xs font-medium text-ink-soft mb-1 block">M-Pesa Phone Number</label>
                        <input
                          type="text"
                          title="M-Pesa phone number"
                          className="w-full p-2.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="text-xs font-medium text-ink-soft mb-1 block">Disbursement Amount (KES)</label>
                        <input
                          type="number"
                          title="Disbursement amount"
                          className="w-full p-2.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border-none bg-violet-500 text-white text-sm font-semibold cursor-pointer hover:bg-violet-600 transition-colors ${disbursing ? 'opacity-60' : ''}`}
                          onClick={() => disburse({ 
                            loanId: loan.id, 
                            amount: Number(amount), 
                            phone_number: phone,
                            remarks: 'Loan disbursement via M-Pesa B2C'
                          }, { onSuccess: () => setActiveId(null) })}
                          disabled={disbursing || !phone || !amount}
                        >
                          {disbursing ? 'Processing...' : '📱 Disburse via M-Pesa'}
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
                          onClick={() => setActiveId(null)}
                        >
                          Cancel
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

import { useState } from 'react'
import { useAdminLoans, useDisburseLoan, useDisbursementHistory, useB2CStatus } from '../../hooks/useLoans'

function B2CStatusBadge({ conversationId }: { conversationId: string }) {
  const { data } = useB2CStatus(conversationId)
  if (!data) return <span className="text-[10px] text-ink-faint italic font-mono">{conversationId}</span>
  
  const status = data.status.toLowerCase()
  const colorClass = status === 'completed' || status === 'success' ? 'text-mint-700 bg-mint-50' : 
                    status === 'failed' ? 'text-red-700 bg-red-50' : 
                    'text-amber-700 bg-amber-50'
  
  return (
    <div className="flex flex-col items-end">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>{status.toUpperCase()}</span>
      <span className="text-[9px] text-ink-faint font-mono mt-0.5">{conversationId}</span>
    </div>
  )
}

export function DisbursementsList() {
  const [view, setView] = useState<'pending' | 'history'>('pending')
  const { data: loansData, isLoading: loadingLoans } = useAdminLoans({ status: 'approved' })
  const { data: historyData, isLoading: loadingHistory } = useDisbursementHistory()
  const { mutate: disburse, isPending: disbursing } = useDisburseLoan()
  
  const [activeId, setActiveId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [lastConvId, setLastConvId] = useState<string | null>(null)

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Loan disbursements</div>
          <div className="text-xs text-ink-muted">M-Pesa B2C Payouts</div>
        </div>
        <div className="flex bg-white border border-ink-faint rounded-lg p-1">
          <button 
            onClick={() => setView('pending')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'pending' ? 'bg-violet-500 text-white' : 'text-ink-muted hover:bg-surface-2'}`}
          >
            Pending ({loansData?.results.length ?? 0})
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'history' ? 'bg-violet-500 text-white' : 'text-ink-muted hover:bg-surface-2'}`}
          >
            History
          </button>
        </div>
      </div>

      {lastConvId && (
        <div className="mb-5 bg-mint-50 border border-mint-200 rounded-lg p-3 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-mint-800">Disbursement initiated</div>
            <div className="text-xs text-mint-700">Check the history tab for progress.</div>
          </div>
          <B2CStatusBadge conversationId={lastConvId} />
        </div>
      )}

      {view === 'pending' ? (
        <>
          {loadingLoans ? (
            [1,2,3].map(i => <div key={i} className="h-[100px] bg-ink-faint rounded-[10px] mb-2.5" />)
          ) : (loansData?.results ?? []).length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-10 text-center text-sm text-amber-800">
              No approved loans awaiting disbursement.
            </div>
          ) : (
            (loansData?.results ?? []).map(loan => {
              const isExpanded = activeId === loan.id
              return (
                <div key={loan.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
                  <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_auto] gap-2.5 items-center">
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
                    <div className="text-sm font-semibold text-ink">KES {loan.amount_requested.toLocaleString()}</div>
                    <div className="text-xs text-ink-muted">{loan.period_months} mo</div>
                    <div>
                      <span className="bg-mint-50 text-mint-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">APPROVED</span>
                    </div>
                    <button
                      className="px-4 py-1.5 rounded-lg border-none bg-violet-500 text-white text-xs font-semibold cursor-pointer hover:bg-violet-600 transition-colors"
                      onClick={() => { setActiveId(isExpanded ? null : loan.id); setPhone(''); setAmount(loan.amount_requested.toString()) }}
                    >
                      {isExpanded ? 'Close' : 'Disburse'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-surface-3 mt-3.5 pt-3.5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-surface-2 rounded-lg p-3">
                          <div className="font-semibold text-xs text-ink-soft mb-2 uppercase tracking-wider">Loan summary</div>
                          {[
                            { l: 'Interest rate', v: `${loan.interest_rate}% p.a.` },
                            { l: 'Monthly instalment', v: `KES ${loan.monthly_instalment.toLocaleString()}` },
                            { l: 'Disbursement method', v: loan.disbursement_method.toUpperCase() },
                            { l: 'Disbursement account', v: loan.disbursement_account || '—' },
                          ].map(row => (
                            <div key={row.l} className="flex justify-between py-1.5 border-b border-ink-faint text-xs last:border-0">
                              <span className="text-ink-muted">{row.l}</span>
                              <span className="font-medium text-ink">{row.v}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="mb-3">
                            <label className="text-[11px] font-bold text-ink-soft mb-1 block uppercase tracking-wider">M-Pesa Phone Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 254712345678"
                              className="w-full p-2.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                            />
                          </div>
                          <div className="mb-4">
                            <label className="text-[11px] font-bold text-ink-soft mb-1 block uppercase tracking-wider">Disbursement Amount (KES)</label>
                            <input
                              type="number"
                              className="w-full p-2.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              className={`flex-1 py-2.5 rounded-lg border-none bg-violet-600 text-white text-sm font-bold cursor-pointer hover:bg-violet-700 transition-colors ${disbursing ? 'opacity-60' : ''}`}
                              onClick={() => disburse({ 
                                loanId: loan.id, 
                                amount: Number(amount), 
                                phone_number: phone,
                                remarks: 'Loan disbursement via M-Pesa B2C'
                              }, { 
                                onSuccess: (data: any) => { 
                                  setActiveId(null); 
                                  setLastConvId(data.conversation_id || data.checkout_request_id);
                                } 
                              })}
                              disabled={disbursing || !phone || !amount}
                            >
                              {disbursing ? 'Processing...' : '📱 Initiate M-Pesa Payout'}
                            </button>
                            <button
                              className="px-4 py-2.5 rounded-lg border border-ink-faint bg-white text-sm font-medium cursor-pointer hover:bg-surface-2 transition-colors"
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
        </>
      ) : (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-[#e5ede9]">
                {['Date', 'Phone', 'Amount (KES)', 'Status / Conv. ID'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] text-ink-muted font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={4} className="p-4"><div className="h-5 bg-ink-faint rounded" /></td></tr>)
              ) : (historyData?.results ?? []).length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-ink-muted italic text-sm">No disbursement history found.</td></tr>
              ) : (
                (historyData?.results ?? []).map((item: any) => (
                  <tr key={item.id} className="border-b border-surface-3 last:border-0 hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3 text-xs">{new Date(item.date).toLocaleString('en-KE')}</td>
                    <td className="px-4 py-3 text-sm font-medium">{item.phone_number}</td>
                    <td className="px-4 py-3 text-sm font-bold">KES {item.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <B2CStatusBadge conversationId={item.conversation_id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

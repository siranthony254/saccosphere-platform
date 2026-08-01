import React, { useState } from 'react'
import { useAdminLoans, useManualDisburseLoan, useDisbursementHistory, useB2CStatus } from '../../hooks/useLoans'
import { useDisbursementsDashboard } from '../../hooks/useSaccoAdminDashboard'

function B2CStatusBadge({ conversationId }: { conversationId: string }) {
  const { data } = useB2CStatus(conversationId)
  if (!data) return <span className="text-[10px] text-ink-faint italic font-mono">{conversationId}</span>
  
  const status = data.status.toLowerCase()
  const colorClass = status === 'completed' || status === 'success' ? 'text-mint-700 bg-mint-50' : 
                    status === 'failed' ? 'text-red-700 bg-red-50' : 
                    'text-amber-700 bg-amber-50'
  
  return (
    <div className="flex flex-col">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${colorClass}`}>
        {status === 'completed' || status === 'success' ? 'âœ“ DISBURSED' : status === 'failed' ? 'âœ— FAILED' : status.toUpperCase()}
      </span>
      <span className="text-[9px] text-ink-faint font-mono mt-0.5">{conversationId}</span>
    </div>
  )
}

export function DisbursementsList() {
  const [view, setView] = useState<'pending' | 'history'>('pending')
  const { data: dashboard } = useDisbursementsDashboard()
  const { data: loansData, isLoading: loadingLoans } = useAdminLoans({ status: 'approved' })
  const { data: historyData, isLoading: loadingHistory } = useDisbursementHistory()
  const { mutate: disburse, isPending: disbursing } = useManualDisburseLoan()

  
  const [activeId, setActiveId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [lastConvId, setLastConvId] = useState<string | null>(null)

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-xl font-bold text-ink">Loan disbursements</div>
          <div className="text-sm text-ink-muted mt-1">Approved loans ready to disburse via M-Pesa / bank</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white border border-[#e5ede9] rounded-lg p-1">
            <button 
              onClick={() => setView('pending')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'pending' ? 'bg-[#0d7a4e] text-white' : 'text-ink-muted hover:bg-surface-2'}`}
            >
              Pending ({loansData?.results.length ?? 0})
            </button>
            <button 
              onClick={() => setView('history')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'history' ? 'bg-[#0d7a4e] text-white' : 'text-ink-muted hover:bg-surface-2'}`}
            >
              History
            </button>
          </div>
          <button className="px-4 py-2 rounded-lg border border-[#e5ede9] bg-white text-sm font-medium text-ink-soft hover:bg-surface-2 transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Disbursed today</div>
          <div className="text-2xl font-bold text-ink mb-1">KES {dashboard?.disbursed_today?.total_amount?.toLocaleString() ?? '0'}</div>
          <div className="text-xs text-mint-700 font-medium">â–² {dashboard?.disbursed_today?.count ?? 0} transactions</div>
        </div>
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Pending disbursement</div>
          <div className="text-2xl font-bold text-ink mb-1">KES {dashboard?.pending_disbursement?.total_amount?.toLocaleString() ?? '0'}</div>
          <div className="text-xs text-amber-600 font-medium">{dashboard?.pending_disbursement?.count ?? 0} approved, not yet sent</div>
        </div>
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Total disbursed</div>
          <div className="text-2xl font-bold text-ink mb-1">KES {dashboard?.total_disbursements?.total_amount?.toLocaleString() ?? '0'}</div>
          <div className="text-xs text-ink-faint font-medium">All time</div>
        </div>
      </div>

      {lastConvId && (
        <div className="mb-5 bg-mint-50 border border-mint-200 rounded-lg p-3 flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-mint-800">Disbursement initiated</div>
            <div className="text-xs text-mint-700">Check the history tab for progress.</div>
          </div>
          <div className="flex flex-col items-end">
             <B2CStatusBadge conversationId={lastConvId} />
          </div>
        </div>
      )}

      {view === 'pending' ? (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-[#e5ede9]">
                {['Member', 'Amount', 'Loan ref', 'Disbursement method', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] text-ink-muted font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingLoans ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={7} className="p-5"><div className="h-5 bg-ink-faint rounded" /></td></tr>)
              ) : (loansData?.results ?? []).length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-ink-muted italic text-sm">No approved loans awaiting disbursement.</td></tr>
              ) : (
                (loansData?.results ?? []).map((loan: any) => {
                  const loanId = loan.loan_id || loan.id
                  const loanAmount = loan.amount ?? loan.amount_requested ?? 0
                  const loanPhone = loan.phone_number || loan.member_phone || ''
                  const isExpanded = activeId === loanId
                  const initials = (loan.member_name || 'M').split(' ').map((n: any) => n[0]).join('')
                  const productLabel = loan.loan_type_name || loan.loan_product_label || 'Loan'
                  const termMonths = loan.term_months || loan.period_months || 0

                  return (
                    <React.Fragment key={loanId}>
                      <tr className="border-b border-surface-3 last:border-0 hover:bg-surface-1 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0d7a4e] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {initials}
                            </div>
                            <span className="font-medium">{loan.member_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-ink">KES {loanAmount.toLocaleString()}</td>
                        <td className="px-5 py-3 font-mono text-xs text-ink-muted">{loanId}</td>
                        <td className="px-5 py-3 text-xs">
                           <span className="text-ink-soft">MPESA</span>
                           {loanPhone && <span className="text-ink-faint ml-1">· {loanPhone}</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-muted">Pending</td>
                        <td className="px-5 py-3">
                          <span className="bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Approved — not sent
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            className="px-3 py-1.5 rounded bg-[#0d7a4e] text-white text-[11px] font-semibold cursor-pointer hover:bg-[#0b6340] transition-colors whitespace-nowrap"
                            onClick={() => { setActiveId(isExpanded ? null : loanId); setPhone(loanPhone); setAmount(loanAmount.toString()) }}
                          >
                            {isExpanded ? 'Close' : 'Send via M-Pesa'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-surface-3 bg-surface-1">
                            <div className="p-5 border-l-4 border-[#0d7a4e]">
                              <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white border border-[#e5ede9] rounded-lg p-4">
                                  <div className="font-semibold text-xs text-ink-soft mb-3 uppercase tracking-wider">Loan summary</div>
                                  {[
                                    { l: 'Product', v: productLabel },
                                    { l: 'Term', v: `${termMonths} months` },
                                    { l: 'Amount', v: `KES ${loanAmount.toLocaleString()}` },
                                  ].map(row => (
                                    <div key={row.l} className="flex justify-between py-2 border-b border-ink-faint text-xs last:border-0">
                                      <span className="text-ink-muted">{row.l}</span>
                                      <span className="font-medium text-ink">{row.v}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="mb-4">
                                    <label className="text-[11px] font-bold text-ink-soft mb-1.5 block uppercase tracking-wider">M-Pesa Phone Number</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 254712345678"
                                      className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:outline-none focus:border-[#0d7a4e]"
                                      value={phone}
                                      onChange={e => setPhone(e.target.value)}
                                    />
                                  </div>
                                  <div className="mb-5">
                                    <label className="text-[11px] font-bold text-ink-soft mb-1.5 block uppercase tracking-wider">Disbursement Amount (KES)</label>
                                    <input
                                      type="number"
                                      className="w-full p-2.5 border border-[#e5ede9] rounded-lg text-sm focus:outline-none focus:border-[#0d7a4e] font-semibold"
                                      value={amount}
                                      onChange={e => setAmount(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      className={`px-5 py-2.5 rounded-lg border-none bg-[#0d7a4e] text-white text-sm font-bold cursor-pointer hover:bg-[#0b6340] transition-colors ${disbursing ? 'opacity-60' : ''}`}
                                      onClick={() => disburse({ 
                                        loanId: loanId, 
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
                                      {disbursing ? 'Processing...' : '📱 Initiate Payout'}
                                    </button>
                                    <button
                                      className="px-5 py-2.5 rounded-lg border border-[#e5ede9] bg-white text-sm font-medium cursor-pointer hover:bg-surface-2 transition-colors"
                                      onClick={() => setActiveId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-[#e5ede9]">
                {['Date', 'Phone', 'Amount (KES)', 'Status / Conv. ID'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] text-ink-muted font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={4} className="p-5"><div className="h-5 bg-ink-faint rounded" /></td></tr>)
              ) : (historyData?.results ?? []).length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-ink-muted italic text-sm">No disbursement history found.</td></tr>
              ) : (
                (historyData?.results ?? []).map((item: any) => (
                  <tr key={item.id} className="border-b border-surface-3 last:border-0 hover:bg-surface-1 transition-colors">
                    <td className="px-5 py-3 text-xs">{new Date(item.date).toLocaleString('en-KE')}</td>
                    <td className="px-5 py-3 text-sm font-medium">{item.phone_number}</td>
                    <td className="px-5 py-3 text-sm font-bold">KES {item.amount.toLocaleString()}</td>
                    <td className="px-5 py-3">
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

import { useState } from 'react'
import {
  useDividendDeclarations,
  useCreateDividendDeclaration,
  useCalculateDividend,
  useApproveDividend,
  useDisburseDividend,
  useDividendPayouts,
  useSavingsTypes,
} from '../../hooks/useDividends'
import { useSacco } from '../../hooks/useSacco'
import type { DividendDeclaration, DividendPayout } from '@saccosphere/schemas'

const statusStyles: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: 'bg-amber-50', color: 'text-amber-700' },
  CALCULATING: { bg: 'bg-blue-50', color: 'text-blue-700' },
  CALCULATED: { bg: 'bg-blue-50', color: 'text-blue-700' },
  APPROVED: { bg: 'bg-violet-50', color: 'text-violet-700' },
  DISBURSING: { bg: 'bg-violet-50', color: 'text-violet-700' },
  DISBURSED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  FAILED: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function Dividends() {
  const lastYear = new Date().getFullYear() - 1
  const [activeTab, setActiveTab] = useState<'declarations' | 'payouts'>('declarations')
  const [showDeclareModal, setShowDeclareModal] = useState(false)
  const [financialYear, setFinancialYear] = useState(String(lastYear))
  const [ratePct, setRatePct] = useState(10)
  const [savingsTypeId, setSavingsTypeId] = useState('')
  const [periodStart, setPeriodStart] = useState(`${lastYear}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(`${lastYear}-12-31`)

  const { data: sacco } = useSacco()
  const { data: savingsTypes = [] } = useSavingsTypes(sacco?.id)

  const { data: declarations, isLoading: isDeclarationsLoading } = useDividendDeclarations()
  const { data: payouts, isLoading: isPayoutsLoading } = useDividendPayouts()

  const { mutate: createDeclaration, isPending: isCreating } = useCreateDividendDeclaration()
  const calculateMutation = useCalculateDividend()
  const approveMutation = useApproveDividend()
  const disburseMutation = useDisburseDividend()

  // calculate/disburse now queue a background job (202) instead of
  // completing inline, so "in progress" has to come from the declaration's
  // own status (kept fresh by useDividendDeclarations' polling), not just
  // this mutation's isPending — the 202 response lands almost instantly,
  // well before the job actually finishes.
  const handleCalculate = (id: string) => {
    calculateMutation.mutate(id, {
      onError: (err: any) => {
        if (err?.status === 409) {
          alert('A calculation is already running for this declaration — wait for it to finish.')
        } else {
          alert(err?.message || 'Failed to start dividend calculation.')
        }
      },
    })
  }

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onError: (err: any) => {
        if (err?.status === 403) {
          alert(err?.message || 'This declaration needs to be approved by a different admin than whoever created it.')
        } else {
          alert(err?.message || 'Failed to approve dividend declaration.')
        }
      },
    })
  }

  const handleDisburse = (id: string) => {
    disburseMutation.mutate(id, {
      onError: (err: any) => {
        if (err?.status === 409) {
          alert('Disbursement is already running for this declaration — wait for it to finish.')
        } else {
          alert(err?.message || 'Failed to start dividend disbursement.')
        }
      },
    })
  }

  const handleDeclare = (e: React.FormEvent) => {
    e.preventDefault()
    if (!savingsTypeId) {
      alert('Select a savings type for this declaration.')
      return
    }
    createDeclaration(
      {
        savings_type: savingsTypeId,
        financial_year: financialYear.trim(),
        declared_rate: Number(ratePct),
        period_start: periodStart,
        period_end: periodEnd,
      },
      {
        onSuccess: () => {
          setShowDeclareModal(false)
          alert('Dividend declaration created successfully!')
        },
        onError: (err: any) => alert(err?.message || 'Failed to create dividend declaration.'),
      }
    )
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Dividends & Share Capital Distribution</div>
          <div className="text-xs text-ink-muted">Declare, calculate, approve and disburse annual member dividends</div>
        </div>
        <button
          onClick={() => setShowDeclareModal(true)}
          className="px-3.5 py-1.5 rounded-lg border border-mint-600 bg-mint-600 text-white text-sm cursor-pointer hover:bg-mint-700 transition-colors font-medium"
        >
          + Declare Dividend
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e5ede9] mb-5">
        <button
          onClick={() => setActiveTab('declarations')}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'declarations'
              ? 'border-mint-600 text-mint-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Declarations ({declarations?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'payouts'
              ? 'border-mint-600 text-mint-700'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Member Payouts ({payouts?.length ?? 0})
        </button>
      </div>

      {/* Declarations Tab */}
      {activeTab === 'declarations' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-[#e5ede9]">
                {['Financial Year', 'Dividend Rate', 'Est. Total Pool', 'Status', 'Created At', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isDeclarationsLoading ? (
                [1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-5">
                      <div className="h-5 bg-ink-faint rounded-[4px]" />
                    </td>
                  </tr>
                ))
              ) : (declarations ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-ink-muted italic">
                    No dividend declarations yet. Click "+ Declare Dividend" to start.
                  </td>
                </tr>
              ) : (
                (declarations ?? []).map((dec: DividendDeclaration, ri: number) => {
                  const style = statusStyles[dec.status] ?? statusStyles.DRAFT
                  return (
                    <tr
                      key={dec.id}
                      className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}
                    >
                      <td className="px-3 py-3 font-semibold text-ink">FY {dec.financial_year}</td>
                      <td className="px-3 py-3 font-mono text-mint-700 font-medium">{dec.rate_pct}% p.a.</td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        KES {dec.total_dividend_pool.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`${style.bg} ${style.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                          {dec.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-muted">
                        {new Date(dec.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2 items-center">
                          {dec.status === 'DRAFT' && (
                            <button
                              onClick={() => handleCalculate(dec.id)}
                              disabled={calculateMutation.isPending && calculateMutation.variables === dec.id}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              Calculate Payouts
                            </button>
                          )}
                          {dec.status === 'CALCULATING' && (
                            <span className="text-xs text-blue-600 font-medium">Calculating…</span>
                          )}
                          {dec.status === 'CALCULATED' && (
                            <button
                              onClick={() => handleApprove(dec.id)}
                              disabled={approveMutation.isPending && approveMutation.variables === dec.id}
                              className="px-2.5 py-1 rounded bg-violet-600 text-white text-[11px] font-medium hover:bg-violet-700 disabled:opacity-50"
                            >
                              Approve Declaration
                            </button>
                          )}
                          {dec.status === 'APPROVED' && (
                            <button
                              onClick={() => handleDisburse(dec.id)}
                              disabled={disburseMutation.isPending && disburseMutation.variables === dec.id}
                              className="px-2.5 py-1 rounded bg-mint-600 text-white text-[11px] font-medium hover:bg-mint-700 disabled:opacity-50"
                            >
                              Disburse Dividends
                            </button>
                          )}
                          {dec.status === 'DISBURSING' && (
                            <span className="text-xs text-violet-600 font-medium">Disbursing…</span>
                          )}
                          {dec.status === 'DISBURSED' && (
                            <span className="text-xs text-mint-600 font-medium">Disbursed</span>
                          )}
                          {dec.status === 'FAILED' && (
                            <>
                              <span className="text-xs text-red-600 font-medium">Calculation failed</span>
                              <button
                                onClick={() => handleCalculate(dec.id)}
                                disabled={calculateMutation.isPending && calculateMutation.variables === dec.id}
                                className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 disabled:opacity-50"
                              >
                                Retry
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 border-b border-[#e5ede9]">
                {['Member', 'Financial Year', 'Average Balance', 'Dividend Paid', 'Status'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPayoutsLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-5">
                      <div className="h-5 bg-ink-faint rounded-[4px]" />
                    </td>
                  </tr>
                ))
              ) : (payouts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-ink-muted italic">
                    No payouts calculated yet. Calculate a declaration to generate member payout schedules.
                  </td>
                </tr>
              ) : (
                (payouts ?? []).map((p: DividendPayout, ri: number) => (
                  <tr key={p.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {p.member_name}
                      {p.member_email ? <span className="block text-[10px] text-ink-muted font-normal">{p.member_email}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted">{p.financial_year || '—'}</td>
                    <td className="px-3 py-2.5">KES {p.average_balance.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-bold text-mint-700">KES {p.dividend_amount.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className="bg-mint-50 text-mint-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Declare Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-[#e5ede9] shadow-xl">
            <div className="text-base font-semibold text-ink mb-1">Declare New Dividend</div>
            <div className="text-xs text-ink-muted mb-4">Set the dividend rate and calculation period for a savings type.</div>
            <form onSubmit={handleDeclare} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Savings type</label>
                <select
                  value={savingsTypeId}
                  onChange={(e) => setSavingsTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600 bg-white"
                  required
                >
                  <option value="">Select a savings type…</option>
                  {savingsTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
                {savingsTypes.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">No savings types found for this SACCO.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Financial Year</label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="e.g. 2024 or 2024/2025"
                  className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink mb-1 block">Period start</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink mb-1 block">Period end</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Dividend Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e5ede9]">
                <button
                  type="button"
                  onClick={() => setShowDeclareModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-ink-faint bg-white text-sm hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-3.5 py-1.5 rounded-lg bg-mint-600 text-white text-sm font-medium hover:bg-mint-700 disabled:opacity-50"
                >
                  {isCreating ? 'Declaring...' : 'Create Declaration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

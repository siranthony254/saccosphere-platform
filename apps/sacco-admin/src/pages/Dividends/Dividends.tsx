import { useState } from 'react'
import {
  useDividendDeclarations,
  useCreateDividendDeclaration,
  useCalculateDividend,
  useApproveDividend,
  useDisburseDividend,
  useDividendPayouts,
} from '../../hooks/useDividends'
import type { DividendDeclaration, DividendPayout } from '@saccosphere/schemas'

const statusStyles: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: 'bg-amber-50', color: 'text-amber-700' },
  CALCULATED: { bg: 'bg-blue-50', color: 'text-blue-700' },
  APPROVED: { bg: 'bg-violet-50', color: 'text-violet-700' },
  DISBURSED: { bg: 'bg-mint-50', color: 'text-mint-700' },
}

export function Dividends() {
  const [activeTab, setActiveTab] = useState<'declarations' | 'payouts'>('declarations')
  const [showDeclareModal, setShowDeclareModal] = useState(false)
  const [financialYear, setFinancialYear] = useState(new Date().getFullYear() - 1)
  const [ratePct, setRatePct] = useState(10)

  const { data: declarations, isLoading: isDeclarationsLoading } = useDividendDeclarations()
  const { data: payouts, isLoading: isPayoutsLoading } = useDividendPayouts()

  const { mutate: createDeclaration, isPending: isCreating } = useCreateDividendDeclaration()
  const { mutate: calculateDividend } = useCalculateDividend()
  const { mutate: approveDividend } = useApproveDividend()
  const { mutate: disburseDividend } = useDisburseDividend()

  const handleDeclare = (e: React.FormEvent) => {
    e.preventDefault()
    createDeclaration(
      { financial_year: Number(financialYear), rate_pct: Number(ratePct) },
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
                        <div className="flex gap-2">
                          {dec.status === 'DRAFT' && (
                            <button
                              onClick={() => calculateDividend(dec.id)}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700"
                            >
                              Calculate Payouts
                            </button>
                          )}
                          {dec.status === 'CALCULATED' && (
                            <button
                              onClick={() => approveDividend(dec.id)}
                              className="px-2.5 py-1 rounded bg-violet-600 text-white text-[11px] font-medium hover:bg-violet-700"
                            >
                              Approve Declaration
                            </button>
                          )}
                          {dec.status === 'APPROVED' && (
                            <button
                              onClick={() => disburseDividend(dec.id)}
                              className="px-2.5 py-1 rounded bg-mint-600 text-white text-[11px] font-medium hover:bg-mint-700"
                            >
                              Disburse Dividends
                            </button>
                          )}
                          {dec.status === 'DISBURSED' && (
                            <span className="text-xs text-mint-600 font-medium">✓ Disbursed</span>
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
                {['Member Name', 'Member No.', 'Share Capital', 'Gross Dividend', 'WHT (5%)', 'Net Dividend', 'Status'].map((h) => (
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
                    <td colSpan={7} className="p-5">
                      <div className="h-5 bg-ink-faint rounded-[4px]" />
                    </td>
                  </tr>
                ))
              ) : (payouts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-ink-muted italic">
                    No payouts calculated yet. Calculate a declaration to generate member payout schedules.
                  </td>
                </tr>
              ) : (
                (payouts ?? []).map((p: DividendPayout, ri: number) => (
                  <tr key={p.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                    <td className="px-3 py-2.5 font-medium text-ink">{p.member_name}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted font-mono">{p.member_number}</td>
                    <td className="px-3 py-2.5">KES {p.share_capital.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-medium text-ink">KES {p.gross_dividend.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-red-600 text-xs">- KES {p.withholding_tax.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-bold text-mint-700">KES {p.net_dividend.toLocaleString()}</td>
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
            <div className="text-xs text-ink-muted mb-4">Set the dividend interest rate on share capital for the financial year.</div>
            <form onSubmit={handleDeclare} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-ink mb-1 block">Financial Year</label>
                <input
                  type="number"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-600"
                  required
                />
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

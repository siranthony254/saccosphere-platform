import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'

export function LiquidityNPLDashboard() {
  const { data: liquidity, isLoading: loadingLiquidity } = useQuery({
    queryKey: ['liquidity-status'],
    queryFn: () => api.saccoAdmin.getLiquidityStatus(),
  })

  const { data: npl, isLoading: loadingNPL } = useQuery({
    queryKey: ['npl-dashboard'],
    queryFn: () => api.saccoAdmin.getNPLDashboard(),
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink flex items-center gap-1.5">
          Liquidity & NPL Portfolio Analytics
          <InfoTip text="An early-warning view: do you have enough cash on hand to meet withdrawals, and how many loans are at risk of not being repaid?" label="About Liquidity & NPL Portfolio Analytics" />
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Monitor SACCO liquidity thresholds, Non-Performing Loan (NPL) ratios, and loan loss provisioning in real time.
        </p>
      </div>

      {/* Liquidity Overview Card */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <span>Liquidity Ratio & Cash Reserves</span>
        </h2>

        {loadingLiquidity ? (
          <div className="text-xs text-ink-muted italic py-4">Loading liquidity metrics...</div>
        ) : liquidity ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Reserve Utilisation</div>
              <div className={`text-lg font-bold mt-1 ${liquidity.at_risk ? 'text-red-600' : 'text-mint-600'}`}>
                {liquidity.utilisation_pct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-ink-muted mt-1">Pending disbursements as a share of available reserves</div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Available Reserves</div>
              <div className="text-lg font-bold text-ink mt-1">
                KES {liquidity.available_reserves.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Pending Disbursements</div>
              <div className="text-lg font-bold text-ink mt-1">
                KES {liquidity.pending_disbursements.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Liquidity Health</div>
              <div className={`text-sm font-semibold mt-2 flex items-center gap-1.5 ${liquidity.at_risk ? 'text-red-600' : 'text-mint-600'}`}>
                <span className={`w-2 h-2 rounded-full ${liquidity.at_risk ? 'bg-red-500' : 'bg-mint-500'}`}></span>
                <span>{liquidity.at_risk ? 'AT RISK' : 'HEALTHY'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* NPL Portfolio Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <span>Non-Performing Loans (NPL) & Provisioning</span>
        </h2>

        {loadingNPL ? (
          <div className="text-xs text-ink-muted italic py-4">Loading NPL portfolio breakdown...</div>
        ) : npl ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                <div className="text-xs text-amber-800 font-medium">NPL Ratio %</div>
                <div className="text-xl font-bold text-amber-900 mt-1">
                  {npl.npl_ratio_pct.toFixed(2)}%
                </div>
                <div className="text-[10px] text-amber-700 mt-1">SASRA Benchmark: &lt; 5.0%</div>
              </div>

              <div className="p-4 bg-surface2 rounded-lg border border-border">
                <div className="text-xs text-ink-muted">Total Non-Performing Amount</div>
                <div className="text-xl font-bold text-red-600 mt-1">
                  KES {npl.npl_outstanding_balance.toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-surface2 rounded-lg border border-border">
                <div className="text-xs text-ink-muted">Total Active Outstanding</div>
                <div className="text-xl font-bold text-ink mt-1">
                  KES {npl.active_outstanding_balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Loan Portfolio Classification Table */}
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Portfolio Classification Breakdown</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-surface2 text-ink-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Loans</th>
                    <th className="px-3 py-2 text-right">Outstanding Balance</th>
                    <th className="px-3 py-2 text-right">Provision Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-mint-600">Performing / Normal</td>
                    <td className="px-3 py-2 text-right">{npl.performing.loan_count}</td>
                    <td className="px-3 py-2 text-right font-medium">KES {npl.performing.outstanding_balance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">KES {npl.performing.provision_required.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-blue-600">Watch / Special Mention</td>
                    <td className="px-3 py-2 text-right">{npl.watch.loan_count}</td>
                    <td className="px-3 py-2 text-right font-medium">KES {npl.watch.outstanding_balance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">KES {npl.watch.provision_required.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-amber-600">Substandard</td>
                    <td className="px-3 py-2 text-right">{npl.substandard.loan_count}</td>
                    <td className="px-3 py-2 text-right font-medium">KES {npl.substandard.outstanding_balance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">KES {npl.substandard.provision_required.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-red-600">Doubtful</td>
                    <td className="px-3 py-2 text-right">{npl.doubtful.loan_count}</td>
                    <td className="px-3 py-2 text-right font-medium">KES {npl.doubtful.outstanding_balance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">KES {npl.doubtful.provision_required.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-red-800">Loss / Bad Debt</td>
                    <td className="px-3 py-2 text-right">{npl.loss.loan_count}</td>
                    <td className="px-3 py-2 text-right font-medium">KES {npl.loss.outstanding_balance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">KES {npl.loss.provision_required.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

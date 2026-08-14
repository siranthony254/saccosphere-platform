import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

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
        <h1 className="text-xl font-bold text-ink">Liquidity & NPL Portfolio Analytics</h1>
        <p className="text-xs text-ink-muted mt-1">
          Monitor SACCO liquidity thresholds, Non-Performing Loan (NPL) ratios, and loan loss provisioning in real time.
        </p>
      </div>

      {/* Liquidity Overview Card */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <span>💧 Liquidity Ratio & Cash Reserves</span>
        </h2>

        {loadingLiquidity ? (
          <div className="text-xs text-ink-muted italic py-4">Loading liquidity metrics...</div>
        ) : liquidity ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Current Liquidity Ratio</div>
              <div className={`text-lg font-bold mt-1 ${(liquidity.liquidity_ratio_pct ?? 15) >= (liquidity.threshold_pct ?? 15) ? 'text-mint-600' : 'text-red-600'}`}>
                {(liquidity.liquidity_ratio_pct ?? 18.4).toFixed(1)}%
              </div>
              <div className="text-[10px] text-ink-muted mt-1">Min Threshold: {liquidity.threshold_pct ?? 15}%</div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Liquid Cash Assets</div>
              <div className="text-lg font-bold text-ink mt-1">
                KES {(liquidity.liquid_assets ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Short-term Liabilities</div>
              <div className="text-lg font-bold text-ink mt-1">
                KES {(liquidity.short_term_liabilities ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-surface2 rounded-lg border border-border">
              <div className="text-xs text-ink-muted">Liquidity Health</div>
              <div className="text-sm font-semibold text-mint-600 mt-2 flex items-center gap-1.5">
                <span className="w-2 height-2 rounded-full bg-mint-500"></span>
                <span>{liquidity.status || 'OPTIMAL'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* NPL Portfolio Breakdown */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <span>📉 Non-Performing Loans (NPL) & Provisioning</span>
        </h2>

        {loadingNPL ? (
          <div className="text-xs text-ink-muted italic py-4">Loading NPL portfolio breakdown...</div>
        ) : npl ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                <div className="text-xs text-amber-800 font-medium">NPL Ratio %</div>
                <div className="text-xl font-bold text-amber-900 mt-1">
                  {(npl.npl_ratio_pct ?? 4.2).toFixed(1)}%
                </div>
                <div className="text-[10px] text-amber-700 mt-1">SASRA Benchmark: &lt; 5.0%</div>
              </div>

              <div className="p-4 bg-surface2 rounded-lg border border-border">
                <div className="text-xs text-ink-muted">Total Non-Performing Amount</div>
                <div className="text-xl font-bold text-red-600 mt-1">
                  KES {(npl.total_npl_amount ?? 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-surface2 rounded-lg border border-border">
                <div className="text-xs text-ink-muted">Required Loss Provision</div>
                <div className="text-xl font-bold text-ink mt-1">
                  KES {(npl.required_provision ?? 0).toLocaleString()}
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
                    <th className="px-3 py-2">Days Past Due</th>
                    <th className="px-3 py-2 text-right">Portfolio Amount</th>
                    <th className="px-3 py-2 text-right">Provision Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-mint-600">Performing / Normal</td>
                    <td className="px-3 py-2">0 - 30 days</td>
                    <td className="px-3 py-2 text-right font-medium">KES {(npl.performing_amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">1%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-blue-600">Watch / Special Mention</td>
                    <td className="px-3 py-2">31 - 90 days</td>
                    <td className="px-3 py-2 text-right font-medium">KES {(npl.watch_amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">5%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-amber-600">Substandard</td>
                    <td className="px-3 py-2">91 - 180 days</td>
                    <td className="px-3 py-2 text-right font-medium">KES {(npl.substandard_amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">25%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-red-600">Doubtful</td>
                    <td className="px-3 py-2">181 - 360 days</td>
                    <td className="px-3 py-2 text-right font-medium">KES {(npl.doubtful_amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">50%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-red-800">Loss / Bad Debt</td>
                    <td className="px-3 py-2">&gt; 360 days</td>
                    <td className="px-3 py-2 text-right font-medium">KES {(npl.loss_amount ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">100%</td>
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

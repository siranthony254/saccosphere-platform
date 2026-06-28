import { useRevenueChart } from '../../hooks/usePlatformData'

export function Revenue() {
  const { data: revenueData, isLoading, error } = useRevenueChart()

  if (isLoading) return <div className="p-6 text-ink-muted">Loading revenue data...</div>
  
  if (error || !revenueData) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <div className="font-semibold mb-1">Failed to load revenue data</div>
        <div className="text-[13px] text-red-900">{error?.message || 'Unable to fetch revenue data. Please check your connection.'}</div>
      </div>
    </div>
  )

  const totalSaaS = revenueData.reduce((sum: any, item: any) => sum + item.saas_fees, 0)
  const totalTxnFees = revenueData.reduce((sum: any, item: any) => sum + item.transaction_fees, 0)
  const totalMRR = revenueData.reduce((sum: any, item: any) => sum + item.total_mrr, 0)

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Platform revenue</div>
          <div className="text-xs text-ink-muted">12-month revenue breakdown · SaaS fees + Transaction fees</div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total SaaS fees (12mo)', value: `KES ${(totalSaaS / 1000).toFixed(0)}K` },
          { label: 'Total transaction fees (12mo)', value: `KES ${(totalTxnFees / 1000).toFixed(0)}K` },
          { label: 'Total MRR (12mo)', value: `KES ${(totalMRR / 1000).toFixed(0)}K`, accent: true },
        ].map(m => (
          <div key={m.label} className={`${m.accent ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white' : 'bg-surface border border-mid'} rounded-xl p-3.5`}>
            <div className={`text-xs ${m.accent ? 'text-white/60' : 'text-ink-muted'} mb-1.5 uppercase tracking-wider font-medium`}>{m.label}</div>
            <div className={`text-2xl font-semibold ${m.accent ? 'text-white' : 'text-ink'} leading-tight`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart table */}
      <div className="bg-surface border border-mid rounded-xl overflow-hidden">
        <div className="p-3 border-b border-mid font-semibold text-sm text-ink">Monthly revenue breakdown</div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-surface-2">
              {['Month', 'SaaS fees', 'Transaction fees', 'Total MRR'].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {revenueData.map((item: any, i: any) => (
              <tr key={item.month} className={`border-b border-surface-2 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>
                <td className="px-3 py-2 font-medium">{item.month}</td>
                <td className="px-3 py-2 text-ink-muted">KES {item.saas_fees.toLocaleString()}</td>
                <td className="px-3 py-2 text-ink-muted">KES {item.transaction_fees.toLocaleString()}</td>
                <td className="px-3 py-2 font-semibold text-violet-600">KES {item.total_mrr.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

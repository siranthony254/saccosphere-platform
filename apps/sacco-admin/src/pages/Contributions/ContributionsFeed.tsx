import { useContributionsDashboard } from '../../hooks/useSaccoAdminDashboard'

export function ContributionsFeed() {
  const { data: dashboard, isLoading, error } = useContributionsDashboard()

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="text-center text-ink-muted">Loading contribution dashboard...</div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="p-5">
        <div className="text-center text-red-600">Failed to load contribution dashboard</div>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Contribution dashboard</div>
          <div className="text-xs text-ink-muted">Monthly overview · {dashboard.contribution_rate_pct.toFixed(1)}% contribution rate</div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Received today', value: `KES ${dashboard.received_today.total_amount.toLocaleString()}`, delta: `${dashboard.received_today.count} transactions` },
          { label: 'Expected this month', value: `KES ${dashboard.expected_this_month.total_amount.toLocaleString()}`, delta: `${dashboard.expected_this_month.count} members` },
          { label: 'Received so far', value: `KES ${dashboard.received_so_far_this_month.total_amount.toLocaleString()}`, delta: `${dashboard.received_so_far_this_month.count} transactions` },
          { label: 'Missed/overdue', value: `KES ${dashboard.missed_overdue.total_amount.toLocaleString()}`, delta: `${dashboard.missed_overdue.count} members`, alert: true },
        ].map(m => (
          <div key={m.label} className={`bg-white border rounded-[10px] p-[14px_16px] ${m.alert ? 'border-red-200' : 'border-[#e5ede9]'}`}>
            <div className="text-[10px] text-ink-muted mb-1.5 uppercase tracking-widest font-medium">{m.label}</div>
            <div className={`text-xl font-semibold mb-0.5 ${m.alert ? 'text-red-600' : 'text-ink'}`}>{m.value}</div>
            <div className={`text-[11px] ${m.alert ? 'text-red-600' : 'text-mint-600'}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Contribution rate indicator */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-semibold text-ink">Monthly contribution rate</div>
          <div className={`text-lg font-bold ${dashboard.contribution_rate_pct >= 80 ? 'text-mint-600' : dashboard.contribution_rate_pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {dashboard.contribution_rate_pct.toFixed(1)}%
          </div>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${dashboard.contribution_rate_pct >= 80 ? 'bg-mint-500' : dashboard.contribution_rate_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(dashboard.contribution_rate_pct, 100)}%` }}
          />
        </div>
        <div className="text-[11px] text-ink-muted mt-1.5">
          {dashboard.contribution_rate_pct >= 80 ? 'Excellent - most members contributing on time' : dashboard.contribution_rate_pct >= 50 ? 'Moderate - some members overdue' : 'Low - many members missing contributions'}
        </div>
      </div>

      {/* Recent contributions table */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-surface-3">
          <div className="font-semibold text-sm text-ink">Recent contributions</div>
          <div className="flex items-center gap-1.5 text-[11px] text-mint-600">
            <div className="w-1.5 h-1.5 rounded-full bg-mint-600" />
            Last 10 transactions
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              {['Date', 'Member', 'Amount (KES)', 'Savings type'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium border-b border-[#e5ede9]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashboard.recent_contributions.map((c: any, i: number) => (
              <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                <td className="px-3 py-2.5 text-xs text-ink-muted">
                  {new Date(c.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-3 py-2.5 font-medium">{c.member_name}</td>
                <td className="px-3 py-2.5 font-semibold text-mint-600">+{c.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-xs text-ink-muted">{c.savings_type}</td>
              </tr>
            ))}
            {dashboard.recent_contributions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-ink-muted text-xs">No recent contributions</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
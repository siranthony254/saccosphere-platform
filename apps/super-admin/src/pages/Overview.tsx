import {
  usePlatformOverview,
  usePlatformLiveFeed,
  useTopSaccos,
  usePlatformAlerts,
  useRevenueChart,
} from '../hooks/usePlatformData'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/MetricCard'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Badge } from '../components/ui/Badge'
import { SaccoAvatar } from '../components/saccos/SaccoAvatar'
import { HealthDot } from '../components/ui/HealthDot'
import type { TopSaccos, PlatformAlert } from '@saccosphere/schemas'

function formatKes(value: number): string {
  if (value >= 1_000_000_000) return `KES ${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`
  return `KES ${value.toLocaleString()}`
}

export function Overview() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = usePlatformOverview()
  const { feed, connected } = usePlatformLiveFeed()
  const { data: topSaccos, isLoading: topLoading } = useTopSaccos()
  const { data: alerts, isLoading: alertsLoading } = usePlatformAlerts()
  const { data: revenue, isLoading: revenueLoading } = useRevenueChart()

  if (overviewLoading) return <div className="p-6 text-ink-muted">Loading platform data...</div>

  if (overviewError || !overview) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="font-semibold mb-1">Failed to load overview</div>
          <div className="text-[13px] text-red-900">
            {overviewError?.message || 'Unable to fetch platform data. Please check your connection.'}
          </div>
        </div>
      </div>
    )
  }

  const volumeChange = overview.transaction_volume_change_pct
    ? `${overview.transaction_volume_change_pct >= 0 ? '+' : ''}${overview.transaction_volume_change_pct.toFixed(1)}% vs last month`
    : 'No change data'

  const alertBadgeVariant = (severity: string): 'error' | 'warning' | 'info' => {
    const s = severity.toLowerCase()
    if (s === 'critical' || s === 'high') return 'error'
    if (s === 'medium' || s === 'warning') return 'warning'
    return 'info'
  }

  return (
    <div className="p-5">
      <PageHeader
        title="System overview"
        subtitle={`Saccosphere platform · All SACCOs · ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={
          <div
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md ${
              overview.all_systems_operational ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${overview.all_systems_operational ? 'bg-mint-500' : 'bg-red-500'}`} />
            {overview.all_systems_operational ? 'All systems operational' : 'System issues detected'}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Platform transaction volume"
          value={formatKes(overview.transaction_volume_mtd_kes)}
          delta={volumeChange}
          accent
        />
        <MetricCard
          label="Active SACCOs"
          value={overview.active_saccos.toLocaleString()}
          delta={`+${overview.active_saccos_change_this_month} this month`}
        />
        <MetricCard
          label="Total members"
          value={overview.total_members.toLocaleString()}
          delta={`+${overview.total_members_change_this_month} this month`}
        />
        <MetricCard
          label="Platform revenue (MTD)"
          value={formatKes(overview.platform_revenue_mtd_kes)}
          delta="SaaS + transaction fees"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card
            title="Platform revenue — monthly"
            action={<span className="text-[11px] text-violet-500 font-medium cursor-pointer">View full report →</span>}
          >
            {revenueLoading ? (
              <div className="text-xs text-ink-muted">Loading revenue chart...</div>
            ) : (revenue ?? []).length === 0 ? (
              <div className="text-xs text-ink-muted">No revenue data returned from the backend.</div>
            ) : (
              <>
                <div className="h-24 flex items-end gap-1">
                  {(() => {
                    const max = Math.max(...(revenue ?? []).map((r) => r.total_mrr), 1)
                    return (revenue ?? []).map((row, i) => (
                      <div
                        key={row.month}
                        className="flex-1 bg-indigo-400 rounded-t min-w-[8px]"
                        style={{ height: `${(row.total_mrr / max) * 100}%`, opacity: 0.4 + (i % 3) * 0.2 }}
                        title={`${row.month}: ${formatKes(row.total_mrr)}`}
                      />
                    ))
                  })()}
                </div>
                <div className="flex justify-between text-[9px] text-ink-faint mt-2">
                  {(revenue ?? []).slice(-12).map((row) => (
                    <span key={row.month}>{row.month.slice(-2)}</span>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card title="Platform alerts">
            {alertsLoading ? (
              <div className="text-xs text-ink-muted">Loading alerts...</div>
            ) : (alerts ?? []).length === 0 ? (
              <div className="text-xs text-ink-muted">No platform alerts.</div>
            ) : (
              <div className="space-y-2">
                {(alerts ?? []).slice(0, 5).map((alert: PlatformAlert) => (
                  <div key={alert.id} className="text-xs text-ink-soft leading-relaxed">
                    <span className="font-medium">{alert.sacco_name}:</span> {alert.description}
                    <Badge variant={alertBadgeVariant(alert.severity)} className="ml-2">
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="Top SACCOs by transaction volume"
            action={<span className="text-[11px] text-violet-500 font-medium cursor-pointer">All SACCOs →</span>}
          >
            {topLoading ? (
              <div className="text-xs text-ink-muted">Loading top SACCOs...</div>
            ) : (topSaccos ?? []).length === 0 ? (
              <div className="text-xs text-ink-muted">No SACCO data returned from the backend.</div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'sacco',
                    header: 'SACCO',
                    render: (row: TopSaccos) => (
                      <div className="flex items-center gap-2">
                        <SaccoAvatar name={row.sacco_name} size="sm" />
                        <span className="font-medium">{row.sacco_name}</span>
                      </div>
                    ),
                  },
                  { key: 'member_count', header: 'Members', render: (row: TopSaccos) => row.member_count.toLocaleString() },
                  {
                    key: 'txn_volume_this_month',
                    header: 'Txn volume (Apr)',
                    render: (row: TopSaccos) => formatKes(row.txn_volume_this_month),
                  },
                  {
                    key: 'platform_fee_this_month',
                    header: 'Platform fee',
                    render: (row: TopSaccos) => <Badge variant="success">{formatKes(row.platform_fee_this_month)}</Badge>,
                  },
                  {
                    key: 'health_status',
                    header: 'Health',
                    render: (row: TopSaccos) => <HealthDot status={row.health_status.toLowerCase()} />,
                  },
                ]}
                data={topSaccos ?? []}
                keyExtractor={(row: TopSaccos) => row.sacco_id}
              />
            )}
          </Card>

          <Card
            title="Live transaction feed — all SACCOs"
            action={
              <div className="flex items-center gap-1 text-[11px] text-violet-500">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {connected ? 'Real-time' : 'Connecting...'}
              </div>
            }
          >
            <DataTable
              columns={[
                { key: 'time', header: 'Time', render: (row: any) => <span className="text-ink-faint font-mono text-[10px]">{row.time}</span> },
                { key: 'member', header: 'Member', render: (row: any) => row.member },
                { key: 'sacco', header: 'SACCO', render: (row: any) => <span className="text-ink-muted">{row.sacco}</span> },
                { key: 'type', header: 'Type', render: (row: any) => row.type },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (row: any) => (
                    <span className={`font-semibold ${row.status === 'failed' ? 'text-red-700' : 'text-mint-700'}`}>
                      {row.status === 'failed' ? '✗' : '+'}{row.amount.toLocaleString()}
                    </span>
                  ),
                },
                { key: 'fee', header: 'Fee', render: (row: any) => <span className="text-ink-muted">KES {row.platform_fee}</span> },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => (
                    <Badge variant={row.status === 'completed' ? 'success' : 'error'}>
                      {row.status === 'completed' ? '✓' : '✗'}
                    </Badge>
                  ),
                },
              ]}
              data={feed}
              emptyMessage="No transactions returned from the backend yet."
              keyExtractor={(row: any, index: number) => `${row.id}-${index}`}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

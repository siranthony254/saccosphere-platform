import { useRevenueChart, useTopSaccos } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import type { TopSaccos } from '@saccosphere/schemas'

function formatKes(value: number): string {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`
  return `KES ${value.toLocaleString()}`
}

export function Revenue() {
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueChart()
  const { data: topSaccos, isLoading: topLoading } = useTopSaccos()

  if (revenueLoading) return <div className="p-6 text-ink-muted">Loading revenue data...</div>

  if (revenueError || !revenueData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="font-semibold mb-1">Failed to load revenue data</div>
          <div className="text-[13px] text-red-900">
            {revenueError?.message || 'Unable to fetch revenue data. Please check your connection.'}
          </div>
        </div>
      </div>
    )
  }

  const rows = revenueData
  const totalSaaS = rows.reduce((sum, item) => sum + item.saas_fees, 0)
  const totalTxnFees = rows.reduce((sum, item) => sum + item.transaction_fees, 0)
  const totalMRR = rows.reduce((sum, item) => sum + item.total_mrr, 0)
  const maxMRR = Math.max(...rows.map((r) => r.total_mrr), 1)

  return (
    <div className="p-5">
      <PageHeader title="Revenue & billing" subtitle="Platform-wide earnings" />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total MRR" value={formatKes(totalMRR)} delta="Total over period" accent />
        <MetricCard label="SaaS fees" value={formatKes(totalSaaS)} delta="From SACCO subscriptions" />
        <MetricCard label="Transaction fees" value={formatKes(totalTxnFees)} delta="From platform transactions" />
        <MetricCard label="Active SACCOs" value={`${topSaccos?.length ?? 0}`} delta="Contributing revenue" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Revenue growth">
          {rows.length === 0 ? (
            <div className="text-xs text-ink-muted">No revenue data returned from the backend.</div>
          ) : (
            <>
              <div className="h-24 flex items-end gap-1 mb-2">
                {rows.map((row, i) => (
                  <div
                    key={row.month}
                    className="flex-1 bg-indigo-400 rounded-t min-w-[8px]"
                    style={{ height: `${(row.total_mrr / maxMRR) * 100}%`, opacity: 0.4 + (i % 3) * 0.2 }}
                    title={`${row.month}: ${formatKes(row.total_mrr)}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-ink-faint">
                {rows.slice(-12).map((row) => (
                  <span key={row.month}>{row.month.slice(-2)}</span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Revenue breakdown by SACCO">
          {topLoading ? (
            <div className="text-xs text-ink-muted">Loading SACCO revenue...</div>
          ) : (topSaccos ?? []).length === 0 ? (
            <div className="text-xs text-ink-muted">No SACCO revenue data returned from the backend.</div>
          ) : (
            <DataTable
              columns={[
                { key: 'sacco_name', header: 'SACCO', render: (row: TopSaccos) => row.sacco_name },
                {
                  key: 'platform_fee_this_month',
                  header: 'SaaS fee',
                  render: (row: TopSaccos) => formatKes(row.platform_fee_this_month),
                },
                {
                  key: 'txn_volume_this_month',
                  header: 'Txn volume',
                  render: (row: TopSaccos) => formatKes(row.txn_volume_this_month),
                },
                {
                  key: 'total',
                  header: 'Total',
                  render: (row: TopSaccos) => (
                    <span className="font-semibold">
                      {formatKes(row.platform_fee_this_month + Math.round(row.txn_volume_this_month * 0.01))}
                    </span>
                  ),
                },
                {
                  key: 'health',
                  header: 'Health',
                  render: (row: TopSaccos) => (
                    <Badge variant={row.health_status === 'GOOD' ? 'success' : 'warning'}>
                      {row.health_status}
                    </Badge>
                  ),
                },
              ]}
              data={topSaccos ?? []}
              keyExtractor={(row: TopSaccos) => row.sacco_id}
            />
          )}
        </Card>
      </div>

      <Card title="Monthly revenue breakdown" className="mt-4">
        <DataTable
          columns={[
            { key: 'month', header: 'Month', render: (row) => row.month },
            { key: 'saas_fees', header: 'SaaS fees', render: (row) => formatKes(row.saas_fees) },
            { key: 'transaction_fees', header: 'Transaction fees', render: (row) => formatKes(row.transaction_fees) },
            {
              key: 'total_mrr',
              header: 'Total MRR',
              render: (row) => <span className="font-semibold text-violet-600">{formatKes(row.total_mrr)}</span>,
            },
          ]}
          data={rows}
          keyExtractor={(row) => row.month}
        />
      </Card>
    </div>
  )
}

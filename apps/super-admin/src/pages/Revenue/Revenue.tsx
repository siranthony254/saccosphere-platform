import { useRevenueChart, useRevenueSummary } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'

function formatKes(value: number): string {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`
  return `KES ${value.toLocaleString()}`
}

type SaccoRevenueRow = {
  sacco_name: string
  total_invoiced: number
  total_paid: number
  outstanding: number
}

export function Revenue() {
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useRevenueChart()
  const { data: summary, isLoading: summaryLoading } = useRevenueSummary()

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
  const maxMRR = Math.max(...rows.map((r: any) => r.total_mrr), 1)
  const bySacco = (summary?.by_sacco ?? []) as SaccoRevenueRow[]

  return (
    <div className="p-5">
      <PageHeader title="Revenue & billing" subtitle="Platform-wide earnings, collections and arrears" />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Revenue — all time"
          value={summary ? formatKes(summary.total_revenue_all_time) : '—'}
          delta="Paid invoices, lifetime"
          accent
        />
        <MetricCard
          label="Revenue this month"
          value={summary ? formatKes(summary.revenue_this_month) : '—'}
          delta={summary ? `Last month ${formatKes(summary.revenue_last_month)}` : ''}
        />
        <MetricCard
          label="Outstanding"
          value={summary ? formatKes(summary.outstanding_invoices_total) : '—'}
          delta={summary ? `${summary.outstanding_invoices_count} open · ${summary.overdue_invoices_count} overdue` : ''}
        />
        <MetricCard
          label="Suspended SACCOs"
          value={summary ? `${summary.suspended_saccos_count}` : '—'}
          delta="Billing-blocked"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Monthly recurring revenue">
          {rows.length === 0 ? (
            <div className="text-xs text-ink-muted">No revenue data returned from the backend.</div>
          ) : (
            <>
              <div className="h-24 flex items-end gap-1 mb-2">
                {rows.map((row: any, i: number) => (
                  <div
                    key={row.month}
                    className="flex-1 bg-indigo-400 rounded-t min-w-[8px]"
                    style={{ height: `${(row.total_mrr / maxMRR) * 100}%`, opacity: 0.4 + (i % 3) * 0.2 }}
                    title={`${row.month}: ${formatKes(row.total_mrr)}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-ink-faint">
                {rows.slice(-12).map((row: any) => (
                  <span key={row.month}>{row.month.slice(-2)}</span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Invoiced vs collected by SACCO">
          {summaryLoading ? (
            <div className="text-xs text-ink-muted">Loading SACCO revenue...</div>
          ) : bySacco.length === 0 ? (
            <div className="text-xs text-ink-muted">No SACCO revenue data returned from the backend.</div>
          ) : (
            <DataTable
              columns={[
                { key: 'sacco_name', header: 'SACCO', render: (row: SaccoRevenueRow) => row.sacco_name },
                { key: 'total_invoiced', header: 'Invoiced', render: (row: SaccoRevenueRow) => formatKes(row.total_invoiced) },
                { key: 'total_paid', header: 'Collected', render: (row: SaccoRevenueRow) => formatKes(row.total_paid) },
                {
                  key: 'outstanding',
                  header: 'Outstanding',
                  render: (row: SaccoRevenueRow) => (
                    <span className={row.outstanding > 0 ? 'font-semibold text-red-700' : 'text-ink-muted'}>
                      {formatKes(row.outstanding)}
                    </span>
                  ),
                },
              ]}
              data={bySacco}
              keyExtractor={(row: SaccoRevenueRow) => row.sacco_name}
            />
          )}
        </Card>
      </div>

      <Card title="Monthly revenue breakdown" className="mt-4">
        <DataTable
          columns={[
            { key: 'month', header: 'Month', render: (row: any) => row.month },
            { key: 'saas_fees', header: 'SaaS fees', render: (row: any) => formatKes(row.saas_fees) },
            { key: 'transaction_fees', header: 'Transaction fees', render: (row: any) => formatKes(row.transaction_fees) },
            {
              key: 'total_mrr',
              header: 'Total MRR',
              render: (row: any) => <span className="font-semibold text-violet-600">{formatKes(row.total_mrr)}</span>,
            },
          ]}
          data={rows}
          keyExtractor={(row: any) => row.month}
        />
      </Card>
    </div>
  )
}

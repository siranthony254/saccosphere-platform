import { useState, useMemo } from 'react'
import { usePlatformLiveFeed } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'

const today = new Date().toISOString().slice(0, 10)

export function TransactionsFeed() {
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today')
  const { feed, connected } = usePlatformLiveFeed()

  const filtered = useMemo(() => {
    const now = new Date()
    return feed.filter((t: any) => {
      const d = new Date(t.date)
      if (range === 'today') return d.toISOString().slice(0, 10) === today
      if (range === 'week') return now.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000
      return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000
    })
  }, [feed, range])

  const totalVol = filtered.reduce((s: number, t: any) => s + (t.direction === 'debit' ? -t.amount : t.amount), 0)
  const totalFees = filtered.reduce((s: number, t: any) => s + t.platform_fee, 0)
  const failed = filtered.filter((t: any) => t.status === 'failed').length
  const successful = filtered.filter((t: any) => t.status === 'completed').length

  return (
    <div className="p-5">
      <PageHeader
        title="All transactions"
        subtitle={`Platform-wide · Real-time feed · ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={
          <div className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 px-3 py-1.5 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            {connected ? 'Real-time' : 'Connecting...'}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Volume (session)"
          value={`KES ${Math.abs(totalVol).toLocaleString()}`}
          delta={`${filtered.length} transactions`}
          accent
        />
        <MetricCard label="Platform fees earned" value={`KES ${totalFees.toLocaleString()}`} delta="~1% take rate" />
        <MetricCard label="Successful" value={successful.toString()} delta="All SACCOs" />
        <MetricCard
          label="Failed transactions"
          value={failed.toString()}
          delta={failed > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      <div className="flex justify-between items-center mb-3">
        <select
          className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface"
          value={range}
          onChange={(e) => setRange(e.target.value as 'today' | 'week' | 'month')}
        >
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <div className="flex items-center gap-1 text-xs text-violet-600">
          <div className="w-1 h-1 rounded-full bg-violet-600" />
          Auto-updating every 10 seconds
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'time', header: 'Time', render: (row: any) => <span className="text-ink-faint font-mono text-xs">{row.time}</span> },
          { key: 'member', header: 'Member', render: (row: any) => row.member },
          { key: 'sacco', header: 'SACCO', render: (row: any) => <span className="text-ink-muted">{row.sacco}</span> },
          { key: 'type', header: 'Type', render: (row: any) => row.type },
          {
            key: 'amount',
            header: 'Amount (KES)',
            render: (row: any) => (
              <span className={`font-semibold ${row.status === 'failed' ? 'text-red-700' : row.direction === 'debit' ? 'text-red-700' : 'text-mint-700'}`}>
                {row.direction === 'debit' ? '-' : '+'}{row.amount.toLocaleString()}
              </span>
            ),
          },
          { key: 'method', header: 'Method', render: (row: any) => <span className="capitalize">{row.method}</span> },
          { key: 'platform_fee', header: 'Platform fee', render: (row: any) => <span className="text-ink-muted">KES {row.platform_fee}</span> },
          {
            key: 'status',
            header: 'Status',
            render: (row: any) => <Badge variant={row.status === 'completed' ? 'success' : 'error'}>{row.status === 'completed' ? '✓ OK' : '✗ Failed'}</Badge>,
          },
        ]}
        data={filtered}
        emptyMessage="No transactions returned from the backend for the selected range."
        keyExtractor={(row: any, index: number) => `${row.id}-${index}`}
      />
    </div>
  )
}

import { useSystemHealth } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { HealthDot } from '../../components/ui/HealthDot'
import { MetricCard } from '../../components/ui/MetricCard'

export function SystemHealth() {
  const { data: health, isLoading, error } = useSystemHealth()

  if (isLoading) return <div className="p-6 text-ink-muted">Loading system health...</div>

  if (error || !health) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <div className="font-semibold mb-1">Failed to load system health</div>
          <div className="text-[13px] text-red-900">
            {error?.message || 'Unable to fetch system health. Please check your connection.'}
          </div>
        </div>
      </div>
    )
  }

  const readiness =
    (health.readiness as { status: string; checks?: Record<string, boolean> }) ?? {
      status: 'unknown',
      checks: {},
    }
  const checkEntries = Object.entries(readiness.checks ?? {})
  const passing = checkEntries.filter(([, ok]) => ok).length
  const total = checkEntries.length

  const readinessLabel =
    readiness.status === 'ok'
      ? 'Ready'
      : readiness.status === 'unavailable'
        ? 'Unavailable'
        : 'Unknown'

  return (
    <div className="p-5">
      <PageHeader
        title="System & API health"
        subtitle="Platform infrastructure readiness"
        actions={
          <div
            className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md ${
              total > 0 && passing === total ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                total > 0 && passing === total ? 'bg-mint-500' : 'bg-amber-500'
              }`}
            />
            {passing} of {total || '—'} checks passing
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <MetricCard
          label="Readiness status"
          value={readinessLabel}
          accent={readiness.status === 'ok'}
        />
        <MetricCard
          label="Infrastructure checks"
          value={total > 0 ? `${passing}/${total}` : '—'}
          delta={total === 0 ? 'No checks reported' : passing === total ? 'All passing' : 'Degraded'}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Core infrastructure">
          <div className="space-y-2">
            {checkEntries.map(([name, ok]) => (
              <div
                key={name}
                className="flex justify-between items-center py-2 border-b border-surface-2 last:border-0 text-xs"
              >
                <span className="text-ink-muted capitalize">{name}</span>
                <HealthDot status={ok ? 'healthy' : 'critical'} />
              </div>
            ))}
            {checkEntries.length === 0 && (
              <div className="text-xs text-ink-muted">No infrastructure checks reported.</div>
            )}
          </div>
        </Card>

        <Card title="External integrations">
          <div className="text-xs text-ink-muted py-4 px-2">
            External service health (M-Pesa, SMS, IPRS) is not exposed as a dedicated
            endpoint. It surfaces indirectly through transaction success rates on the
            Transactions feed and through platform alerts on Compliance.
          </div>
        </Card>

        <Card title="Per-SACCO API status">
          <div className="text-xs text-ink-muted py-4 px-2">
            Individual SACCO health is shown in the SACCO directory and the Top SACCOs
            panel on the overview.
          </div>
        </Card>
      </div>
    </div>
  )
}

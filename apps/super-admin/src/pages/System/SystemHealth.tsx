import { useSystemHealth } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { HealthDot } from '../../components/ui/HealthDot'
import { MetricCard } from '../../components/ui/MetricCard'
import { DataTable } from '../../components/ui/DataTable'

interface ServiceItem {
  name: string
  status: string
  [key: string]: unknown
}

interface SystemEvent {
  id: string
  time: string
  event: string
  severity: string
  resolution: string
}

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

  const services = (health.services ?? []) as ServiceItem[]
  const readiness = health.readiness ?? { status: 'unknown', checks: {} }
  const operationalCount = services.filter((s) =>
    String(s.status).toLowerCase().includes('operational') ||
    String(s.status).toLowerCase() === 'healthy'
  ).length

  const events: SystemEvent[] = Array.isArray(health.events)
    ? health.events.map((e: any) => ({
        id: e.id ?? `${e.time ?? ''}-${e.event ?? ''}`,
        time: e.time ?? e.created_at ?? '—',
        event: e.event ?? e.message ?? e.description ?? 'System event',
        severity: e.severity ?? 'INFO',
        resolution: e.resolution ?? e.status ?? '—',
      }))
    : []

  return (
    <div className="p-5">
      <PageHeader
        title="System & API health"
        subtitle="Platform infrastructure · All integrations"
        actions={
          <div className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md bg-mint-50 text-mint-700">
            <div className="w-1.5 h-1.5 rounded-full bg-mint-500" />
            {operationalCount} of {services.length || '—'} services operational
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <MetricCard
          label="Readiness status"
          value={readiness.status === 'ok' ? 'Ready' : readiness.status === 'unavailable' ? 'Unavailable' : 'Unknown'}
          accent={readiness.status === 'ok'}
        />
        <MetricCard
          label="Connected services"
          value={`${operationalCount}`}
          delta={`${services.length - operationalCount} issue${services.length - operationalCount === 1 ? '' : 's'}`}
        />
        <MetricCard
          label="Recent events"
          value={`${events.length}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card title="Payment integrations">
          {services.length === 0 ? (
            <div className="text-xs text-ink-muted">No integration data returned by the backend.</div>
          ) : (
            <div className="space-y-2">
              {services
                .filter((s) => String(s.category ?? '').toLowerCase() === 'payment')
                .map((service) => (
                  <div key={service.name} className="flex justify-between items-center py-2 border-b border-surface-2 last:border-0 text-xs">
                    <span className="text-ink-muted">{service.name}</span>
                    <HealthDot status={service.status} />
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="SACCO API connections">
          {services.length === 0 ? (
            <div className="text-xs text-ink-muted">No SACCO connection data returned by the backend.</div>
          ) : (
            <div className="space-y-2">
              {services
                .filter((s) => String(s.category ?? '').toLowerCase() === 'sacco')
                .map((service) => (
                  <div key={service.name} className="flex justify-between items-center py-2 border-b border-surface-2 last:border-0 text-xs">
                    <span className="text-ink-muted">{service.name}</span>
                    <HealthDot status={service.status} />
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="Identity / compliance APIs">
          {services.length === 0 ? (
            <div className="text-xs text-ink-muted">No compliance API data returned by the backend.</div>
          ) : (
            <div className="space-y-2">
              {services
                .filter((s) => String(s.category ?? '').toLowerCase() === 'compliance')
                .map((service) => (
                  <div key={service.name} className="flex justify-between items-center py-2 border-b border-surface-2 last:border-0 text-xs">
                    <span className="text-ink-muted">{service.name}</span>
                    <HealthDot status={service.status} />
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {events.length > 0 && (
        <Card title="Recent system events">
          <DataTable
            columns={[
              { key: 'time', header: 'Time' },
              { key: 'event', header: 'Event' },
              {
                key: 'severity',
                header: 'Severity',
                render: (row) => {
                  const severity = String(row.severity).toLowerCase()
                  const variant =
                    severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : severity === 'resolved' ? 'success' : 'info'
                  return <Badge variant={variant}>{row.severity}</Badge>
                },
              },
              { key: 'resolution', header: 'Resolution' },
            ]}
            data={events}
            keyExtractor={(row) => row.id}
          />
        </Card>
      )}

      {services.length === 0 && events.length === 0 && (
        <div className="bg-surface border border-mid rounded-[10px] p-4 text-xs text-ink-muted">
          The backend did not return any service health or event data. System health details will appear here once the API exposes them.
        </div>
      )}
    </div>
  )
}

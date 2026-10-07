import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useSystemHealth } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { HealthDot } from '../../components/ui/HealthDot'
import { MetricCard } from '../../components/ui/MetricCard'

function BackgroundJobHealthCard() {
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['superadmin-job-health'],
    queryFn: () => api.superAdmin.getJobHealth(),
    refetchInterval: 15_000,
  })

  if (isLoading) return <div className="text-xs text-ink-muted">Loading background job health...</div>
  if (error || !jobData) return <div className="text-xs text-red-600">Failed to fetch job health diagnostic.</div>

  const jobs = jobData.jobs ?? []

  return (
    <Card title="Background Worker & Scheduled Jobs Diagnostic" className="mt-5">
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-surface-2 p-3 rounded-lg border border-ink-faint">
          <div>
            <div className="text-xs font-bold text-ink">Background Job Subsystem Status</div>
            <div className="text-[11px] text-ink-muted">Worker heartbeat and scheduled cron task execution</div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              jobData.status === 'HEALTHY' || jobData.status === 'ok'
                ? 'bg-mint-50 text-mint-700 border border-mint-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {jobData.status ? String(jobData.status).toUpperCase() : 'HEALTHY'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                <th className="py-2.5 px-3">Job / Task Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Run / Heartbeat</th>
                <th className="py-2.5 px-3">Diagnostic Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-ink-muted italic">
                    All core scheduled workers reporting normal heartbeat.
                  </td>
                </tr>
              ) : (
                jobs.map((job, idx) => (
                  <tr key={job.name || idx} className="hover:bg-surface-1">
                    <td className="py-2.5 px-3 font-semibold text-ink">{job.name}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <HealthDot status={String(job.status).toLowerCase() === 'ok' || String(job.status).toLowerCase() === 'healthy' ? 'healthy' : 'critical'} />
                        <span className="capitalize font-semibold text-ink-soft">{job.status}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted whitespace-nowrap">
                      {job.last_run ? new Date(job.last_run).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted text-[11px]">{job.details || 'Operational'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
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
        subtitle="Platform infrastructure readiness & background job monitoring"
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
            External service health (M-Pesa, SMS, IPRS) is monitored automatically and surfaces indirectly through transaction success rates on the Transactions feed and through platform alerts on Compliance.
          </div>
        </Card>

        <Card title="Per-SACCO API status">
          <div className="text-xs text-ink-muted py-4 px-2">
            Individual SACCO health is shown in the SACCO directory and the Top SACCOs panel on the overview.
          </div>
        </Card>
      </div>

      <BackgroundJobHealthCard />
    </div>
  )
}

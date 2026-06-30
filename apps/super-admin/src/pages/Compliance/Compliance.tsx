import { usePlatformAlerts, usePlatformOverview, useKycQueue, useAllSaccos } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { HealthDot } from '../../components/ui/HealthDot'
import type { SuperAdminSacco, PlatformAlert } from '@saccosphere/schemas'

export function Compliance() {
  const { data: flags, isLoading: flagsLoading } = usePlatformAlerts()
  const { data: overview, isLoading: overviewLoading } = usePlatformOverview()
  const { data: kycQueue, isLoading: kycLoading } = useKycQueue()
  const { data: saccosData, isLoading: saccosLoading } = useAllSaccos()

  const pendingKycCount = kycQueue?.length ?? 0
  const kycVerifiedPct = overview?.kyc_verified_pct ?? 0

  return (
    <div className="p-5">
      <PageHeader title="Compliance & KYC" subtitle="Platform-wide regulatory monitoring" />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="KYC verified members"
          value={kycVerifiedPct > 0 ? `${kycVerifiedPct.toFixed(1)}%` : '—'}
          delta={kycVerifiedPct > 0 ? 'From platform stats' : 'Not reported by backend yet'}
        />
        <MetricCard
          label="KYC pending review"
          value={pendingKycCount.toString()}
          delta="From KYC review queue"
        />
        <MetricCard
          label="AML flags / alerts"
          value={(flags?.length ?? 0).toString()}
          delta={flags?.length ? `${flags.length} open alerts` : 'No open alerts'}
        />
        <MetricCard
          label="System alerts"
          value={(overview?.system_alerts ?? 0).toString()}
          delta="From platform overview"
        />
      </div>

      {flags && flags.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-2.5 mb-2.5 text-xs text-red-900">
          {flags.length} platform alert{flags.length === 1 ? '' : 's'} require review
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card title="KYC status by SACCO">
          {saccosLoading ? (
            <div className="text-xs text-ink-muted">Loading SACCO directory...</div>
          ) : (saccosData?.results ?? []).length === 0 ? (
            <div className="text-xs text-ink-muted">No SACCO data returned from the backend.</div>
          ) : (
            <DataTable
              columns={[
                { key: 'name', header: 'SACCO', render: (row: SuperAdminSacco) => row.name },
                {
                  key: 'member_count',
                  header: 'Members',
                  render: (row: SuperAdminSacco) => row.member_count.toLocaleString(),
                },
                {
                  key: 'health',
                  header: 'Health',
                  render: (row: SuperAdminSacco) => <HealthDot status={row.health_status.toLowerCase()} />,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: SuperAdminSacco) => <Badge variant={row.is_active ? 'success' : 'error'}>{row.status}</Badge>,
                },
              ]}
              data={saccosData?.results ?? []}
              keyExtractor={(row: SuperAdminSacco) => row.id}
            />
          )}
        </Card>

        <Card title="Platform alerts">
          {flagsLoading ? (
            <div className="text-xs text-ink-muted">Loading alerts...</div>
          ) : (flags ?? []).length === 0 ? (
            <div className="text-xs text-ink-muted">No platform alerts.</div>
          ) : (
            <DataTable
              columns={[
                { key: 'sacco_name', header: 'SACCO', render: (row: PlatformAlert) => row.sacco_name },
                { key: 'flag_type', header: 'Flag type', render: (row: PlatformAlert) => row.flag_type },
                {
                  key: 'severity',
                  header: 'Severity',
                  render: (row: PlatformAlert) => {
                    const variant =
                      row.severity === 'CRITICAL' || row.severity === 'HIGH'
                        ? 'error'
                        : row.severity === 'MEDIUM'
                        ? 'warning'
                        : 'info'
                    return <Badge variant={variant}>{row.severity}</Badge>
                  },
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: PlatformAlert) => (
                    <div className="max-w-48 overflow-hidden text-ellipsis whitespace-nowrap text-ink-muted">
                      {row.description}
                    </div>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: () => (
                    <button className="px-2.5 py-0.5 rounded text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100">
                      Review
                    </button>
                  ),
                },
              ]}
              data={flags ?? []}
              keyExtractor={(row: PlatformAlert) => row.id}
            />
          )}
        </Card>
      </div>
    </div>
  )
}

import { usePlatformAlerts, useKycQueue, useAllSaccos } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { HealthDot } from '../../components/ui/HealthDot'
import type { SuperAdminSacco, PlatformAlert } from '@saccosphere/schemas'

export function Compliance() {
  const { data: flags, isLoading: flagsLoading } = usePlatformAlerts()
  const { data: kycQueue } = useKycQueue()
  const { data: saccosData, isLoading: saccosLoading } = useAllSaccos()

  const pendingKycCount = kycQueue?.length ?? 0

  return (

    <div className="p-5">
      <PageHeader title="Compliance & KYC" subtitle="Platform-wide regulatory monitoring" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <MetricCard
          label="KYC pending review"
          value={pendingKycCount.toString()}
          delta="From platform-wide KYC queue"
        />
        <MetricCard
          label="Open compliance flags"
          value={(flags?.length ?? 0).toString()}
          delta={flags?.length ? `${flags.length} open / investigating` : 'No open flags'}
          accent={!!flags?.length}
        />
      </div>

      <p className="text-[11px] text-ink-faint mb-3">
        Compliance flags are raised automatically by the platform's detectors. This view is
        read-only — flags are worked and closed in platform administration; there is no
        resolve action here. There is no separate transaction-level AML monitoring feed.
      </p>

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
                  key: 'created_at',
                  header: 'Raised',
                  render: (row: PlatformAlert) =>
                    row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: PlatformAlert) => (
                    <div className="max-w-64 overflow-hidden text-ellipsis whitespace-nowrap text-ink-muted">
                      {row.description}
                    </div>
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

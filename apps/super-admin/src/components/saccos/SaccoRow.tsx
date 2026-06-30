import { SaccoAvatar } from './SaccoAvatar'
import { Badge } from '../ui/Badge'
import { HealthDot } from '../ui/HealthDot'
import type { SuperAdminSacco } from '@saccosphere/schemas'

interface SaccoRowProps {
  sacco: SuperAdminSacco
}

export function SaccoRow({ sacco }: SaccoRowProps) {
  const feeStatus = sacco.fee_status ?? 'unknown'

  return (
    <div className="flex items-center gap-3">
      <SaccoAvatar name={sacco.name} color={sacco.color} initials={sacco.initials} />
      <div>
        <div className="font-medium text-ink">{sacco.name}</div>
        <div className="text-[10px] text-ink-faint">{sacco.sector || 'SACCO'}</div>
      </div>
    </div>
  )
}

export function SaccoStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? <Badge variant="success">Active</Badge> : <Badge variant="error">Suspended</Badge>
}

export function SaccoFeeBadge({ status }: { status: string | null | undefined }) {
  const normalized = String(status ?? 'unknown').toLowerCase()
  if (normalized === 'paid') return <Badge variant="success">Paid</Badge>
  if (normalized === 'pending') return <Badge variant="warning">Pending</Badge>
  if (normalized === 'overdue') return <Badge variant="error">Overdue</Badge>
  return <Badge variant="neutral">Unknown</Badge>
}

export function SaccoHealthDot({ status }: { status: string | null | undefined }) {
  const normalized = String(status ?? 'GOOD').toLowerCase()
  const label = normalized === 'good' ? 'Healthy' : normalized === 'review' ? 'Review' : normalized === 'api_issue' ? 'API issue' : normalized
  return <HealthDot status={normalized} label={label} />
}

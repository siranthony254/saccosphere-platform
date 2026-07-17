import { useParams } from 'react-router-dom'
import { useSaccoDetail } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SaccoAvatar } from '../../components/saccos'

export function SaccoDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: sacco, isLoading } = useSaccoDetail(id!)

  if (isLoading) return <div className="p-6 text-ink-muted">Loading SACCO details...</div>
  if (!sacco) return <div className="p-6">SACCO not found.</div>

  return (
    <div className="p-5">
      <PageHeader
        title={sacco.name}
        subtitle={`${sacco.sasra_reg_no || 'No SASRA reg'} · ${sacco.sector || 'SACCO'} · Active since ${sacco.joined_platform_at ? new Date(sacco.joined_platform_at).getFullYear() : 'N/A'}`}
        actions={
          <div className="flex gap-2">
            <button
              className="py-1.5 px-3.5 rounded-lg border border-mid bg-surface text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"
              onClick={() => window.location.href = `mailto:${sacco.email || ''}`}
            >
              Contact SACCO
            </button>
          </div>
        }

      />

      {/* Profile banner */}
      <div className="bg-violet-25 border border-violet-100 rounded-[10px] p-4 mb-5 flex items-center gap-4">
        <SaccoAvatar name={sacco.name} color={sacco.color} initials={sacco.initials} size="lg" />
        <div className="flex-1">
          <div className="text-base font-semibold text-ink">{sacco.name}</div>
          <div className="text-xs text-ink-muted mb-2">{sacco.sector}</div>
          <div className="flex gap-1.5">
            <Badge variant={sacco.is_active ? 'success' : 'error'}>{sacco.is_active ? 'Active' : 'Suspended'}</Badge>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card title="SACCO details">
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Total members</span>
            <span className="font-semibold text-ink">{sacco.member_count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Health status</span>
            <span className="font-semibold text-ink">{sacco.health_status}</span>
          </div>
        </Card>

        <Card title="Contact info">
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Email</span>
            <span className="font-semibold text-ink">{sacco.email || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Phone</span>
            <span className="font-semibold text-ink">{sacco.phone || '—'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Website</span>
            <a href={sacco.website || '#'} className="font-semibold text-violet-600 hover:underline">{sacco.website ? 'Visit website' : '—'}</a>
          </div>
        </Card>
      </div>
    </div>
  )
}

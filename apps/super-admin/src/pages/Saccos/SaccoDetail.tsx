import { useParams, useNavigate } from 'react-router-dom'
import { useSaccoDetail } from '../../hooks/usePlatformData'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SaccoAvatar, SaccoFeeBadge } from '../../components/saccos'

export function SaccoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: sacco, isLoading } = useSaccoDetail(id!)

  if (isLoading) return <div className="p-6 text-ink-muted">Loading SACCO details...</div>
  if (!sacco) return <div className="p-6">SACCO not found.</div>

  const formatKes = (value: number) => `KES ${value.toLocaleString()}`

  return (
    <div className="p-5">
      <PageHeader
        title={sacco.name}
        subtitle={`${sacco.sasra_reg_no || 'No SASRA reg'} · ${sacco.sector || 'SACCO'} · Active since ${sacco.joined_platform_at ? new Date(sacco.joined_platform_at).getFullYear() : 'N/A'}`}
        actions={
          <div className="flex gap-2">
            <button
              className="py-1.5 px-3.5 rounded-lg border-none bg-red-50 text-red-800 text-[13px] font-semibold cursor-not-allowed opacity-60"
              title="SACCO suspension is not supported by the current backend"
              disabled
            >
              Suspend SACCO
            </button>
            <button
              className="py-1.5 px-3.5 rounded-lg border border-mid bg-surface text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"
              onClick={() => alert('Contact admin requires backend endpoint')}
            >
              Contact admin
            </button>
            <button
              className="py-1.5 px-3.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[13px] font-semibold cursor-pointer transition-colors"
              onClick={() => alert('Edit settings requires backend endpoint')}
            >
              Edit settings
            </button>
          </div>
        }
      />

      {/* Profile banner */}
      <div className="bg-violet-25 border border-violet-100 rounded-[10px] p-4 mb-5 flex items-center gap-4">
        <SaccoAvatar name={sacco.name} color={sacco.color} initials={sacco.initials} size="lg" />
        <div className="flex-1">
          <div className="text-base font-semibold text-ink">{sacco.name}</div>
          <div className="text-xs text-ink-muted mb-2">{sacco.sector} · {sacco.sasra_reg_no || 'No SASRA reg'}</div>
          <div className="flex gap-1.5">
            <Badge variant={sacco.is_active ? 'success' : 'error'}>{sacco.status}</Badge>
            <Badge variant={sacco.api_connected ? 'success' : 'error'}>
              {sacco.api_connected ? 'API connected' : 'API disconnected'}
            </Badge>
            <SaccoFeeBadge status={sacco.fee_status} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ink-muted mb-1">Platform fee this month</div>
          <div className="text-lg font-bold text-ink mb-1">{formatKes(sacco.platform_fee_kes ?? 0)}</div>
          <SaccoFeeBadge status={sacco.fee_status} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card title="On platform">
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Members on app</span>
            <span className="font-semibold text-ink">{(sacco.members_on_app ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">% of total members</span>
            <span className="font-semibold text-ink">
              {sacco.member_count > 0 ? `${(((sacco.members_on_app ?? 0) / sacco.member_count) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Txn volume (MTD)</span>
            <span className="font-semibold text-ink">{formatKes(sacco.transaction_volume_mtd_kes ?? 0)}</span>
          </div>
        </Card>

        <Card title="Health">
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Total members</span>
            <span className="font-semibold text-ink">{sacco.member_count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">API status</span>
            <span className={`font-semibold ${sacco.api_connected ? 'text-mint-700' : 'text-red-800'}`}>
              {sacco.api_connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Overall health</span>
            <span className="font-semibold capitalize">{sacco.health ?? 'Unknown'}</span>
          </div>
        </Card>

        <Card title="Revenue contribution">
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">SaaS fee</span>
            <span className="font-semibold text-ink">{formatKes(sacco.platform_fee_kes ?? 0)}/mo</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Transaction fees (est.)</span>
            <span className="font-semibold text-ink">
              {formatKes(Math.round((sacco.transaction_volume_mtd_kes ?? 0) * 0.01))}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
            <span className="text-ink-muted">Total MTD</span>
            <span className="font-semibold text-ink">
              {formatKes((sacco.platform_fee_kes ?? 0) + Math.round((sacco.transaction_volume_mtd_kes ?? 0) * 0.01))}
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useSaccoDetail, useSuspendSacco } from '../../hooks/usePlatformData'

export function SaccoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: sacco, isLoading } = useSaccoDetail(id!)
  const { mutate: suspend, isPending } = useSuspendSacco()

  if (isLoading) return <div className="p-6 text-ink-muted">Loading SACCO details...</div>
  if (!sacco) return <div className="p-6">SACCO not found.</div>

  return (
    <div className="p-5">
      {/* Breadcrumb + actions */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer text-ink-muted text-sm hover:text-ink transition-colors">← All SACCOs</button>
          <span className="text-surface-3">|</span>
          <div>
            <div className="text-lg font-semibold text-ink">{sacco.name}</div>
            <div className="text-xs text-ink-muted">{sacco.sasra_reg_no} · {sacco.sector} · Active since {sacco.joined_platform_at ? new Date(sacco.joined_platform_at).getFullYear() : 'N/A'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            className={`py-1.5 px-3.5 rounded-lg border-none bg-red-50 text-red-800 text-[13px] font-semibold cursor-pointer transition-opacity ${isPending ? 'opacity-60' : 'hover:bg-red-100'}`}
            onClick={() => suspend(sacco.id)} 
            disabled={isPending}
          >
            {isPending ? 'Suspending...' : 'Suspend SACCO'}
          </button>
          <button 
            className="py-1.5 px-3.5 rounded-lg border border-mid bg-surface text-[13px] cursor-pointer hover:bg-surface-2 transition-colors"
            onClick={() => alert('Contact admin requires backend endpoint')}
          >
            Contact admin
          </button>
          <button 
            className="py-1.5 px-3.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[13px] font-semibold cursor-pointer transition-colors"
            onClick={() => alert('Edit settings requires backend endpoint: PATCH /api/v1/super-admin/saccos/{id}/configuration/')}
          >
            Edit settings
          </button>
        </div>
      </div>

      {/* Profile banner */}
      <div className="bg-violet-25 border border-violet-100 rounded-[10px] p-4 mb-5 flex items-center gap-4">
        <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: sacco.color || '#6D28D9' }}>
          {sacco.initials}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-ink">{sacco.name}</div>
          <div className="text-xs text-ink-muted mb-2">{sacco.sector} · {sacco.sasra_reg_no}</div>
          <div className="flex gap-1.5">
            {[
              { text: sacco.status, bg: 'bg-mint-50', color: 'text-mint-700' },
              { text: sacco.api_connected ? '● API connected' : '● API disconnected', bg: sacco.api_connected ? 'bg-mint-50' : 'bg-red-50', color: sacco.api_connected ? 'text-mint-700' : 'text-red-800' },
              { text: `Fee: ${sacco.fee_status}`, bg: sacco.fee_status === 'paid' ? 'bg-mint-50' : 'bg-red-50', color: sacco.fee_status === 'paid' ? 'text-mint-700' : 'text-red-800' },
            ].map((b, i) => (
              <span key={i} className={`${b.bg} ${b.color} py-0.5 px-2 rounded-full text-[11px] font-semibold`}>{b.text}</span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ink-muted mb-1">Platform fee this month</div>
          <div className="text-lg font-bold text-ink mb-1">KES {(sacco.platform_fee_kes ?? 0).toLocaleString()}</div>
          <span className={`${sacco.fee_status === 'paid' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-800'} py-0.5 px-2 rounded-full text-[11px] font-semibold`}>
            {sacco.fee_status}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { title: 'On platform', stats: [
            { l: 'Members on app', v: (sacco.members_on_app ?? 0).toLocaleString() },
            { l: '% of total members', v: sacco.member_count > 0 ? `${(((sacco.members_on_app ?? 0) / sacco.member_count) * 100).toFixed(1)}%` : '0%' },
            { l: 'Txn volume (MTD)', v: `KES ${((sacco.transaction_volume_mtd_kes ?? 0) / 1e6).toFixed(1)}M` },
          ]},
          { title: 'Health', stats: [
            { l: 'Total members', v: sacco.member_count.toLocaleString() },
            { l: 'API status', v: sacco.api_connected ? '● Connected' : '● Disconnected' },
            { l: 'Overall health', v: sacco.health },
          ]},
          { title: 'Revenue contribution', stats: [
            { l: 'SaaS fee', v: `KES ${(sacco.platform_fee_kes ?? 0).toLocaleString()}/mo` },
            { l: 'Transaction fees (est.)', v: `KES ${Math.round((sacco.transaction_volume_mtd_kes ?? 0) * 0.01).toLocaleString()}` },
            { l: 'Total MTD', v: `KES ${((sacco.platform_fee_kes ?? 0) + Math.round((sacco.transaction_volume_mtd_kes ?? 0) * 0.01)).toLocaleString()}` },
          ]},
        ].map(card => (
          <div key={card.title} className="bg-surface border border-mid rounded-[10px] p-4">
            <div className="font-semibold text-[13px] text-ink mb-2.5">{card.title}</div>
            {card.stats.map(s => (
              <div key={s.l} className="flex justify-between py-2 border-b border-surface-2 text-xs last:border-0">
                <span className="text-ink-muted">{s.l}</span>
                <span className="font-semibold text-ink">{s.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

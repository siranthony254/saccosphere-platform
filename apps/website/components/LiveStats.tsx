import { getPublicStats } from '@/lib/api'
import { MARKET_CONTEXT } from '@/lib/constants'

export async function LiveStats() {
  const stats = await getPublicStats()

  const items = [
    {
      value: stats ? stats.total_saccos.toLocaleString() : '—',
      label: 'SACCOs on the network today',
      live: true,
    },
    {
      value: stats ? stats.total_members_on_app.toLocaleString() : '—',
      label: 'Members on SaccoSphere today',
      live: true,
    },
    {
      value: MARKET_CONTEXT.regulatedMembers,
      label: 'Regulated SACCO members in Kenya',
      live: false,
    },
    {
      value: MARKET_CONTEXT.regulatedAssets,
      label: 'Regulated SACCO assets',
      live: false,
    },
  ]

  return (
    <div className="mx-auto mt-10 max-w-wide rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center gap-2">
              {item.live && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-mint-light" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
                </span>
              )}
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/35">
                {item.live ? 'Live' : MARKET_CONTEXT.sourceLabel}
              </span>
            </div>
            <div className="text-2xl font-semibold text-white sm:text-[28px]">{item.value}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveStatsSkeleton() {
  return (
    <div className="mx-auto mt-10 max-w-wide animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 h-2.5 w-16 rounded bg-white/10" />
            <div className="mb-1.5 h-7 w-20 rounded bg-white/10" />
            <div className="h-2.5 w-28 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

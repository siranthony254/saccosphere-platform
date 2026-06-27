import { usePlatformOverview, usePlatformLiveFeed } from '../hooks/usePlatformData'

function Metric({ label, value, delta, accent = false }: { label:string; value:string; delta?:string; accent?:boolean }) {
  return (
    <div className={`rounded-[10px] py-[14px] px-4 ${accent ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-none' : 'bg-surface border border-mid'}`}>
      <div className={`text-[10px] mb-1.5 uppercase tracking-[0.04em] font-medium ${accent ? 'text-white/60' : 'text-ink-muted'}`}>{label}</div>
      <div className={`text-[22px] font-semibold leading-none mb-1 ${accent ? 'text-white' : 'text-ink'}`}>{value}</div>
      {delta && <div className={`text-[11px] ${accent ? 'text-mint-300' : 'text-mint-700'}`}>{delta}</div>}
    </div>
  )
}

export function Overview() {
  const { data: overview, isLoading, error } = usePlatformOverview()
  const { feed, connected } = usePlatformLiveFeed()

  if (isLoading) return <div className="p-6 text-ink-muted">Loading platform data...</div>
  
  if (error || !overview) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <div className="font-semibold mb-1">Failed to load overview</div>
        <div className="text-[13px] text-red-900">{error?.message || 'Unable to fetch platform data. Please check your connection.'}</div>
      </div>
    </div>
  )

  const d = overview

  return (
    <div className="p-5">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Platform overview</div>
          <div className="text-xs text-ink-muted">Saccosphere platform · All SACCOs · {new Date().toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-violet-500 bg-violet-50 py-1.5 px-3 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />All systems operational
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Metric label="Total SACCOs" value={d.total_saccos?.toString() ?? '0'} />
        <Metric label="Total members on app" value={d.total_members_on_app?.toLocaleString() ?? '0'} />
        <Metric label="Active SACCOs" value={d.total_saccos?.toString() ?? '0'} />
        <Metric label="Platform status" value="Operational" delta="All systems running" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Platform stats */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="font-semibold text-[13px] text-ink mb-3">Platform statistics</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-[10px] text-ink-muted mb-0.5">Total SACCOs</div>
              <div className="text-2xl font-bold text-violet-500">{d.total_saccos ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-ink-muted mb-0.5">Total members</div>
              <div className="text-2xl font-bold text-violet-500">{d.total_members_on_app ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Live transaction feed */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold text-[13px] text-ink">Live transaction feed — all SACCOs</div>
            <div className="flex items-center gap-1 text-[11px] text-violet-500">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              {connected ? 'Real-time' : 'Connecting...'}
            </div>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-surface-2">
                {['Time','Member','SACCO','Type','Amount','Fee','Status'].map(h => (
                  <th key={h} className="text-left py-1.5 px-2 text-[10px] text-ink-muted font-medium border-b border-mid">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-ink-muted text-xs">No transactions returned from the backend yet.</td>
                </tr>
              ) : (
                feed.map((t: any, i: number) => (
                <tr key={t.id} className={`border-b border-surface-2 ${i === 0 ? 'bg-violet-25' : i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>
                  <td className="p-2 text-ink-faint text-[10px] font-mono">{t.time}</td>
                  <td className="p-2 font-medium">{t.member}</td>
                  <td className="p-2 text-ink-muted">{t.sacco}</td>
                  <td className="p-2">{t.type}</td>
                  <td className={`p-2 font-semibold ${t.status === 'failed' ? 'text-red-700' : 'text-mint-700'}`}>
                    {t.status === 'failed' ? '✗' : '+'}{t.amount.toLocaleString()}
                  </td>
                  <td className="p-2 text-ink-muted">KES {t.platform_fee}</td>
                  <td className="p-2">
                    <span className={`${t.status === 'completed' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-800'} py-0.5 px-1.5 rounded-lg text-[10px] font-semibold`}>
                      {t.status === 'completed' ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

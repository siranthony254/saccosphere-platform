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

  const fmt = (n: number) => n >= 1e9 ? `KES ${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `KES ${(n/1e6).toFixed(1)}M` : `KES ${n.toLocaleString()}`

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
          <button className="py-1.5 px-3.5 rounded-lg border border-mid bg-surface text-[13px] cursor-pointer hover:bg-surface-2 transition-colors">Export board report</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <Metric label="Platform transaction volume" value={fmt(d.transaction_volume_mtd_kes)} delta="▲ +22% vs last month" accent />
        <Metric label="Active SACCOs" value={d.active_saccos.toString()} delta="▲ +3 this month" />
        <Metric label="Total members on app" value={d.total_members_on_app.toLocaleString()} delta="▲ +1,840 this month" />
        <Metric label="Platform revenue (MTD)" value={fmt(d.platform_revenue_mtd_kes)} delta="SaaS + transaction fees" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <div>
          <div className="bg-surface border border-mid rounded-[10px] p-4 mb-3.5">
            <div className="font-semibold text-[13px] text-ink mb-3">Revenue breakdown — MTD</div>
            {[
              { label:'SaaS fees (45 SACCOs)', value:fmt(d.saas_revenue_mtd_kes), pct:52, color:'bg-violet-500' },
              { label:'Transaction fees (1%)', value:fmt(d.transaction_fees_mtd_kes), pct:48, color:'bg-mint-700' },
            ].map(r => (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-muted">{r.label}</span>
                  <span className="font-semibold text-ink">{r.value}</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-surface-2">
              {[
                { label:'ARR', value:'KES 21.8M' },
                { label:'Projected 12mo', value:'KES 28M' },
                { label:'Per SACCO avg', value:'KES 38.7K' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-[10px] text-ink-muted mb-0.5">{s.label}</div>
                  <div className="text-sm font-bold text-violet-500">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System alerts */}
          <div className="bg-surface border border-mid rounded-[10px] p-4">
            <div className="font-semibold text-[13px] text-ink mb-3">Platform alerts</div>
            {[
              { color:'border-amber-600', bg:'bg-amber-50', text:'Unaitas SACCO: 18 membership applications pending SACCO review for 5+ days', textClass:'text-amber-700' },
              { color:'border-red-700', bg:'bg-red-50', text:'Kenya Police SACCO: M-Pesa API callback timeout — 3 failed disbursements', textClass:'text-red-800' },
              { color:'border-amber-600', bg:'bg-amber-50', text:'Stima SACCO: CBK AML report due in 3 days — not yet submitted', textClass:'text-amber-700' },
              { color:'border-violet-800', bg:'bg-violet-50', text:'2 new SACCO onboarding requests — pending super admin approval', textClass:'text-violet-800' },
            ].map((a,i) => (
              <div key={i} className={`${a.bg} border-l-[3px] ${a.color} rounded-r-lg py-2 px-3 mb-2 text-xs ${a.textClass}`}>
                {a.text}
              </div>
            ))}
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
              {feed.map((t: any, i: number) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

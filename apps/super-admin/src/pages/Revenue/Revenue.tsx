import { useRevenueData, usePlatformOverview } from '../../hooks/usePlatformData'

export function Revenue() {
  const { data: revenue } = useRevenueData()
  const { data: overview } = usePlatformOverview()

  const fmt = (n: number) => n >= 1e6 ? `KES ${(n/1e6).toFixed(1)}M` : `KES ${n.toLocaleString()}`

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Revenue</div>
          <div className="text-xs text-ink-muted">Platform-wide earnings — {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="flex gap-2">
          <select className="py-1.5 px-3 border border-mid rounded-lg text-[13px] bg-surface text-ink outline-none">
            <option>April 2024</option><option>Q1 2024</option><option>Full year 2023</option>
          </select>
          <button className="py-1.5 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[13px] font-semibold transition-colors">Board export</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total MRR', value: fmt(overview?.platform_revenue_mtd_kes ?? 1820000), delta: '▲ +22% vs March', accent: true },
          { label: 'SaaS fees (45 SACCOs)', value: fmt(overview?.saas_revenue_mtd_kes ?? 940000), delta: 'KES 20K avg / SACCO' },
          { label: 'Transaction fees (1%)', value: fmt(overview?.transaction_fees_mtd_kes ?? 880000), delta: 'KES 182M txn volume' },
          { label: 'Overdue fees', value: 'KES 32K', delta: 'Kenya Police SACCO', deltaColor: 'text-red-700' },
        ].map(m => (
          <div key={m.label} className={`rounded-[10px] py-[14px] px-4 ${m.accent ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-none' : 'bg-surface border border-mid'}`}>
            <div className={`text-[10px] mb-1.5 uppercase tracking-[0.04em] font-medium ${m.accent ? 'text-white/60' : 'text-ink-muted'}`}>{m.label}</div>
            <div className={`text-[22px] font-semibold leading-none mb-1 ${m.accent ? 'text-white' : 'text-ink'}`}>{m.value}</div>
            <div className={`text-[11px] ${(m as any).deltaColor ?? (m.accent ? 'text-indigo-200' : 'text-mint-700')}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Per-SACCO table */}
        <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
          <div className="py-3 px-4 border-b border-surface-2 font-semibold text-[13px] text-ink">Revenue by SACCO</div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {['SACCO', 'SaaS fee', 'Txn fees', 'Total', 'Status'].map(h => (
                  <th key={h} className="text-left py-1.5 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(revenue?.saas_fees ?? []).map((row: any, i: number) => (
                <tr key={row.sacco} className={`border-b border-surface-2 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'}`}>
                  <td className="py-2 px-3 font-medium">{row.sacco}</td>
                  <td className="py-2 px-3 text-ink-muted">KES {row.fee.toLocaleString()}</td>
                  <td className="py-2 px-3 text-ink-muted">KES {row.txn_fees.toLocaleString()}</td>
                  <td className="py-2 px-3 font-bold text-violet-500">KES {row.total.toLocaleString()}</td>
                  <td className="py-2 px-3">
                    <span className={`${row.status === 'paid' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-800'} py-0.5 px-2 rounded-full text-[10px] font-semibold`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ARR / growth */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="font-semibold text-[13px] text-ink mb-4">Revenue growth (KES K)</div>
          {/* Bar chart */}
          <div className="flex items-end gap-1 h-[90px] mb-2">
            {[20,26,34,42,48,55,62,70,78,84,91,100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className={`w-full rounded-t-sm h-full ${i === 11 ? 'bg-indigo-200' : 'bg-violet-500'}`} style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-ink-faint mb-4">
            {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m, i) => <span key={i}>{m}</span>)}
          </div>

          <div className="border-t border-surface-2 pt-3.5 grid grid-cols-3 gap-2.5">
            {[
              { label: 'ARR', value: fmt(revenue?.arr_kes ?? 21840000) },
              { label: 'Projected (12mo)', value: fmt(revenue?.projected_12mo_kes ?? 28000000) },
              { label: 'Per SACCO avg', value: `KES ${(revenue?.avg_per_sacco_kes ?? 38700).toLocaleString()}` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-[10px] text-ink-muted mb-1">{s.label}</div>
                <div className="text-[15px] font-bold text-violet-500">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

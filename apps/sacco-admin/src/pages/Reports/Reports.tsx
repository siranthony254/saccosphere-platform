import { useSaccoAdminDashboard } from '../../hooks/useSaccoAdminDashboard'

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-[#e5ede9] rounded-[3px] overflow-hidden mt-1">
      <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Reports() {
  useSaccoAdminDashboard()

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Analytics</div>
          <div className="text-xs text-ink-muted">Financial & membership analytics · Stima SACCO</div>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            <option>Q1 2024</option><option>Q2 2024</option><option>Full year 2023</option>
          </select>
          <button className="px-4 py-1.5 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors">
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total contributions Q1', value: 'KES 48M', delta: '▲ +12% vs Q1 2023', col: 'text-mint-600' },
          { label: 'Loans disbursed Q1', value: 'KES 32M', delta: '▲ +8% vs Q1 2023', col: 'text-mint-600' },
          { label: 'Repayments Q1', value: 'KES 28M', delta: '96.2% on time', col: 'text-amber-600' },
          { label: 'New members Q1', value: '112', delta: '▲ +22 vs Q1 2023', col: 'text-mint-600' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-[#e5ede9] rounded-[10px] p-[14px_16px]">
            <div className="text-[10px] text-ink-muted mb-1.5 uppercase tracking-widest font-medium">{m.label}</div>
            <div className="text-xl font-semibold text-ink mb-0.5">{m.value}</div>
            <div className={`text-[11px] ${m.col}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Contributions bar chart */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3.5">Monthly contributions (KES M)</div>
          <div className="flex items-end gap-1 h-[100px]">
            {[52,58,63,71,67,78,74,85,79,90,83,95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full rounded-t-[3px] bg-mint-600" style={{ height: `${h}%`, backgroundColor: i === 11 ? '#9fe1cb' : undefined }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-ink-faint mt-1">
            {['M','J','J','A','S','O','N','D','J','F','M','A'].map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </div>

        {/* Portfolio breakdown */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3.5">Loan portfolio breakdown</div>
          {[
            { label: 'Development loans', value: 'KES 420M', pct: 47, color: '#0d7a4e' },
            { label: 'Emergency loans', value: 'KES 230M', pct: 26, color: '#3b82f6' },
            { label: 'School fees loans', value: 'KES 160M', pct: 18, color: '#f59e0b' },
            { label: 'Asset financing', value: 'KES 80M', pct: 9, color: '#8b5cf6' },
          ].map(row => (
            <div key={row.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-muted">{row.label}</span>
                <span className="text-xs font-semibold text-ink">{row.value} ({row.pct}%)</span>
              </div>
              <Bar pct={row.pct} color={row.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
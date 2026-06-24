import { useAMLFlags, usePlatformOverview } from '../../hooks/usePlatformData'

export function Compliance() {
  const { data: flags } = useAMLFlags()
  const { data: overview } = usePlatformOverview()

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Compliance</div>
          <div className="text-xs text-ink-muted">Platform-wide regulatory monitoring</div>
        </div>
        <button className="px-4 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs cursor-pointer hover:bg-neutral-50">Download compliance report</button>
      </div>

      {/* KPI metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'KYC verified members', value: `${overview?.kyc_verified_pct ?? 91.2}%`, delta: '▲ +2.1% this month', deltaColor: 'text-mint-600' },
          { label: 'KYC pending', value: '2,500', delta: 'Across 14 SACCOs', deltaColor: 'text-amber-600' },
          { label: 'AML flags open', value: (overview?.aml_flags_open ?? 4).toString(), delta: '▲ +1 vs last month', deltaColor: 'text-red-500' },
          { label: 'SASRA reports due', value: '3', delta: 'Next 7 days', deltaColor: 'text-amber-600' },
        ].map(m => (
          <div key={m.label} className="bg-surface border border-neutral-300 rounded-xl p-3.5">
            <div className="text-xs text-ink-muted mb-1.5 uppercase tracking-wider font-medium">{m.label}</div>
            <div className="text-2xl font-semibold text-ink leading-tight mb-1">{m.value}</div>
            <div className={`text-xs ${m.deltaColor}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-2.5 mb-2.5 text-xs text-red-900">
        ⚠ Stima SACCO: CBK AML monthly report due in 3 days. Notify SACCO admin immediately.
      </div>
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-2.5 mb-5 text-xs text-amber-900">
        Imarika SACCO: 3 member KYC documents flagged for manual review — documents appear inconsistent.
      </div>

      {/* KYC rates table */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-neutral-300 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-200 font-semibold text-sm text-ink">KYC status by SACCO</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {['SACCO', 'Members', 'Verified', 'Pending', '%'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { sacco: 'Stima SACCO', members: 4821, verified: 4792, pending: 29, pct: 99.4, good: true },
                { sacco: 'Unaitas SACCO', members: 62440, verified: 57800, pending: 4640, pct: 92.6, good: true },
                { sacco: 'Teachers SACCO', members: 28012, verified: 27900, pending: 112, pct: 99.6, good: true },
                { sacco: 'Kenya Police SACCO', members: 35200, verified: 34100, pending: 1100, pct: 96.9, good: true },
                { sacco: 'Imarika SACCO', members: 18003, verified: 15800, pending: 2203, pct: 87.8, good: false },
              ].map((row, i) => (
                <tr key={row.sacco} className={`border-b border-neutral-200 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
                  <td className="px-3 py-2 font-medium">{row.sacco}</td>
                  <td className="px-3 py-2 text-ink-muted">{row.members.toLocaleString()}</td>
                  <td className="px-3 py-2 text-mint-700 font-medium">{row.verified.toLocaleString()}</td>
                  <td className="px-3 py-2 text-ink-muted">{row.pending.toLocaleString()}</td>
                  <td className={`px-3 py-2 font-bold ${row.good ? 'text-mint-700' : 'text-red-700'}`}>{row.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AML flags */}
        <div className="bg-surface border border-neutral-300 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-200 font-semibold text-sm text-ink">AML flags requiring review</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {['Member', 'SACCO', 'Flag reason', 'Risk', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(flags ?? []).map((flag, i) => {
                const riskClass = {
                  low: 'bg-mint-50 text-mint-700',
                  medium: 'bg-amber-50 text-amber-800',
                  high: 'bg-red-50 text-red-700',
                }[flag.risk_level] || 'bg-amber-50 text-amber-800'
                return (
                  <tr key={flag.id} className={`border-b border-neutral-200 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
                    <td className="px-3 py-2 font-medium">{flag.member_name}</td>
                    <td className="px-3 py-2 text-ink-muted">{flag.sacco_name}</td>
                    <td className="px-3 py-2 text-ink-muted max-w-48 overflow-hidden text-ellipsis whitespace-nowrap">{flag.flag_reason}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskClass}`}>{flag.risk_level}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button className="px-2.5 py-0.5 rounded text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100">Review</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

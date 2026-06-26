import { useAMLFlags, usePlatformOverview, useKycQueue, useAllSaccos } from '../../hooks/usePlatformData'

export function Compliance() {
  const { data: flags } = useAMLFlags()
  const { data: overview } = usePlatformOverview()
  const { data: kycQueue } = useKycQueue()
  const { data: saccosData } = useAllSaccos()

  const pendingKycCount = kycQueue?.length ?? overview?.aml_flags_open ?? 0
  const kycVerifiedPct = overview?.kyc_verified_pct ?? 0

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Compliance</div>
          <div className="text-xs text-ink-muted">Platform-wide regulatory monitoring</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {
            label: 'KYC verified members',
            value: kycVerifiedPct > 0 ? `${kycVerifiedPct.toFixed(1)}%` : '—',
            delta: kycVerifiedPct > 0 ? 'From platform stats' : 'Not reported by backend yet',
            deltaColor: 'text-ink-muted',
          },
          {
            label: 'KYC pending review',
            value: pendingKycCount.toString(),
            delta: 'From KYC review queue',
            deltaColor: 'text-amber-600',
          },
          {
            label: 'AML flags open',
            value: (flags?.length ?? overview?.aml_flags_open ?? 0).toString(),
            delta: flags?.length ? 'From KYC/compliance queue' : 'No open flags',
            deltaColor: flags?.length ? 'text-red-500' : 'text-mint-700',
          },
        ].map(m => (
          <div key={m.label} className="bg-surface border border-neutral-300 rounded-xl p-3.5">
            <div className="text-xs text-ink-muted mb-1.5 uppercase tracking-wider font-medium">{m.label}</div>
            <div className="text-2xl font-semibold text-ink leading-tight mb-1">{m.value}</div>
            <div className={`text-xs ${m.deltaColor}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-2.5 mb-2.5 text-xs text-red-900">
        {flags?.length ? `${flags.length} compliance items require review` : 'No compliance flags open'}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-neutral-300 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-200 font-semibold text-sm text-ink">SACCO directory summary</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {['SACCO', 'Members', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(saccosData?.results ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-ink-muted">No SACCO data returned from the backend.</td>
                </tr>
              ) : (
                (saccosData?.results ?? []).map((row, i) => (
                  <tr key={row.id} className={`border-b border-neutral-200 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-ink-muted">{row.member_count.toLocaleString()}</td>
                    <td className="px-3 py-2 capitalize">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-neutral-300 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-neutral-200 font-semibold text-sm text-ink">KYC / compliance queue</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {['Member', 'SACCO', 'Reason', 'Risk', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(flags ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-muted">No items in the KYC review queue.</td>
                </tr>
              ) : (
                (flags ?? []).map((flag, i) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { usePlatformAlerts, usePlatformOverview, useKycQueue, useAllSaccos } from '../../hooks/usePlatformData'

export function Compliance() {
  const { data: flags } = usePlatformAlerts()
  const { data: overview } = usePlatformOverview()
  const { data: kycQueue } = useKycQueue()
  const { data: saccosData } = useAllSaccos()

  const pendingKycCount = kycQueue?.length ?? 0
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
            label: 'Platform alerts',
            value: (flags?.length ?? 0).toString(),
            delta: flags?.length ? 'From compliance flags' : 'No open alerts',
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

      <div className={`bg-${flags?.length ? 'red' : 'mint'}-50 border-l-4 border-${flags?.length ? 'red' : 'mint'}-500 rounded-r-lg p-2.5 mb-2.5 text-xs text-${flags?.length ? 'red' : 'mint'}-900`}>
        {flags?.length ? `${flags.length} platform alerts require review` : 'No platform alerts open'}
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
          <div className="p-3 border-b border-neutral-200 font-semibold text-sm text-ink">Platform alerts</div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100">
                {['SACCO', 'Flag type', 'Severity', 'Description', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(flags ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-muted">No platform alerts.</td>
                </tr>
              ) : (
                (flags ?? []).map((flag, i) => {
                  const severityClass = {
                    CRITICAL: 'bg-red-50 text-red-700',
                    HIGH: 'bg-amber-50 text-amber-800',
                    MEDIUM: 'bg-yellow-50 text-yellow-700',
                    LOW: 'bg-mint-50 text-mint-700',
                  }[flag.severity] || 'bg-amber-50 text-amber-800'
                  return (
                    <tr key={flag.id} className={`border-b border-neutral-200 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
                      <td className="px-3 py-2 font-medium">{flag.sacco_name}</td>
                      <td className="px-3 py-2 text-ink-muted">{flag.flag_type}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityClass}`}>{flag.severity}</span>
                      </td>
                      <td className="px-3 py-2 text-ink-muted max-w-48 overflow-hidden text-ellipsis whitespace-nowrap">{flag.description}</td>
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

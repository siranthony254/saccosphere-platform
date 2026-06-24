import { usePlatformLiveFeed } from '../../hooks/usePlatformData'

export function TransactionsFeed() {
  const { feed, connected } = usePlatformLiveFeed()

  const totalVol = feed.reduce((s: number, t: any) => s + t.amount, 0)
  const totalFees = feed.reduce((s: number, t: any) => s + t.platform_fee, 0)
  const failed = feed.filter((t: any) => t.status === 'failed').length

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Transaction feed</div>
          <div className="text-xs text-ink-muted">Platform-wide · Real-time feed · {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 px-3 py-1.5 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            {connected ? 'Real-time' : 'Connecting...'}
          </div>
          <button className="px-3.5 py-1.5 rounded-lg border border-neutral-300 bg-surface text-xs cursor-pointer hover:bg-neutral-50">Export</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Volume (session)', value: `KES ${totalVol.toLocaleString()}`, delta: `${feed.length} transactions`, accent: true },
          { label: 'Platform fees earned', value: `KES ${totalFees.toLocaleString()}`, delta: '~1% take rate' },
          { label: 'Successful', value: `${feed.filter((t: any) => t.status === 'completed').length}`, delta: 'All SACCOs' },
          { label: 'Failed transactions', value: failed.toString(), delta: failed > 0 ? '⚠ Needs attention' : '✓ All clear', deltaColor: failed > 0 ? 'text-red-700' : 'text-mint-700' },
        ].map(m => (
          <div key={m.label} className={m.accent ? 'bg-gradient-to-br from-violet-600 to-violet-500 rounded-xl p-3.5 text-white' : 'bg-surface border border-neutral-300 rounded-xl p-3.5'}>
            <div className={`text-xs ${m.accent ? 'text-white/60' : 'text-ink-muted'} mb-1.5 uppercase tracking-wider font-medium`}>{m.label}</div>
            <div className={`text-2xl font-semibold ${m.accent ? 'text-white' : 'text-ink'} leading-tight mb-1`}>{m.value}</div>
            <div className={`text-xs ${(m as any).deltaColor || (m.accent ? 'text-mint-300' : 'text-mint-700')}`}>{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Live table */}
      <div className="bg-surface border border-neutral-300 rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-neutral-200">
          <div className="font-semibold text-sm text-ink">Live transaction feed — all SACCOs</div>
          <div className="flex items-center gap-1 text-xs text-violet-600">
            <div className="w-1 h-1 rounded-full bg-violet-600" />
            Auto-updating every 3.5 seconds
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-100">
              {['Time', 'Member', 'SACCO', 'Type', 'Amount (KES)', 'Method', 'Platform fee', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-1.5 text-xs text-ink-muted font-medium border-b border-neutral-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(feed as any[]).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-ink-muted">No transactions returned from the backend.</td>
              </tr>
            ) : (
              (feed as any[]).map((t, i) => (
              <tr key={t.id} className={`border-b border-neutral-200 ${i === 0 ? 'bg-violet-25' : i % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
                <td className="px-3 py-2 text-ink-muted font-mono text-xs">{t.time}</td>
                <td className="px-3 py-2 font-medium">{t.member}</td>
                <td className="px-3 py-2 text-ink-muted">{t.sacco}</td>
                <td className="px-3 py-2">{t.type}</td>
                <td className={`px-3 py-2 font-semibold ${t.status === 'failed' ? 'text-red-700' : 'text-mint-700'}`}>
                  {t.status === 'failed' ? '✗ ' : '+'}{t.amount.toLocaleString()}
                </td>
                <td className="px-3 py-2">📱 {t.method === 'mpesa' ? 'M-Pesa' : t.method}</td>
                <td className="px-3 py-2 text-ink-muted">KES {t.platform_fee}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'completed' ? 'bg-mint-50 text-mint-800' : 'bg-red-50 text-red-700'}`}>
                    {t.status === 'completed' ? '✓ OK' : '✗ Failed'}
                  </span>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

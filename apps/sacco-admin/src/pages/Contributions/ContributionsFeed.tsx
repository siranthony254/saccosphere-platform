import { useContributionFeed } from '../../hooks/useContributionFeed'

const METHOD_LABELS: Record<string, string> = { mpesa: '📱 M-Pesa', airtel: '📱 Airtel', bank: '🏦 Bank', internal: '⚙️ Internal' }

export function ContributionsFeed() {
  const { contributions, connected } = useContributionFeed()
  const todayTotal = contributions.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Contribution feed</div>
          <div className="text-xs text-ink-muted">Live feed · KES {todayTotal.toLocaleString()} received today</div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${connected ? 'text-mint-600 bg-mint-50' : 'text-ink-muted bg-surface-3'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-mint-600 animate-pulse' : 'bg-ink-faint'}`} />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Received today', value: `KES ${todayTotal.toLocaleString()}`, delta: `${contributions.length} transactions` },
          { label: 'Via M-Pesa', value: `KES ${contributions.filter(c => c.payment_method === 'mpesa').reduce((s,c) => s+c.amount, 0).toLocaleString()}`, delta: `${contributions.filter(c => c.payment_method === 'mpesa').length} txns` },
          { label: 'Platform fees earned', value: `KES ${contributions.reduce((s,c) => s+c.platform_fee, 0).toLocaleString()}`, delta: 'From all transactions' },
        ].map(m => (
          <div key={m.label} className="bg-white border border-[#e5ede9] rounded-[10px] p-[14px_16px]">
            <div className="text-[10px] text-ink-muted mb-1.5 uppercase tracking-widest font-medium">{m.label}</div>
            <div className="text-xl font-semibold text-ink mb-0.5">{m.value}</div>
            <div className="text-[11px] text-mint-600">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Live table */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-surface-3">
          <div className="font-semibold text-sm text-ink">Live contribution feed</div>
          <div className="flex items-center gap-1.5 text-[11px] text-mint-600">
            <div className="w-1.5 h-1.5 rounded-full bg-mint-600" />
            Real-time
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2">
              {['Time', 'Member', 'Amount (KES)', 'Method', 'Reference', 'Platform fee', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium border-b border-[#e5ede9]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contributions.map((c, i) => (
              <tr key={c.id} className={`${i === 0 ? 'bg-mint-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3`}>
                <td className="px-3 py-2.5 text-xs text-ink-muted">
                  {new Date(c.date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-3 py-2.5 font-medium">{(c as any).member_name ?? 'Member'}</td>
                <td className="px-3 py-2.5 font-semibold text-mint-600">+{c.amount.toLocaleString()}</td>
                <td className="px-3 py-2.5">{METHOD_LABELS[c.payment_method] ?? c.payment_method}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">{c.payment_ref}</td>
                <td className="px-3 py-2.5 text-ink-muted">KES {c.platform_fee}</td>
                <td className="px-3 py-2.5">
                  <span className="bg-mint-50 text-mint-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">✓ Confirmed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
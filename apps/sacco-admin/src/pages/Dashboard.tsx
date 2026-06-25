import { useSaccoAdminDashboard } from '../hooks/useSaccoAdminDashboard'
import {useMembers} from '../hooks/useMembers'

function MetricCard({ label, value, delta, deltaColor = 'text-mint-600' }: { label: string; value: string; delta?: string; deltaColor?: string }) {
  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-[14px_16px]">
      <div className="text-[10px] text-ink-muted mb-1.5 font-medium uppercase tracking-widest">{label}</div>
      <div className="text-[22px] font-semibold text-ink leading-none mb-1">{value}</div>
      {delta && <div className={`text-[11px] ${deltaColor}`}>{delta}</div>}
    </div>
  )
}

export function Dashboard() {
  const { data, isLoading, error } = useSaccoAdminDashboard()

  if (isLoading) return (
    <div className="p-5">
      <div className="text-sm text-ink-muted">Loading dashboard...</div>
      {[1,2,3,4].map(i => <div key={i} className="h-20 bg-ink-faint rounded-[10px] mb-3" />)}
    </div>
  )

  if (error || !data) return (
    <div className="p-5">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="font-semibold mb-1">Failed to load dashboard</div>
        <div className="text-sm text-red-800">{error?.message || 'Unable to fetch dashboard data. Please check your connection.'}</div>
      </div>
    </div>
  )

  const d = data
  const fmt = (n: number) => n >= 1e9 ? `KES ${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `KES ${(n/1e6).toFixed(1)}M` : `KES ${n.toLocaleString()}`

  const pendingActions = [
    { bg: 'bg-amber-50', text: `${d.pending_applications} new membership applications awaiting review`, borderColor: 'border-l-amber-500', textColor: 'text-amber-700' },
    { bg: 'bg-amber-50', text: `${d.pending_loan_approvals} loan applications awaiting approval`, borderColor: 'border-l-amber-500', textColor: 'text-amber-700' },
    { bg: 'bg-red-50', text: `${d.members_in_arrears} members in 90+ day default — escalation required`, borderColor: 'border-l-red-500', textColor: 'text-red-700' },
    { bg: 'bg-blue-50', text: `${d.pending_kyc_reviews} KYC documents submitted for review`, borderColor: 'border-l-blue-500', textColor: 'text-blue-700' },
  ]

  const portfolioHealth = [
    { label: 'Performing loans', value: '94.8%', width: '94.8%', barColor: 'bg-mint-600', textColor: 'text-mint-600' },
    { label: '30–60 day arrears', value: '3.1%', width: '3.1%', barColor: 'bg-amber-500', textColor: 'text-amber-600' },
    { label: '90+ day default', value: `${d.default_rate_pct}%`, width: `${d.default_rate_pct}%`, barColor: 'bg-red-500', textColor: 'text-red-700' },
  ]

  return (
    <div className="p-5">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">{ Overview }</div>
          <div className="text-xs text-ink-muted">{ new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })} · Live data · {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-xs text-mint-600 bg-mint-50 px-2.5 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-mint-600" />
            Live
          </div>
          <button className="px-3.5 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors">
            Export report
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Total members" value={d.total_members.toLocaleString()} />
        <MetricCard label="Total savings" value={fmt(d.total_savings_kes)} delta={``} />
        <MetricCard label="Active loans" value={d.active_loans_count.toLocaleString()} delta={`${fmt(d.active_loans_kes)} outstanding`} deltaColor="text-amber-600" />
        <MetricCard label="Default rate" value={`${d.default_rate_pct}%`} delta={``} deltaColor="text-red-700" />
      </div>

      {/* Pending actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3">Pending actions</div>
          {pendingActions.map((a, i) => (
            <div key={i} className={`${a.bg} rounded-lg px-3 py-2 mb-2 text-sm ${a.textColor} ${a.borderColor} border-l-4`}>
              {a.text}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3">Portfolio health</div>
          {portfolioHealth.map((row, i) => (
            <div key={i} className="mb-2.5">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-ink-muted">{row.label}</span>
                <span className={`text-xs font-semibold ${row.textColor}`}>{row.value}</span>
              </div>
              <div className="h-1.5 bg-[#e5ede9] rounded-[3px] overflow-hidden">
                <div className={`h-full rounded-[3px] ${row.barColor}`} style={{ width: row.width }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
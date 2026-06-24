import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllSaccos } from '../../hooks/usePlatformData'

const HEALTH_COLORS: Record<string, { dot: string; label: string; color: string }> = {
  healthy:  { dot: 'bg-mint-700', label: 'Healthy',  color: 'text-mint-700' },
  warning:  { dot: 'bg-amber-500', label: 'Warning',   color: 'text-amber-700' },
  critical: { dot: 'bg-red-500', label: 'Critical',  color: 'text-red-800' },
}

const FEE_COLORS: Record<string, { bg: string; color: string }> = {
  paid:    { bg: 'bg-mint-50', color: 'text-mint-700' },
  pending: { bg: 'bg-amber-50', color: 'text-amber-700' },
  overdue: { bg: 'bg-red-50', color: 'text-red-800' },
}

export function SaccosList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('all')
  const [status, setStatus] = useState('all')
  const { data, isLoading } = useAllSaccos({
    search: search || undefined,
    sector: sector === 'all' ? undefined : sector,
    status: status === 'all' ? undefined : status,
  })

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">SACCO directory</div>
          <div className="text-xs text-ink-muted">{data?.count ?? 0} SACCOs on platform</div>
        </div>
        <div className="flex gap-2">
          <button className="py-1.5 px-3.5 rounded-lg border border-mid bg-surface text-[13px] cursor-pointer hover:bg-surface-2 transition-colors">Export CSV</button>
          <button className="py-1.5 px-3.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[13px] font-semibold cursor-pointer transition-colors">+ Onboard SACCO</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <input className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search SACCO name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface" value={sector} onChange={e => setSector(e.target.value)}>
          <option value="all">All sectors</option>
          <option value="Energy">Energy</option>
          <option value="Education">Education</option>
          <option value="Community">Community</option>
          <option value="Government">Government</option>
        </select>
        <select className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['SACCO', 'SASRA Reg', 'Members', 'Txn vol (MTD)', 'Platform fee', 'Fee status', 'API', 'Health', ''].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}><td colSpan={9} className="p-4"><div className="h-5 bg-surface-2 rounded" /></td></tr>
              ))
            ) : (
              (data?.results ?? []).map((s, ri) => {
                const hc = HEALTH_COLORS[s.health] ?? HEALTH_COLORS.healthy
                const fc = FEE_COLORS[s.fee_status] ?? FEE_COLORS.paid
                return (
                  <tr key={s.id} className={`border-b border-surface-2 ${ri % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} cursor-pointer hover:bg-violet-50/50 transition-colors`}
                    onClick={() => navigate(`/saccos/${s.id}`)}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: s.color }}>
                          {s.initials}
                        </div>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[10px] text-ink-faint">{s.sector} · Since {new Date(s.joined_platform_at).getFullYear()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-ink-muted font-mono">{s.sasra_reg_no}</td>
                    <td className="py-2.5 px-3">
                      <div>{s.member_count.toLocaleString()}</div>
                      <div className="text-[10px] text-ink-faint">{s.members_on_app.toLocaleString()} on app</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      KES {(s.transaction_volume_mtd_kes / 1e6).toFixed(1)}M
                    </td>
                    <td className="py-2.5 px-3">KES {s.platform_fee_kes.toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`${fc.bg} ${fc.color} py-0.5 px-2 rounded-full text-[11px] font-semibold`}>
                        {s.fee_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-semibold ${s.api_connected ? 'text-mint-700' : 'text-red-800'}`}>
                        {s.api_connected ? '● Connected' : '● Disconnected'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${hc.dot}`} />
                        <span className={`text-xs ${hc.color}`}>{hc.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-violet-500 font-medium text-xs">View →</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllSaccos } from '../../hooks/usePlatformData'

const HEALTH_COLORS: Record<string, { dot: string; label: string; color: string }> = {
  GOOD:     { dot: 'bg-mint-700', label: 'Healthy',  color: 'text-mint-700' },
  REVIEW:   { dot: 'bg-amber-500', label: 'Review',   color: 'text-amber-700' },
  API_ISSUE: { dot: 'bg-red-500', label: 'Critical',  color: 'text-red-800' },
}

export function SaccosList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const { data, isLoading } = useAllSaccos({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
  })

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">SACCO directory</div>
          <div className="text-xs text-ink-muted">{data?.count ?? 0} SACCOs on platform</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <input className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search SACCO name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['SACCO', 'Members', 'Status', 'Health', 'Last transaction', ''].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="h-5 bg-surface-2 rounded" /></td></tr>
              ))
            ) : (
              (data?.results ?? []).map((s: any, ri: number) => {
                const hc = HEALTH_COLORS[s.health_status] ?? HEALTH_COLORS.GOOD
                return (
                  <tr key={s.id} className={`border-b border-surface-2 ${ri % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} cursor-pointer hover:bg-violet-50/50 transition-colors`}
                    onClick={() => navigate(`/saccos/${s.id}`)}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 bg-violet-500">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-[10px] text-ink-faint">Since {new Date(s.created_at).getFullYear()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{s.member_count.toLocaleString()}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`py-0.5 px-2 rounded-full text-[11px] font-semibold ${s.is_active ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${hc.dot}`} />
                        <span className={`text-xs ${hc.color}`}>{hc.label}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-ink-muted">
                      {s.last_transaction_at ? new Date(s.last_transaction_at).toLocaleDateString() : '—'}
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

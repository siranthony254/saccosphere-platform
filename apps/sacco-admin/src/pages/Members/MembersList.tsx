import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers } from '../../hooks/useMembers'

const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: 'bg-mint-50', color: 'text-mint-700' },
  under_review: { bg: 'bg-blue-50', color: 'text-blue-700' },
  applied: { bg: 'bg-amber-50', color: 'text-amber-700' },
  suspended: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function MembersList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const { data, isLoading } = useMembers({ search: search || undefined, status: status === 'all' ? undefined : status })

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Member directory</div>
          <div className="text-xs text-ink-muted">{data?.count ?? 0} total · 38 new this month</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors">Export CSV</button>
          <button className="px-3.5 py-1.5 rounded-lg border border-mint-600 bg-mint-600 text-white text-sm cursor-pointer hover:bg-mint-700 transition-colors">+ Add member</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <input
          className="flex-1 px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Search name, member ID, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under review</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-[#e5ede9]">
              {['Member', 'Member No.', 'Savings (KES)', 'Active loans', 'Monthly contrib.', 'KYC', 'Status', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[11px] text-ink-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1,2,3].map(i => (
                <tr key={i}><td colSpan={8} className="p-5"><div className="h-5 bg-ink-faint rounded-[4px]" /></td></tr>
              ))
            ) : (
              (data?.results ?? []).map((m, ri) => {
                const sc = statusColors[m.membership_status] ?? statusColors.active
                return (
                  <tr key={m.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3 cursor-pointer hover:bg-violet-50/30 transition-colors`}
                    onClick={() => navigate(`/members/${m.id}`)}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-mint-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        {m.first_name} {m.last_name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted font-mono">{m.member_number}</td>
                    <td className="px-3 py-2.5">{(m.bosa_balance + m.fosa_balance).toLocaleString()}</td>
                    <td className="px-3 py-2.5">{m.active_loans_count > 0 ? `${m.active_loans_count} · KES ${m.active_loans_kes.toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-2.5">KES {m.monthly_contribution.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className={`${m.kyc_status === 'verified' ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                        {m.kyc_status === 'verified' ? '✓ Verified' : m.kyc_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`${sc.bg} ${sc.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                        {m.membership_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-mint-600 font-medium text-xs">View →</td>
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
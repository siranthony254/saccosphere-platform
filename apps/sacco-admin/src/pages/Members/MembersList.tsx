import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers } from '../../hooks/useMembers'
import { useSaccoAdminDashboard } from '../../hooks/useSaccoAdminDashboard'
import type { AdminMember } from '@saccosphere/schemas'


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
  
  // Use dashboard hook for robust count (dashboard architecture)
  const { data: dashboardData, isLoading: isDashboardLoading } = useSaccoAdminDashboard()
  
  const { data, isLoading, error } = useMembers({ search: search || undefined, status: status === 'all' ? undefined : status })

  const handleExportCSV = () => {
    if (!data?.results || data.results.length === 0) {
      alert('No members to export')
      return
    }

    const headers = ['First Name', 'Last Name', 'Member Number', 'Email', 'Phone', 'Savings (KES)', 'Active Loans', 'KYC Status', 'Membership Status']
    const rows = data.results.map(m => [
      m.first_name,
      m.last_name,
      m.member_number,
      m.email,
      m.phone,
      (m.bosa_balance + m.fosa_balance).toString(),
      m.active_loans_count.toString(),
      m.kyc_status,
      m.membership_status,
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `members_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Member directory</div>
          <div className="text-xs text-ink-muted">
            {isDashboardLoading ? 'Loading...' : (dashboardData?.total_members ?? 0)} total members
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-3.5 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors">Export CSV</button>
          <button onClick={() => navigate('/members/add')} className="px-3.5 py-1.5 rounded-lg border border-mint-600 bg-mint-600 text-white text-sm cursor-pointer hover:bg-mint-700 transition-colors">+ Add member</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <div className="flex-1 relative">
          <input
            className="w-full pl-8 pr-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search email, member number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint text-xs">🔍</span>
        </div>
        <select
          className="px-3 py-2 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white cursor-pointer"
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
        {error ? (
          <div className="p-10 text-center">
            <div className="text-red-600 font-medium mb-1">Failed to load members</div>
            <div className="text-xs text-ink-muted">{(error as any)?.message || 'Check your connection or backend alignment.'}</div>
          </div>
        ) : (
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
              ) : (data?.results ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-ink-muted italic">No members found.</td>
                </tr>
              ) : (
                (data?.results ?? []).map((m: AdminMember, ri: number) => {
                  const sc = statusColors[m.membership_status] ?? statusColors.active
                  return (
                    <tr key={m.id} className={`${ri % 2 === 0 ? 'bg-white' : 'bg-surface-2'} border-b border-surface-3 cursor-pointer hover:bg-violet-50/30 transition-colors`}
                      onClick={() => navigate(`/members/${m.id}`)}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-mint-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {(m.first_name?.[0] || 'M')}{(m.last_name?.[0] || '')}
                          </div>
                          {m.first_name} {m.last_name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-ink-muted font-mono">{m.member_number || '—'}</td>
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
        )}
      </div>
    </div>
  )
}
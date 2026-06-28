import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function MembersList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['platform-members', search, status],
    queryFn: () => api.superAdmin.getAllMembers({
      search: search || undefined,
    }),
    enabled: true,
  })

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">All Members</div>
          <div className="text-xs text-ink-muted">Platform-wide member directory</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4">
        <input className="flex-1 py-2 px-3 border border-mid rounded-lg text-[13px] outline-none"
          placeholder="Search member name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="py-2 px-3 border border-mid rounded-lg text-[13px] outline-none bg-surface" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Members table */}
      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-ink-muted">Loading members...</div>
        ) : isError ? (
          <div className="p-6 text-center text-red-600">
            Failed to load members.
            <button onClick={() => refetch()} className="ml-2 text-red-700 underline">Retry</button>
          </div>
        ) : data?.results.length === 0 ? (
          <div className="p-6 text-center text-ink-muted">
            {search || status !== 'all' ? 'No members match your filters.' : 'No members found on the platform.'}
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                {['Member', 'Email', 'SACCO', 'Member Number', 'Status', 'Joined'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.results.map((member, idx) => (
                <tr key={`${member.id}-${idx}`} className="hover:bg-surface-2">
                  <td className="py-2 px-3 border-b border-mid">
                    <div className="font-medium text-ink">{member.first_name} {member.last_name}</div>
                  </td>
                  <td className="py-2 px-3 border-b border-mid text-ink-muted">{member.email}</td>
                  <td className="py-2 px-3 border-b border-mid text-ink-muted">{member.sacco_name}</td>
                  <td className="py-2 px-3 border-b border-mid text-ink-muted">{member.member_number || '—'}</td>
                  <td className="py-2 px-3 border-b border-mid">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      member.status === 'APPROVED' ? 'bg-mint-100 text-mint-700' :
                      member.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      member.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                      'bg-surface-2 text-ink-muted'
                    }`}>
                      {member.status?.toLowerCase() || 'unknown'}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-b border-mid text-ink-muted">
                    {member.joined_date || member.created_at ? new Date(member.joined_date || member.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && data.count > 0 && (
        <div className="text-xs text-ink-muted mt-2 text-right">
          Showing {data.results.length} of {data.count} total members
        </div>
      )}
    </div>
  )
}

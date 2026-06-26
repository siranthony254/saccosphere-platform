import { useState } from 'react'

export function MembersList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

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

      {/* Backend gap notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 border-l-4 border-l-amber-500">
        <div className="font-semibold mb-1">Backend endpoint required</div>
        <div className="text-amber-700">
          To display all platform members, the backend needs to provide a platform-wide members endpoint: 
          <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded ml-1">GET /api/v1/accounts/users/</code>
          <br />
          The current <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded ml-1">/api/v1/management/members/</code> endpoint is SACCO-scoped and requires the X-Sacco-ID header.
        </div>
      </div>

      {/* Placeholder table */}
      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['Member', 'Email', 'SACCO', 'Member Number', 'Status', 'Joined'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="p-6 text-center text-ink-muted">
                No platform-wide member data available. Backend endpoint needs to be implemented.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

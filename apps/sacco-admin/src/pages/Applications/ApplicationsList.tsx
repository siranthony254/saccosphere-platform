import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications } from '../../hooks/useApplications'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applied: { bg: 'bg-amber-50', color: 'text-amber-700' },
  PENDING: { bg: 'bg-amber-50', color: 'text-amber-700' },
  SUBMITTED: { bg: 'bg-amber-50', color: 'text-amber-700' },
  under_review: { bg: 'bg-blue-50', color: 'text-blue-700' },
  UNDER_REVIEW: { bg: 'bg-blue-50', color: 'text-blue-700' },
  active: { bg: 'bg-mint-50', color: 'text-mint-700' },
  APPROVED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  withdrawn: { bg: 'bg-red-50', color: 'text-red-700' },
  REJECTED: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function ApplicationsList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('applied')

  const { data, isLoading } = useApplications({
    status:
      statusFilter === 'all'
        ? undefined
        : statusFilter === 'applied'
          ? 'PENDING'
          : statusFilter.toUpperCase(),
  })

  return (
    <div className="p-5 relative">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Membership applications</div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total applications matching filter
          </div>
        </div>
        <select
          className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="applied">Applied (Pending)</option>
          <option value="under_review">Under review</option>
          <option value="active">Approved</option>
        </select>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-800">
        Applications appear here for reference. Approving or rejecting a member isn’t available from
        this console yet — contact SaccoSphere support to action pending applications.
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-10 text-center text-sm text-amber-800">
          No membership applications found for this filter.
        </div>
      )}

      {isLoading ? (
        [1, 2, 3].map(i => <div key={i} className="h-[80px] bg-ink-faint/10 animate-pulse rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map((app: any) => {
          const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.applied
          return (
            <div key={app.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3 hover:shadow-md transition-shadow">
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                    {(app.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink">{app.full_name || 'Unknown User'}</div>
                    <div className="text-[11px] text-ink-muted">{app.email || app.phone_number || 'No contact info'}</div>
                  </div>
                </div>
                <div className="text-[11px] text-ink-soft bg-surface-2 px-2 py-1 rounded-md border border-surface-3">
                  Applied {new Date(app.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="flex justify-center">
                  <span className={`${sc.bg} ${sc.color} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-current/10 shadow-sm`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold cursor-pointer hover:bg-violet-100 transition-colors"
                    onClick={() => navigate(`/members/${app.user_id}`)}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

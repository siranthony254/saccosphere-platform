import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications, useReviewApplication } from '../../hooks/useApplications'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applied: { bg: 'bg-amber-50', color: 'text-amber-700' },
  under_review: { bg: 'bg-blue-50', color: 'text-blue-700' },
  active: { bg: 'bg-mint-50', color: 'text-mint-700' },
  withdrawn: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function ApplicationsList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('applied')

  const { data, isLoading } = useApplications({ status: statusFilter === 'all' ? undefined : (statusFilter === 'applied' ? 'PENDING' : statusFilter.toUpperCase()) })
  const { mutate: reviewApplication, isPending } = useReviewApplication()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message })
    setTimeout(() => setAlertInfo(null), 3000)
  }

  const handleReview = async (app: any, status: 'APPROVED' | 'REJECTED') => {
    const targetId = app.application_id || app.id
    try {
      await reviewApplication({ id: targetId, status, review_notes: reviewNotes })
      setReviewingId(null)
      setReviewNotes('')
      showAlert('success', `Application ${status.toLowerCase()} successfully`)
    } catch (error: any) {
      console.error('Failed to review application:', error)
      showAlert('error', error?.message || 'Failed to review application. Please try again.')
    }
  }

  return (
    <div className="p-5 relative">
      {alertInfo && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg ${alertInfo.type === 'success' ? 'bg-mint-500 text-white' : 'bg-red-500 text-white'}`}>
          {alertInfo.message}
        </div>
      )}
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
          const isExpanded = reviewingId === app.id

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
                  {(app.status === 'applied' || app.status === 'under_review') && (
                    <button
                      className="px-4 py-1.5 rounded-lg border-none bg-mint-600 text-white text-xs font-bold cursor-pointer hover:bg-mint-700 transition-colors shadow-sm"
                      onClick={() => {
                        setReviewingId(isExpanded ? null : app.id)
                        setReviewNotes('')
                      }}
                    >
                      {isExpanded ? 'Close' : 'Approve →'}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-surface-3">
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3 mb-4">
                    <div className="text-[11px] font-bold text-amber-800 uppercase mb-1">Pending Application Review</div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      You are about to review the membership for <strong>{app.full_name}</strong>.
                      Approving will generate a member number and activate their portfolio.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <textarea
                      className="w-full p-3 border border-ink-faint rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-violet-500 focus:outline-none bg-surface-2 transition-all"
                      placeholder="Add an internal note or message to the member (optional)..."
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button
                        className={`flex-1 py-3 rounded-xl border-none bg-mint-600 text-white text-sm font-bold cursor-pointer hover:bg-mint-700 transition-all shadow-lg active:scale-[0.98] ${isPending ? 'opacity-60' : ''}`}
                        onClick={() => handleReview(app, 'APPROVED')}
                        disabled={isPending}
                      >
                        {isPending ? 'Processing Approval...' : '✓ Confirm Approval'}
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold cursor-pointer hover:bg-red-100 transition-all active:scale-[0.98]"
                        onClick={() => handleReview(app, 'REJECTED')}
                        disabled={isPending}
                      >
                        ✗ Decline Application
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )

        })
      )}
    </div>
  )
}


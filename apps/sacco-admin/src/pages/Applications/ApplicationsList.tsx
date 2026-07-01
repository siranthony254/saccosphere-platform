import { useState } from 'react'
import { useApplications, useReviewApplication } from '../../hooks/useApplications'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'bg-amber-50', color: 'text-amber-700' },
  APPROVED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  REJECTED: { bg: 'bg-red-50', color: 'text-red-700' },
}

export function ApplicationsList() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const { data, isLoading } = useApplications({ status: statusFilter === 'all' ? undefined : statusFilter })
  const { mutate: reviewApplication, isPending } = useReviewApplication()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewApplication({ id, status, review_notes: reviewNotes })
      setReviewingId(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Failed to review application:', error)
      alert('Failed to review application. Check console for details.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Membership applications</div>
          <div className="text-xs text-ink-muted">
            {data?.count ?? 0} total · {data?.results.filter((a: any) => a.status === 'PENDING').length ?? 0} pending review
          </div>
        </div>
        <select
          className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {!isLoading && (data?.results ?? []).length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-10 text-center text-sm text-amber-800">
          No membership applications found.
        </div>
      )}

      {isLoading ? (
        [1, 2, 3].map(i => <div key={i} className="h-[120px] bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (data?.results ?? []).map((app: any) => {
          const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.PENDING
          const isExpanded = reviewingId === app.id

          return (
            <div key={app.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-2.5 items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(app.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{app.full_name || 'Unknown'}</div>
                    <div className="text-[10px] text-ink-faint">{app.email || app.phone_number || '—'}</div>
                  </div>
                </div>
                <div className="text-sm">{app.employer_name || '—'}</div>
                <div className="text-sm font-semibold">KES {app.monthly_income?.toLocaleString() || '0'}</div>
                <div>
                  <span className={`${sc.bg} ${sc.color} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
                    {app.status}
                  </span>
                </div>
                <div>
                  {app.status === 'PENDING' ? (
                    <button
                      className="px-3 py-1 rounded-[6px] border-none bg-mint-600 text-white text-xs font-semibold cursor-pointer hover:bg-mint-700 transition-colors"
                      onClick={() => {
                        setReviewingId(isExpanded ? null : app.id)
                        setReviewNotes('')
                      }}
                    >
                      {isExpanded ? 'Close' : 'Review'}
                    </button>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-surface-3 pt-3.5">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <div className="font-semibold text-xs text-ink-soft mb-2 uppercase tracking-wider">Application details</div>
                      {[
                        { l: 'National ID', v: app.national_id || '—' },
                        { l: 'Employment status', v: app.employment_status || '—' },
                        { l: 'Employer', v: app.employer_name || '—' },
                        { l: 'Monthly income', v: `KES ${app.monthly_income?.toLocaleString() || '0'}` },
                        { l: 'Submitted', v: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '—' },
                      ].map(row => (
                        <div key={row.l} className="flex justify-between py-1 border-b border-ink-faint text-xs last:border-0">
                          <span className="text-ink-muted">{row.l}</span>
                          <span className="font-medium text-ink">{row.v}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <textarea
                        className="w-full p-2.5 border border-ink-faint rounded-lg text-sm resize-y min-h-[80px] box-border mb-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Review notes (optional)..."
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors ${isPending ? 'opacity-60' : ''}`}
                          onClick={() => handleReview(app.id, 'APPROVED')}
                          disabled={isPending}
                        >
                          {isPending ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          className="flex-1 py-2 rounded-lg border-none bg-red-50 text-red-700 text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                          onClick={() => handleReview(app.id, 'REJECTED')}
                          disabled={isPending}
                        >
                          ✗ Reject
                        </button>
                      </div>
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

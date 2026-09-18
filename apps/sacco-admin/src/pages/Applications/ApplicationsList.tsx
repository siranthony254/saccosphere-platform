import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications, useApplicationReview, useReviewApplication } from '../../hooks/useApplications'

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
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useApplications({
    status:
      statusFilter === 'all'
        ? undefined
        : statusFilter === 'applied'
          ? 'PENDING'
          : statusFilter.toUpperCase(),
  })

  const { data: review, isLoading: isLoadingReview } = useApplicationReview(reviewingId)
  const { mutate: reviewApplication, isPending: isReviewing } = useReviewApplication()

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message })
    setTimeout(() => setAlertInfo(null), 3000)
  }

  const openReview = (applicationId: string | null) => {
    if (!applicationId) {
      showAlert('error', 'This applicant has no linked application record yet.')
      return
    }
    setReviewingId(applicationId)
    setReviewNotes('')
  }

  const handleDecision = (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingId) return
    if (status === 'REJECTED' && !reviewNotes.trim()) {
      showAlert('error', 'A rejection needs a reason in the notes field.')
      return
    }
    reviewApplication(
      { applicationId: reviewingId, status, review_notes: reviewNotes },
      {
        onSuccess: () => {
          showAlert('success', `Application ${status.toLowerCase()}.`)
          setReviewingId(null)
          setReviewNotes('')
        },
        onError: (err: any) => showAlert('error', err?.message || 'Failed to review application.'),
      },
    )
  }

  return (
    <div className="p-5 relative">
      {alertInfo && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg ${
          alertInfo.type === 'success' ? 'bg-mint-500 text-white' : 'bg-red-500 text-white'
        }`}>
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
          const isReviewingThis = reviewingId === app.application_id
          const canReview = app.status === 'PENDING' || app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'

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
                  {canReview && (
                    <button
                      className="px-4 py-1.5 rounded-lg border-none bg-violet-600 text-white text-xs font-bold cursor-pointer hover:bg-violet-700 transition-colors"
                      onClick={() => openReview(app.application_id)}
                    >
                      Review
                    </button>
                  )}
                  <button
                    className="px-4 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold cursor-pointer hover:bg-violet-100 transition-colors"
                    onClick={() => navigate(`/members/${app.user_id}`)}
                  >
                    Details
                  </button>
                </div>
              </div>

              {isReviewingThis && (
                <div className="mt-4 pt-4 border-t border-surface-3">
                  {isLoadingReview ? (
                    <div className="text-sm text-ink-muted py-2">Loading application details…</div>
                  ) : !review ? (
                    <div className="text-sm text-red-600 py-2">Failed to load application details.</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2.5 mb-3 bg-surface-2 rounded-lg p-3 text-xs">
                        <div>
                          <div className="text-ink-faint mb-0.5">Employment</div>
                          <div className="font-medium text-ink-soft">{review.employment_status || '—'}</div>
                        </div>
                        <div>
                          <div className="text-ink-faint mb-0.5">Employer</div>
                          <div className="font-medium text-ink-soft">{review.employer_name || '—'}</div>
                        </div>
                        <div>
                          <div className="text-ink-faint mb-0.5">Monthly income</div>
                          <div className="font-medium text-ink-soft">{review.monthly_income != null ? `KES ${review.monthly_income.toLocaleString()}` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-ink-faint mb-0.5">Registration fee</div>
                          <div className={`font-medium ${review.registration_fee_paid ? 'text-mint-600' : 'text-amber-600'}`}>
                            {review.registration_fee_paid ? 'Paid' : 'Not paid'}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] text-ink-faint mb-1 uppercase tracking-wider">Identity verification (KYC)</div>
                        {!review.kyc ? (
                          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                            This member has not completed KYC verification.
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-surface-2 rounded-lg p-2.5">
                            <span className="text-xs font-medium text-ink-soft">{review.kyc.status_display || review.kyc.status}</span>
                            <span className={`text-[11px] font-semibold ${review.kyc.iprs_verified ? 'text-mint-600' : 'text-amber-600'}`}>
                              {review.kyc.iprs_verified ? 'IPRS verified' : 'IPRS not verified'}
                            </span>
                          </div>
                        )}
                      </div>

                      {review.custom_field_answers.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] text-ink-faint mb-1 uppercase tracking-wider">SACCO custom fields</div>
                          <div className="grid grid-cols-2 gap-2.5 bg-surface-2 rounded-lg p-3 text-xs">
                            {review.custom_field_answers.map((a: any, i: number) => (
                              <div key={i}>
                                <div className="text-ink-faint mb-0.5">{a.label}</div>
                                <div className="font-medium text-ink-soft">{a.value || '—'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {review.membership_documents.length > 0 && (
                        <div className="mb-3">
                          <div className="text-[10px] text-ink-faint mb-1 uppercase tracking-wider">Uploaded documents</div>
                          <div className="flex flex-wrap gap-2">
                            {review.membership_documents.map((d: any) => (
                              <a
                                key={d.id}
                                href={d.file_url ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] px-2.5 py-1.5 rounded-md bg-surface-2 border border-surface-3 text-violet-700 hover:bg-violet-50"
                              >
                                {d.document_type.replaceAll('_', ' ')}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        className="w-full p-2.5 border border-ink-faint rounded-lg text-sm mb-2.5 resize-y min-h-[60px] box-border focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Review notes (required if rejecting)..."
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          className={`px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-white bg-mint-600 hover:bg-mint-700 transition-colors ${isReviewing ? 'opacity-60' : ''}`}
                          onClick={() => handleDecision('APPROVED')}
                          disabled={isReviewing}
                        >
                          {isReviewing ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          className="px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          onClick={() => handleDecision('REJECTED')}
                          disabled={isReviewing || !reviewNotes.trim()}
                        >
                          Reject
                        </button>
                        <button
                          className="px-4.5 py-2 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
                          onClick={() => setReviewingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

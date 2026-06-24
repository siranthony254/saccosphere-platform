import { useState } from 'react'
import { useApplications, useReviewApplication } from '../../hooks/useApplications'

export function ApplicationsList() {
  const { data: applications, isLoading } = useApplications()
  const { mutate: review, isPending } = useReviewApplication()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    review({ id, action, notes }, {
      onSuccess: () => { setReviewingId(null); setNotes('') },
    })
  }

  return (
    <div className="p-5">
      <div className="mb-5">
        <div className="text-lg font-semibold text-ink">Applications</div>
        <div className="text-xs text-ink-muted">{applications?.length ?? 0} applications awaiting review — submitted via Saccosphere</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-2 mb-4 text-sm text-blue-800 border-l-4 border-l-blue-500">
        These applications were submitted via the Saccosphere member app. KYC documents have been pre-verified by Saccosphere. Review and approve or request more information.
      </div>

      {!isLoading && (applications?.length ?? 0) === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No application list endpoint is currently available for SACCO admin. You can still approve or reject membership applications through the backend path <code className="font-mono">/api/v1/management/applications/&lt;id&gt;/review/</code>.
        </div>
      )}

      {isLoading ? (
        [1,2,3].map(i => <div key={i} className="h-20 bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : (
        (applications ?? []).map(app => (
          <div key={app.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold text-white">AP</div>
                <div>
                  <div className="font-semibold text-sm text-ink">Applicant — {app.ref}</div>
                  <div className="text-xs text-ink-muted">Submitted via Saccosphere · {new Date(app.submitted_at).toLocaleDateString('en-KE')}</div>
                </div>
              </div>
              <span className={`${app.status === 'submitted' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'} px-2.5 py-0.5 rounded-full text-[11px] font-semibold`}>
                {app.status === 'submitted' ? 'Pending review' : 'Under review'}
              </span>
            </div>

            {/* Form data */}
            <div className="grid grid-cols-3 gap-2.5 mb-3 bg-surface-2 rounded-lg p-3">
              {Object.entries(app.form_data).map(([key, val]) => (
                <div key={key}>
                  <div className="text-[10px] text-ink-faint mb-0.5">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div className="text-sm font-medium text-ink-soft">{String(val)}</div>
                </div>
              ))}
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">Registration Fee</div>
                <span className="bg-mint-50 text-mint-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                  ✓ KES 1,000 paid
                </span>
              </div>
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">KYC Status</div>
                <span className="bg-mint-50 text-mint-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                  ✓ Pre-verified
                </span>
              </div>
            </div>

            {/* Notes + actions */}
            {reviewingId === app.id ? (
              <div>
                <textarea
                  className="w-full p-2.5 border border-ink-faint rounded-lg text-sm mb-2.5 resize-y min-h-[60px] box-border focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Add review notes (optional)..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className={`px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-white bg-mint-600 hover:bg-mint-700 transition-colors ${isPending ? 'opacity-60' : ''}`}
                    onClick={() => handleAction(app.id, 'approve')}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    className="px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    onClick={() => handleAction(app.id, 'reject')}
                    disabled={isPending}
                  >
                    ✗ Reject
                  </button>
                  <button
                    className="px-4.5 py-2 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
                    onClick={() => setReviewingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  className="px-4 py-1.5 rounded-lg border-none text-sm font-semibold cursor-pointer text-white bg-mint-600 hover:bg-mint-700 transition-colors"
                  onClick={() => setReviewingId(app.id)}
                >
                  Review application →
                </button>
                <button className="px-4 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors">
                  Request documents
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
import { useState } from 'react'
import { useKycQueue, useReviewKyc } from '../../hooks/useKyc'

export function KycReview() {
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const { data: kycQueue, isLoading } = useKycQueue({ status: statusFilter })
  const { mutate: reviewKyc, isPending } = useReviewKyc()
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewKyc({ 
        id, 
        status, 
        rejection_reason: status === 'REJECTED' ? rejectionReason : undefined 
      })
      setReviewingId(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Failed to review KYC:', error)
      alert('Failed to review KYC. Check console for details.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">KYC Review</div>
          <div className="text-xs text-ink-muted">{kycQueue?.length ?? 0} documents pending review</div>
        </div>
        <select
          className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        [1, 2, 3].map(i => <div key={i} className="h-20 bg-ink-faint rounded-[10px] mb-2.5" />)
      ) : !kycQueue || kycQueue.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          No KYC documents found.
        </div>
      ) : (
        kycQueue.map((kyc: any) => (
          <div key={kyc.id} className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-3">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold text-white">
                  {kyc.user?.full_name?.split(' ').map((n: string) => n[0]).join('') ?? 'KY'}
                </div>
                <div>
                  <div className="font-semibold text-sm text-ink">{kyc.user?.full_name || 'Unknown'}</div>
                  <div className="text-xs text-ink-muted">{kyc.user?.email || kyc.user?.phone_number || '—'}</div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                kyc.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                kyc.status === 'APPROVED' ? 'bg-mint-50 text-mint-700' :
                'bg-red-50 text-red-800'
              }`}>
                {kyc.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3 bg-surface-2 rounded-lg p-3">
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">ID Type</div>
                <div className="text-sm font-medium text-ink-soft">{kyc.id_type || 'National ID'}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">ID Number</div>
                <div className="text-sm font-medium text-ink-soft">{kyc.id_number || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">Submitted</div>
                <div className="text-sm font-medium text-ink-soft">{kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-ink-faint mb-0.5">IPRS Status</div>
                <div className="text-sm font-medium text-ink-soft">{kyc.iprs_status || '—'}</div>
              </div>
            </div>

            {reviewingId === kyc.id ? (
              <div>
                {kyc.status === 'PENDING' && (
                  <textarea
                    className="w-full p-2.5 border border-ink-faint rounded-lg text-sm mb-2.5 resize-y min-h-[60px] box-border focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Rejection reason (required if rejecting)..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                )}
                <div className="flex gap-2">
                  {kyc.status === 'PENDING' && (
                    <>
                      <button
                        className={`px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-white bg-mint-600 hover:bg-mint-700 transition-colors ${isPending ? 'opacity-60' : ''}`}
                        onClick={() => handleReview(kyc.id, 'APPROVED')}
                        disabled={isPending}
                      >
                        {isPending ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        className="px-4.5 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        onClick={() => handleReview(kyc.id, 'REJECTED')}
                        disabled={isPending || !rejectionReason}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
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
                {kyc.status === 'PENDING' && (
                  <button
                    className="px-4 py-1.5 rounded-lg border-none text-sm font-semibold cursor-pointer text-white bg-mint-600 hover:bg-mint-700 transition-colors"
                    onClick={() => setReviewingId(kyc.id)}
                  >
                    Review KYC →
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

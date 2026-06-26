import { useKycQueue } from '../../hooks/usePlatformData'
import { api } from '@saccosphere/api-client'

export function KycReview() {
  const { data: kycQueue, isLoading, refetch } = useKycQueue()

  const handleReview = async (kycId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    try {
      await api.saccoAdmin.reviewKyc(kycId, { status, rejection_reason: rejectionReason })
      refetch()
    } catch (error) {
      console.error('Failed to review KYC:', error)
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">KYC Review Queue</div>
          <div className="text-xs text-ink-muted">Pending KYC verifications requiring admin review</div>
        </div>
      </div>

      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['Member', 'Email', 'ID Number', 'Submitted', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-muted">Loading KYC queue...</td>
              </tr>
            ) : !kycQueue || kycQueue.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-muted">No pending KYC reviews.</td>
              </tr>
            ) : (
              kycQueue.map((kyc: any) => (
                <tr key={kyc.id} className="border-b border-surface-2">
                  <td className="py-2.5 px-3 font-medium">
                    {kyc.user?.first_name} {kyc.user?.last_name}
                  </td>
                  <td className="py-2.5 px-3 text-ink-muted">{kyc.user?.email}</td>
                  <td className="py-2.5 px-3 text-ink-muted font-mono text-xs">{kyc.id_number || '—'}</td>
                  <td className="py-2.5 px-3 text-ink-muted text-xs">
                    {kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      kyc.status === 'APPROVED' ? 'bg-mint-50 text-mint-700' :
                      kyc.status === 'REJECTED' ? 'bg-red-50 text-red-800' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {kyc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {kyc.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(kyc.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-mint-50 text-mint-700 hover:bg-mint-100"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason (optional):')
                            if (reason !== null) handleReview(kyc.id, 'REJECTED', reason)
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

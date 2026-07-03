import { useState } from 'react'
import { useKycQueue } from '../../hooks/usePlatformData'
import { api } from '@saccosphere/api-client'
import { Badge } from '../../components/ui/Badge'

export function KycReview() {
  const { data: kycQueue, isLoading, refetch } = useKycQueue()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleReview = async (kycId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    try {
      await api.saccoAdmin.reviewKyc(kycId, { status, rejection_reason: rejectionReason })
      refetch()
      setSelectedId(null)
    } catch (error) {
      console.error('Failed to review KYC:', error)
      alert('Review failed. Ensure rejection reason is provided if rejecting.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">KYC Verification Queue</div>
          <div className="text-xs text-ink-muted">Platform-wide identity review (Super Admin)</div>
        </div>
      </div>

      <div className="bg-surface border border-mid rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-2">
              {['Member', 'IPRS', 'Docs', 'Submitted', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-[11px] text-ink-muted font-medium border-b border-mid uppercase tracking-tighter">{h}</th>
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
              kycQueue.map((kyc: any) => {
                const isExpanded = selectedId === kyc.id
                return (
                  <tr key={kyc.id} className={`border-b border-surface-2 ${isExpanded ? 'bg-violet-25' : ''}`}>
                    <td className="py-3 px-3">
                      <div className="font-medium text-xs text-ink">
                        {kyc.user?.full_name || `${kyc.user?.first_name} ${kyc.user?.last_name}`}
                      </div>
                      <div className="text-[10px] text-ink-faint">{kyc.user?.email}</div>
                    </td>
                    <td className="py-3 px-3">
                       <Badge variant={kyc.iprs_verified ? 'success' : 'warning'}>
                         {kyc.iprs_verified ? 'IPRS Verified' : 'Unverified'}
                       </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        {kyc.id_front && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded">Front</span>}
                        {kyc.id_back && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded">Back</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-ink-muted text-xs font-mono">
                      {kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        kyc.status === 'APPROVED' ? 'bg-mint-50 text-mint-700' :
                        kyc.status === 'REJECTED' ? 'bg-red-50 text-red-800' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {kyc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {kyc.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedId(isExpanded ? null : kyc.id)}
                          className="px-3 py-1 rounded text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
                        >
                          {isExpanded ? 'Cancel' : 'Review →'}
                        </button>
                      )}
                      {isExpanded && (
                        <div className="fixed inset-0 bg-navy-950/20 z-40 flex items-center justify-center p-10" onClick={() => setSelectedId(null)}>
                           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                              <div className="p-6 border-b border-surface-3 flex justify-between items-center">
                                 <div>
                                   <h3 className="text-lg font-bold text-ink">Identity Verification</h3>
                                   <p className="text-xs text-ink-muted">{kyc.user?.full_name} · {kyc.user?.email}</p>
                                 </div>
                                 <button onClick={() => setSelectedId(null)} className="text-ink-faint hover:text-ink">✕</button>
                              </div>
                              <div className="p-6">
                                 <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold uppercase text-ink-muted">National ID Front</label>
                                       {kyc.id_front ? (
                                         <img src={kyc.id_front} className="w-full rounded-xl border border-surface-3 shadow-sm bg-surface-2" alt="ID Front" />
                                       ) : <div className="h-48 bg-surface-2 rounded-xl flex items-center justify-center text-xs text-ink-faint">No front image</div>}
                                    </div>
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold uppercase text-ink-muted">National ID Back</label>
                                       {kyc.id_back ? (
                                         <img src={kyc.id_back} className="w-full rounded-xl border border-surface-3 shadow-sm bg-surface-2" alt="ID Back" />
                                       ) : <div className="h-48 bg-surface-2 rounded-xl flex items-center justify-center text-xs text-ink-faint">No back image</div>}
                                    </div>
                                 </div>

                                 <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 mb-8 grid grid-cols-3 gap-4">
                                    <div>
                                       <div className="text-[10px] text-ink-faint uppercase font-bold mb-1">ID Number</div>
                                       <div className="text-sm font-bold text-ink-soft">{kyc.id_number || '—'}</div>
                                    </div>
                                    <div>
                                       <div className="text-[10px] text-ink-faint uppercase font-bold mb-1">IPRS Verification</div>
                                       <div className={`text-sm font-bold ${kyc.iprs_verified ? 'text-mint-600' : 'text-amber-600'}`}>
                                          {kyc.iprs_verified ? '✓ PASSED' : '✗ NOT VERIFIED'}
                                       </div>
                                    </div>
                                    <div>
                                       <div className="text-[10px] text-ink-faint uppercase font-bold mb-1">Reference</div>
                                       <div className="text-xs font-mono text-ink-faint">{kyc.iprs_reference || '—'}</div>
                                    </div>
                                 </div>

                                 <div className="flex gap-4">
                                    <button
                                      className="flex-1 py-3 bg-mint-600 text-white rounded-xl font-bold shadow-lg hover:bg-mint-700 active:scale-95 transition-all"
                                      onClick={() => handleReview(kyc.id, 'APPROVED')}
                                    >
                                      ✓ Approve Verification
                                    </button>
                                    <button
                                      className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 active:scale-95 transition-all"
                                      onClick={() => {
                                        const reason = prompt('Rejection reason:')
                                        if (reason) handleReview(kyc.id, 'REJECTED', reason)
                                      }}
                                    >
                                      ✗ Reject Identity
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


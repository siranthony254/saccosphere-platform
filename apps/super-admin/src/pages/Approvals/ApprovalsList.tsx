import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export function ApprovalsList() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'support' | 'erasure'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Data erasure form state
  const [selectedErasureId, setSelectedErasureId] = useState<string | null>(null)
  const [erasureAction, setErasureAction] = useState<'approve' | 'reject' | 'hold'>('approve')
  const [erasureReason, setErasureReason] = useState('')
  const [erasureStatus, setErasureStatus] = useState<string | null>(null)

  // Support Access Grant form
  const { data: saccosData } = useQuery({
    queryKey: ['superadmin-saccos'],
    queryFn: () => api.superAdmin.getSaccos(),
  })
  const saccos = saccosData?.results ?? []

  const [selectedSaccoId, setSelectedSaccoId] = useState('')
  const [grantReason, setGrantReason] = useState('')
  const [grantHours, setGrantHours] = useState('24')
  const [grantStatus, setGrantStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Queries
  const { data: pendingApprovals = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => api.approvals.getPending(),
    staleTime: 10_000,
  })

  const { data: historyApprovals = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['approvals-history'],
    queryFn: () => api.approvals.getHistory(),
    staleTime: 30_000,
  })

  const { data: supportGrants = [], isLoading: isGrantsLoading } = useQuery({
    queryKey: ['support-access-grants'],
    queryFn: () => api.approvals.getSupportAccessGrants(),
    staleTime: 30_000,
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => api.approvals.approve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] })
      queryClient.invalidateQueries({ queryKey: ['approvals-history'] })
      setSelectedRequest(null)
      setReviewNotes('')
    },
    onError: (err: any) => setReviewError(err?.message || 'Failed to approve request.'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.approvals.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] })
      queryClient.invalidateQueries({ queryKey: ['approvals-history'] })
      setSelectedRequest(null)
      setReviewNotes('')
    },
    onError: (err: any) => setReviewError(err?.message || 'Failed to reject request.'),
  })

  const createGrantMutation = useMutation({
    mutationFn: (data: { sacco_id: string; reason: string; expires_at?: string }) =>
      api.approvals.createSupportAccessGrant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-access-grants'] })
      setGrantStatus({ type: 'success', message: 'Support access grant created successfully.' })
      setGrantReason('')
      setSelectedSaccoId('')
      setTimeout(() => setGrantStatus(null), 4000)
    },
    onError: (err: any) =>
      setGrantStatus({ type: 'error', message: err?.message || 'Failed to create support grant.' }),
  })

  const revokeGrantMutation = useMutation({
    mutationFn: (id: string) => api.approvals.revokeSupportAccessGrant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-access-grants'] })
    },
  })

  const reviewErasureMutation = useMutation({
    mutationFn: (data: { requestId: string; action: 'approve' | 'reject' | 'hold'; reason?: string }) =>
      api.account.reviewDataErasure(data.requestId, { action: data.action, reason: data.reason }),
    onSuccess: () => {
      setErasureStatus('Data erasure request review submitted successfully.')
      setSelectedErasureId(null)
      setErasureReason('')
      setTimeout(() => setErasureStatus(null), 4000)
    },
    onError: (err: any) => setErasureStatus(err?.message || 'Failed to submit erasure review.'),
  })

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSaccoId || !grantReason) return
    const expiresAt = new Date(Date.now() + Number(grantHours) * 3600 * 1000).toISOString()
    createGrantMutation.mutate({
      sacco_id: selectedSaccoId,
      reason: grantReason,
      expires_at: expiresAt,
    })
  }

  const handleReviewErasure = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedErasureId) return
    reviewErasureMutation.mutate({
      requestId: selectedErasureId,
      action: erasureAction,
      reason: erasureReason,
    })
  }

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Governance, Approvals & Support Access"
        subtitle="Maker-checker authorization queue, support access controls, and ODPC data erasure reviews"
      />

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingApprovals.length > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Approval History
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'support'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Support Access Grants
        </button>
        <button
          onClick={() => setActiveTab('erasure')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'erasure'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Data Erasure Reviews (ODPC)
        </button>
      </div>

      {/* TAB 1: PENDING */}
      {activeTab === 'pending' && (
        <Card title="Pending Approvals Queue">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase bg-surface-2">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Requested At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isPendingLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted text-xs">
                      Loading pending approvals...
                    </td>
                  </tr>
                ) : pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted text-xs">
                      No pending approvals in queue.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((req: any) => (
                    <tr key={req.id} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-semibold text-xs text-violet-700">{req.action}</td>
                      <td className="py-2.5 px-3 text-xs text-ink">{req.requester || '—'}</td>
                      <td className="py-2.5 px-3 text-xs font-bold text-ink">
                        {req.amount != null ? `KES ${Number(req.amount).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-ink max-w-xs truncate">{req.reason || '—'}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRequest(req)
                            setReviewError(null)
                            setReviewNotes('')
                          }}
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === 'history' && (
        <Card title="Approval Audit Trail">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase bg-surface-2">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Requester</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Decided By</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3">Decided At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isHistoryLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted text-xs">Loading history...</td>
                  </tr>
                ) : historyApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted text-xs">No approval history found.</td>
                  </tr>
                ) : (
                  historyApprovals.map((req: any) => (
                    <tr key={req.id} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-semibold text-xs text-ink">{req.action}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">{req.requester || '—'}</td>
                      <td className="py-2.5 px-3 text-xs font-bold">
                        <Badge variant={req.status === 'APPROVED' ? 'success' : 'error'}>{req.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-ink">{req.decided_by || '—'}</td>
                      <td className="py-2.5 px-3 text-xs text-ink max-w-xs truncate">{req.decision_notes || req.reason || '—'}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted">
                        {req.decided_at ? new Date(req.decided_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SUPPORT ACCESS GRANTS */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card title="Grant Support Access" className="md:col-span-1">
            <div className="text-xs text-ink-muted mb-3">
              Issue time-boxed temporary support access to a SACCO context for debugging and customer issue resolution.
            </div>

            {grantStatus && (
              <div
                className={`p-2.5 rounded text-xs mb-3 font-semibold ${
                  grantStatus.type === 'success' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {grantStatus.message}
              </div>
            )}

            <form onSubmit={handleCreateGrant} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Select Target SACCO</label>
                <select
                  value={selectedSaccoId}
                  onChange={(e) => setSelectedSaccoId(e.target.value)}
                  className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  required
                >
                  <option value="">Select a SACCO...</option>
                  {saccos.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Duration (Hours)</label>
                <select
                  value={grantHours}
                  onChange={(e) => setGrantHours(e.target.value)}
                  className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                >
                  <option value="4">4 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="48">48 Hours (2 Days)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Reason / Ticket Reference</label>
                <textarea
                  rows={3}
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="e.g. Debugging M-Pesa B2C callback failure for ticket #8812"
                  className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createGrantMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
              >
                {createGrantMutation.isPending ? 'Granting...' : 'Grant Temporary Access'}
              </button>
            </form>
          </Card>

          <Card title="Active Support Grants" className="md:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Target SACCO</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Expires At</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isGrantsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">Loading grants...</td>
                    </tr>
                  ) : supportGrants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">No active support grants.</td>
                    </tr>
                  ) : (
                    supportGrants.map((grant: any) => (
                      <tr key={grant.id} className="hover:bg-surface-1">
                        <td className="py-2 px-3 font-semibold text-ink">{grant.sacco_name || grant.sacco || '—'}</td>
                        <td className="py-2 px-3 text-ink-muted">{grant.reason || 'Support'}</td>
                        <td className="py-2 px-3 font-semibold text-amber-700">
                          {grant.expires_at ? new Date(grant.expires_at).toLocaleString() : '—'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => revokeGrantMutation.mutate(grant.id)}
                            disabled={revokeGrantMutation.isPending}
                            className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-200 hover:bg-red-100 cursor-pointer"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: DATA ERASURE REVIEWS */}
      {activeTab === 'erasure' && (
        <Card title="Review ODPC Data Erasure Request">
          <div className="text-xs text-ink-muted mb-4">
            Under Kenya Data Protection Act (ODPC), users can request data erasure. Review pending request IDs and apply regulatory holds if disputes or active loan obligations apply.
          </div>

          {erasureStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded mb-4 font-semibold">
              {erasureStatus}
            </div>
          )}

          <form onSubmit={handleReviewErasure} className="max-w-lg space-y-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Data Erasure Request ID</label>
              <input
                type="text"
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                value={selectedErasureId || ''}
                onChange={(e) => setSelectedErasureId(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Review Action</label>
              <select
                value={erasureAction}
                onChange={(e) => setErasureAction(e.target.value as any)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="approve">APPROVE — Permanently scrub user data</option>
                <option value="hold">HOLD — Apply regulatory/dispute hold</option>
                <option value="reject">REJECT — Decline request with reason</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Regulatory / Audit Reason</label>
              <textarea
                rows={3}
                placeholder="Provide regulatory justification or details of active financial obligations..."
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={reviewErasureMutation.isPending}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer"
            >
              {reviewErasureMutation.isPending ? 'Submitting Review...' : 'Submit Erasure Decision'}
            </button>
          </form>
        </Card>
      )}

      {/* REVIEW MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-base text-ink">Review Approval Request</div>
              <button onClick={() => setSelectedRequest(null)} className="text-ink-muted text-lg font-bold">
                &times;
              </button>
            </div>

            {reviewError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded font-semibold">{reviewError}</div>
            )}

            <div className="space-y-2 text-xs bg-surface-2 p-3 rounded">
              <div><span className="text-ink-muted">Action:</span> <span className="font-bold">{selectedRequest.action}</span></div>
              <div><span className="text-ink-muted">Requester:</span> {selectedRequest.requester || '—'}</div>
              <div><span className="text-ink-muted">Reason:</span> {selectedRequest.reason || '—'}</div>
            </div>

            <div>
              <label className="text-xs text-ink-muted block mb-1">Decision Notes</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter audit remarks..."
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => rejectMutation.mutate({ id: selectedRequest.id, reason: reviewNotes })}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Reject Request
              </button>
              <button
                onClick={() => approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes })}
                disabled={approveMutation.isPending}
                className="flex-1 py-2 bg-mint-600 hover:bg-mint-700 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

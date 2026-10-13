import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, APPROVAL_ACTION_TYPE_LABELS } from '@saccosphere/api-client'
import { useSacco } from '../../hooks/useSacco'

type DecisionKind = 'approve' | 'reject'

export function ApprovalsList() {
  const queryClient = useQueryClient()
  const { data: sacco } = useSacco()
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'support_access'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Deciding (approve/reject) always requires a fresh step-up verification
  // (TOTP if the admin has an enrolled authenticator, otherwise a phone
  // OTP) - the backend returns 428 the first time, or once the previous
  // verification has aged out. This tracks "we're mid step-up for this
  // specific decision" so the same reason/notes survive the retry.
  const [stepUp, setStepUp] = useState<{ kind: DecisionKind; code: string; otpSent: boolean } | null>(null)

  // Support access grant form state
  const [grantActionType, setGrantActionType] = useState('')
  const [grantGrantedTo, setGrantGrantedTo] = useState('')
  const [grantReason, setGrantReason] = useState('')
  const [grantHours, setGrantHours] = useState('24')
  const [grantStatus, setGrantStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Queries
  const { data: pendingApprovals = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => api.approvals.getPending(),
    staleTime: 10_000,
    refetchInterval: 30_000,
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

  const requestStepUpOtpMutation = useMutation({
    mutationFn: () => api.auth.requestStepUpOtp(),
  })

  const closeModal = () => {
    setSelectedRequest(null)
    setReviewNotes('')
    setReviewError(null)
    setStepUp(null)
  }

  const decideMutation = useMutation({
    mutationFn: ({ kind, id, reason, verification_code }: {
      kind: DecisionKind; id: string; reason: string; verification_code?: string
    }) =>
      kind === 'approve'
        ? api.approvals.approve(id, { reason, verification_code })
        : api.approvals.reject(id, { reason, verification_code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] })
      queryClient.invalidateQueries({ queryKey: ['approvals-history'] })
      closeModal()
    },
    onError: (err: any, variables) => {
      if (err?.status === 428) {
        // Step-up required (or the code we just tried was wrong) - keep
        // the modal open on the same decision and show the step-up panel
        // instead of a dead-end error.
        setStepUp((prev) => ({ kind: variables.kind, code: '', otpSent: prev?.otpSent ?? false }))
        setReviewError(stepUp ? (err?.message || 'Incorrect verification code.') : null)
        return
      }
      setReviewError(err?.message || `Failed to ${variables.kind} this request.`)
    },
  })

  const handleDecide = (kind: DecisionKind) => {
    if (!selectedRequest) return
    if (kind === 'reject' && !reviewNotes.trim()) {
      setReviewError('A reason is required to reject a request.')
      return
    }
    setReviewError(null)
    decideMutation.mutate({
      kind,
      id: selectedRequest.id,
      reason: reviewNotes.trim(),
      verification_code: stepUp?.code || undefined,
    })
  }

  const createGrantMutation = useMutation({
    mutationFn: (data: { sacco_id: string; granted_to: string; action_type: string; reason: string; expires_at: string }) =>
      api.approvals.createSupportAccessGrant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-access-grants'] })
      setGrantStatus({ type: 'success', message: 'Support access grant issued successfully.' })
      setGrantReason('')
      setGrantGrantedTo('')
      setTimeout(() => setGrantStatus(null), 4000)
    },
    onError: (err: any) => {
      setGrantStatus({ type: 'error', message: err?.message || 'Failed to create support access grant.' })
    },
  })

  const revokeGrantMutation = useMutation({
    mutationFn: (id: string) => api.approvals.revokeSupportAccessGrant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-access-grants'] })
    },
  })

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantReason.trim() || !grantGrantedTo.trim()) return
    if (!sacco?.id) {
      setGrantStatus({ type: 'error', message: 'Your SACCO could not be resolved yet - try again in a moment.' })
      return
    }
    const expiresAt = new Date(Date.now() + Number(grantHours) * 3600 * 1000).toISOString()
    createGrantMutation.mutate({
      sacco_id: sacco.id,
      granted_to: grantGrantedTo.trim(),
      action_type: grantActionType,
      reason: grantReason.trim(),
      expires_at: expiresAt,
    })
  }

  const formatCurrency = (val: number | null) =>
    val != null
      ? `KES ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : '—'

  const renderPayload = (payload: Record<string, unknown>) => {
    const entries = Object.entries(payload || {})
    if (entries.length === 0) return <span className="text-ink-faint italic">No additional details</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, value]) => (
          <span key={key} className="px-2 py-0.5 rounded bg-surface-2 text-[10px] text-ink-soft font-mono">
            {key}: {String(value)}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">Maker-Checker Governance & Approvals</div>
          <div className="text-xs text-ink-muted">
            Financial controls queue, multi-approver authorizations, step-up verifications, and support grants.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingApprovals.length > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {pendingApprovals.length} Pending Approval{pendingApprovals.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

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
          <span>Pending Approvals Queue</span>
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
          Approval Audit History
        </button>
        <button
          onClick={() => setActiveTab('support_access')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'support_access'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Support Access Grants
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Approvals</th>
                  <th className="py-2.5 px-3">Submitted / Expires</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isPendingLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted text-sm">
                      Loading pending approval requests...
                    </td>
                  </tr>
                ) : pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-muted text-sm">
                      No pending approval requests. Your governance queue is up to date.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((req: any) => (
                    <tr key={req.id} className="hover:bg-surface-1 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-ink text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                          {req.action_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs font-bold text-ink-soft">
                        {formatCurrency(req.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-xs max-w-xs">{renderPayload(req.payload)}</td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted whitespace-nowrap">
                        {req.approvals_received} / {req.required_approvals}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-ink-muted whitespace-nowrap">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : '—'}
                        {req.expires_at && (
                          <div className="text-[10px] text-amber-700">
                            Expires {new Date(req.expires_at).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRequest(req)
                            setReviewError(null)
                            setReviewNotes('')
                            setStepUp(null)
                          }}
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Review & Decide
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Decision Notes</th>
                  <th className="py-2.5 px-3">Resolved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isHistoryLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-muted text-sm">
                      Loading approval history...
                    </td>
                  </tr>
                ) : historyApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-muted text-sm">
                      No approval history records found.
                    </td>
                  </tr>
                ) : (
                  historyApprovals.map((req: any) => {
                    const isApproved = req.status === 'EXECUTED' || req.status === 'APPROVED'
                    const lastDecision = req.decisions[req.decisions.length - 1]
                    return (
                      <tr key={req.id} className="hover:bg-surface-1 transition-colors">
                        <td className="py-2.5 px-3 text-xs font-semibold text-ink">{req.action_label}</td>
                        <td className="py-2.5 px-3 text-xs font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                              isApproved ? 'bg-mint-50 text-mint-700 border border-mint-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-ink max-w-xs truncate">
                          {lastDecision?.reason || req.error_message || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-ink-muted whitespace-nowrap">
                          {req.resolved_at ? new Date(req.resolved_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT ACCESS GRANTS */}
      {activeTab === 'support_access' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Create Grant Form */}
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Grant Platform Support Access</div>
            <div className="text-xs text-ink-muted">
              Platform staff have no standing access to your SACCO's money actions. This grants one support
              engineer time-boxed access, scoped to one action type or all of them.
            </div>

            {grantStatus && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  grantStatus.type === 'success' ? 'bg-mint-50 text-mint-700 border border-mint-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {grantStatus.message}
              </div>
            )}

            <form onSubmit={handleCreateGrant} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Support engineer's user ID</label>
                <input
                  type="text"
                  placeholder="Provided by support (e.g. on the ticket)"
                  value={grantGrantedTo}
                  onChange={(e) => setGrantGrantedTo(e.target.value)}
                  className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Scope</label>
                <select
                  value={grantActionType}
                  onChange={(e) => setGrantActionType(e.target.value)}
                  className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">All action types</option>
                  {Object.entries(APPROVAL_ACTION_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Grant Duration (Hours)</label>
                <select
                  value={grantHours}
                  onChange={(e) => setGrantHours(e.target.value)}
                  className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="4">4 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="48">48 Hours (2 Days)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Audit Reason / Support Ticket Ref</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Investigating stuck M-Pesa STK callback timeout ticket #4810..."
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createGrantMutation.isPending}
                className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {createGrantMutation.isPending ? 'Issuing Grant...' : 'Issue Time-Boxed Support Grant'}
              </button>
            </form>
          </div>

          {/* Active Grants List */}
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Active & Historical Support Access Grants</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Granted To</th>
                    <th className="py-2 px-3">Scope</th>
                    <th className="py-2 px-3">Starts At</th>
                    <th className="py-2 px-3">Expires At</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isGrantsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">Loading grants...</td>
                    </tr>
                  ) : supportGrants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">No support access grants active.</td>
                    </tr>
                  ) : (
                    supportGrants.map((grant: any) => (
                      <tr key={grant.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink font-mono">{grant.granted_to}</td>
                        <td className="py-2.5 px-3 text-ink-muted">
                          {grant.action_type ? (APPROVAL_ACTION_TYPE_LABELS[grant.action_type] ?? grant.action_type) : 'All actions'}
                        </td>
                        <td className="py-2.5 px-3 text-ink-muted">{grant.starts_at ? new Date(grant.starts_at).toLocaleString() : '—'}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">{grant.expires_at ? new Date(grant.expires_at).toLocaleString() : '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          {grant.revoked_at ? (
                            <span className="text-ink-muted text-[10px]">Revoked</span>
                          ) : (
                            <button
                              onClick={() => revokeGrantMutation.mutate(grant.id)}
                              disabled={revokeGrantMutation.isPending}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200 cursor-pointer"
                            >
                              Revoke Immediately
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & DECIDE MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-lg text-ink">Review Approval Request</div>
              <button
                onClick={closeModal}
                className="text-ink-muted hover:text-ink text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
                {reviewError}
              </div>
            )}

            <div className="space-y-2 text-xs bg-surface-2 p-3.5 rounded-lg border border-ink-faint">
              <div className="flex justify-between">
                <span className="text-ink-muted">Action Type:</span>
                <span className="font-bold text-violet-700">{selectedRequest.action_label}</span>
              </div>
              {selectedRequest.amount != null && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Amount Involved:</span>
                  <span className="font-bold text-mint-700">{formatCurrency(selectedRequest.amount)}</span>
                </div>
              )}
              <div>
                <span className="text-ink-muted block mb-0.5">Details:</span>
                {renderPayload(selectedRequest.payload)}
              </div>
            </div>

            {!stepUp ? (
              <>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Decision Notes & Audit Remark</label>
                  <textarea
                    rows={3}
                    placeholder="Enter approval or rejection notes for audit trail..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full py-2 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleDecide('reject')}
                    disabled={decideMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {decideMutation.isPending ? 'Working...' : 'Reject Request'}
                  </button>
                  <button
                    onClick={() => handleDecide('approve')}
                    disabled={decideMutation.isPending}
                    className="flex-1 py-2 rounded-lg bg-mint-600 hover:bg-mint-700 text-white font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {decideMutation.isPending ? 'Working...' : 'Approve Request'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 border-t border-[#e5ede9] pt-3">
                <div className="text-xs font-semibold text-ink">Verification required</div>
                <div className="text-[11px] text-ink-muted">
                  Deciding on a governed action needs a fresh code - from your authenticator app if you've set one
                  up, otherwise a one-time code sent to your phone.
                </div>
                <button
                  type="button"
                  onClick={() => requestStepUpOtpMutation.mutate(undefined, {
                    onSuccess: () => setStepUp((s) => (s ? { ...s, otpSent: true } : s)),
                  })}
                  disabled={requestStepUpOtpMutation.isPending}
                  className="w-full py-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {requestStepUpOtpMutation.isPending
                    ? 'Sending...'
                    : stepUp.otpSent
                      ? 'Code sent - resend'
                      : 'Send code to my phone'}
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter verification code"
                  value={stepUp.code}
                  onChange={(e) => setStepUp((s) => (s ? { ...s, code: e.target.value } : s))}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStepUp(null)}
                    className="flex-1 py-2 rounded-lg border border-ink-faint bg-white text-xs text-ink-muted"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecide(stepUp.kind)}
                    disabled={decideMutation.isPending || !stepUp.code.trim()}
                    className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {decideMutation.isPending ? 'Verifying...' : `Confirm ${stepUp.kind === 'approve' ? 'approval' : 'rejection'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

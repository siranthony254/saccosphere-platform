import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '@saccosphere/ui'
import { useMemberDetail, useOpenSavingsAccount } from '../../hooks/useMembers'
import { useLoanRestructures, useRequestLoanRestructure } from '../../hooks/useLoans'
import { useUserRoles } from '../../hooks/useRoles'
import { useSavingsTypesList } from '../../hooks/useSavingsTypes'
import { useAuthStore } from '../../store/useAuthStore'
import { StepUpModal } from '../../components/auth/StepUpModal'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: member, isLoading, error } = useMemberDetail(id!)
  const { user } = useAuthStore()

  // Fetch all roles for this user (they may be both a member AND a SACCO admin)
  // user_id is populated from the backend member.user.id field
  const queryClient = useQueryClient()
  const { data: roles } = useUserRoles(member?.user_id ?? '')

  const { data: savingsTypes } = useSavingsTypesList(user?.sacco_id ?? undefined)
  const openSavingsAccount = useOpenSavingsAccount()
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openAccountError, setOpenAccountError] = useState<string | null>(null)
  const [openAccountSuccess, setOpenAccountSuccess] = useState<string | null>(null)

  // Savings Admin Actions state
  const [statusModalSaving, setStatusModalSaving] = useState<{ id: string; type: string; currentStatus: string } | null>(null)
  const [newStatus, setNewStatus] = useState<'freeze' | 'close' | 'reactivate'>('freeze')
  const [statusReason, setStatusReason] = useState('')

  const [dividendModalSaving, setDividendModalSaving] = useState<{ id: string; type: string; currentEligible: boolean } | null>(null)
  const [dividendReason, setDividendReason] = useState('')

  const [reversalModalSaving, setReversalModalSaving] = useState<{ id: string; type: string } | null>(null)
  const [reversalAmount, setReversalAmount] = useState('')
  const [reversalDirection, setReversalDirection] = useState<'DEBIT' | 'CREDIT'>('DEBIT')
  const [reversalReason, setReversalReason] = useState('')
  const [showStepUp, setShowStepUp] = useState(false)
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [pendingReversalPayload, setPendingReversalPayload] = useState<{ id: string; amount: number; direction: 'CREDIT' | 'DEBIT'; reason: string } | null>(null)

  const [actionError, setActionError] = useState<string | null>(null)

  // P17: loan restructure modal state (ACTIVE/DEFAULTED loans only).
  const [restructureModalLoan, setRestructureModalLoan] = useState<{ id: string; label: string; outstanding_balance: number; interest_rate: number; term_months: number } | null>(null)
  const [restructureType, setRestructureType] = useState<'RESTRUCTURE' | 'RESCHEDULE' | 'TOP_UP' | 'BUY_OFF' | 'PENALTY_WAIVER'>('RESTRUCTURE')
  const [restructureReason, setRestructureReason] = useState('')
  const [afterAmount, setAfterAmount] = useState('')
  const [afterInterestRate, setAfterInterestRate] = useState('')
  const [afterTermMonths, setAfterTermMonths] = useState('')
  const [restructureError, setRestructureError] = useState<string | null>(null)
  const [showRestructureStepUp, setShowRestructureStepUp] = useState(false)
  const [restructureStepUpError, setRestructureStepUpError] = useState<string | null>(null)

  const { data: restructureHistory = [] } = useLoanRestructures(restructureModalLoan?.id ?? null)
  const requestRestructure = useRequestLoanRestructure(restructureModalLoan?.id ?? null)

  function buildRestructurePayload() {
    return {
      restructure_type: restructureType,
      reason: restructureReason.trim(),
      ...(afterAmount.trim() ? { after_amount: Number(afterAmount) } : {}),
      ...(afterInterestRate.trim() ? { after_interest_rate: Number(afterInterestRate) } : {}),
      ...(afterTermMonths.trim() ? { after_term_months: Number(afterTermMonths) } : {}),
    }
  }

  const resetRestructureModal = () => {
    setRestructureModalLoan(null)
    setRestructureType('RESTRUCTURE')
    setRestructureReason('')
    setAfterAmount('')
    setAfterInterestRate('')
    setAfterTermMonths('')
    setRestructureError(null)
    setShowRestructureStepUp(false)
    setRestructureStepUpError(null)
  }

  const submitRestructure = (verification_code?: string) => {
    if (!restructureReason.trim()) {
      setRestructureError('A reason is required.')
      return
    }
    const payload = { ...buildRestructurePayload(), ...(verification_code ? { verification_code } : {}) }
    requestRestructure.mutate(payload, {
      onSuccess: (res) => {
        setShowRestructureStepUp(false)
        setRestructureStepUpError(null)
        setRestructureError(null)
        setActionError(null)
        if (res?.detail) {
          // Leave the modal open so the admin sees the queued-for-approval
          // confirmation and the refreshed history below it.
          setRestructureReason('')
        }
      },
      onError: (err: any) => {
        if (err?.status === 428) {
          setRestructureStepUpError(err?.message || 'Incorrect verification code.')
          setShowRestructureStepUp(true)
          return
        }
        setRestructureError(err?.message || 'Failed to request restructure.')
      },
    })
  }

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; action: 'freeze' | 'close' | 'reactivate'; reason: string }) =>
      api.saccoAdmin.updateSavingsStatus(data.id, { status: data.action.toUpperCase(), reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
      setStatusModalSaving(null)
      setStatusReason('')
      setActionError(null)
    },
    onError: (err: any) => setActionError(err?.message || 'Failed to update savings status.'),
  })

  const updateDividendMutation = useMutation({
    mutationFn: (data: { id: string; eligible: boolean; reason: string }) =>
      api.saccoAdmin.updateSavingsDividendEligibility(data.id, { eligible: data.eligible, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
      setDividendModalSaving(null)
      setDividendReason('')
      setActionError(null)
    },
    onError: (err: any) => setActionError(err?.message || 'Failed to update dividend eligibility.'),
  })

  const reverseTransactionMutation = useMutation({
    mutationFn: (data: { id: string; amount: number; direction: 'CREDIT' | 'DEBIT'; reason: string; verification_code?: string }) =>
      api.saccoAdmin.reverseSavingsTransaction(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
      setReversalModalSaving(null)
      setReversalAmount('')
      setReversalReason('')
      setActionError(null)
      setShowStepUp(false)
      setStepUpError(null)
    },
    onError: (err: any, variables) => {
      if (err?.status === 428) {
        // Wrong/expired code on retry — keep the step-up modal open with
        // the real reason instead of a silent dead end.
        setPendingReversalPayload(variables)
        setStepUpError(err?.message || 'Incorrect verification code.')
        setShowStepUp(true)
        return
      }
      setActionError(err?.message || 'Failed to reverse savings entry.')
    },
  })

  if (isLoading) return <div className="p-5 text-ink-muted text-sm">Loading member...</div>
  if (error) return <div className="p-5 text-red-600 text-sm">Failed to load member. Please try again.</div>
  if (!member) return <div className="p-5 text-ink-muted text-sm">Member not found.</div>

  const isPending = member.membership_status === 'applied' || member.membership_status === 'under_review'

  const roleBadge = 'bg-violet-50 text-violet-700'

  const handleOpenSavingsAccount = () => {
    setOpenAccountError(null)
    setOpenAccountSuccess(null)
    if (!selectedTypeId) {
      setOpenAccountError('Choose a savings type.')
      return
    }
    const balance = openingBalance.trim() ? Number(openingBalance) : undefined
    if (balance !== undefined && (Number.isNaN(balance) || balance < 0)) {
      setOpenAccountError('Opening balance must be a non-negative number.')
      return
    }
    openSavingsAccount.mutate(
      { membership_id: member.id, savings_type_id: selectedTypeId, opening_balance: balance },
      {
        onSuccess: (result) => {
          setOpenAccountSuccess(`Opened ${result.savings_type_name} savings account.`)
          setSelectedTypeId('')
          setOpeningBalance('')
        },
        onError: (err: any) => setOpenAccountError(err?.message || err?.response?.data?.detail || 'Failed to open savings account.'),
      },
    )
  }

  return (
    <div className="p-5">
      {/* Breadcrumb */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-ink-muted text-sm hover:text-ink transition-colors"
          >
            <Icon name="chevron-left" size={14} />
            Members
          </button>
          <span className="text-ink-faint">|</span>
          <div>
            <div className="text-lg font-semibold text-ink">{member.first_name} {member.last_name}</div>
            <div className="text-xs text-ink-muted">
              {member.member_number || 'PENDING'} · {member.membership_status === 'active' ? `Active since ${member.joined_at ? new Date(member.joined_at).getFullYear() : '—'}` : 'Application Pending'}
            </div>
          </div>
        </div>

      </div>

      {isPending && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-sm font-semibold text-blue-800 mb-1">Application pending</div>
          <p className="text-[11px] text-blue-700">
            Approve or reject this application from the{' '}
            <button
              onClick={() => navigate('/applications')}
              className="underline font-semibold bg-transparent border-none cursor-pointer text-blue-800 p-0"
            >
              Applications
            </button>{' '}
            list.
          </p>
        </div>
      )}


      {/* Profile card */}
      <div className="bg-mint-50 rounded-[10px] p-4 mb-4 flex items-center gap-3.5">
        <div className="w-[52px] h-[52px] rounded-full bg-mint-600 flex items-center justify-center text-lg font-semibold text-white shrink-0">
          {member.first_name[0]}{member.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold text-mint-800">{member.first_name} {member.last_name}</div>
          <div className="text-[11px] text-mint-700">{member.email} · {member.phone} · ID: {member.national_id ?? '—'}</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {/* Membership / KYC / SACCO ID badges */}
            {[
              { text: member.membership_status,       bg: 'bg-mint-50',   color: 'text-mint-700' },
              { text: `KYC ${member.kyc_status}`,     bg: 'bg-blue-50',   color: 'text-blue-700' },
              { text: member.saccosphere_id,           bg: 'bg-violet-50', color: 'text-violet-700' },
            ].map((b, i) => (
              <span key={i} className={`${b.bg} ${b.color} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>
                {b.text}
              </span>
            ))}
            {/* All roles this user holds */}
            {roles && roles.length > 0 && roles.map((role: any) => (
              <span key={role.id} className={`${roleBadge} px-2 py-0.5 rounded-full text-[10px] font-semibold`}>
                {role.role_label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-4">
        {[
          { title: 'Savings', stats: [
            { label: 'BOSA savings',  val: `KES ${member.bosa_balance.toLocaleString()}` },
            { label: 'FOSA savings',  val: `KES ${member.fosa_balance.toLocaleString()}` },
            { label: 'Share capital', val: `KES ${member.share_capital.toLocaleString()}` },
          ]},
          { title: 'Loans', stats: [
            { label: 'Active loans',   val: member.active_loans_count.toString() },
            { label: 'Outstanding',    val: `KES ${member.active_loans_kes.toLocaleString()}` },
            { label: 'Repayment rate', val: `${member.repayment_rate_pct}%` },
          ]},
          { title: 'Contributions', stats: [
            { label: 'Monthly amount', val: `KES ${member.monthly_contribution.toLocaleString()}` },
            { label: 'KYC status',     val: member.kyc_status },
            { label: 'Last active',    val: member.last_active ? new Date(member.last_active).toLocaleDateString() : '—' },
          ]},
        ].map(card => (
          <div key={card.title} className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
            <div className="font-semibold text-sm text-ink mb-2.5">{card.title}</div>
            {card.stats.map(s => (
              <div key={s.label} className="flex justify-between py-1.5 border-b border-surface-3">
                <span className="text-xs text-ink-muted">{s.label}</span>
                <span className="text-xs font-semibold text-ink">{s.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Open savings account */}
      {member.membership_status === 'active' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-4">
          <div className="font-semibold text-sm text-ink mb-1">Open a savings account</div>
          <p className="text-xs text-ink-muted mb-3">
            The only way this member gets a savings account to contribute into — there's no
            automatic account on approval.
          </p>
          <div className="grid grid-cols-[1fr_140px_auto] gap-2 items-end">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Savings type</label>
              <select
                className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                value={selectedTypeId}
                onChange={e => setSelectedTypeId(e.target.value)}
              >
                <option value="">Select a type…</option>
                {(savingsTypes ?? []).filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Opening balance (optional)</label>
              <input
                className="w-full p-2 border border-[#e5ede9] rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="0"
                inputMode="decimal"
              />
            </div>
            <button
              onClick={handleOpenSavingsAccount}
              disabled={openSavingsAccount.isPending}
              className="px-4 py-2 rounded-lg border-none bg-violet-600 text-white text-sm font-semibold cursor-pointer hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {openSavingsAccount.isPending ? 'Opening…' : 'Open account'}
            </button>
          </div>
          {(savingsTypes ?? []).length === 0 && (
            <p className="text-[11px] text-amber-700 mt-2">
              No savings types configured for this SACCO yet — add one in Settings first.
            </p>
          )}
          {openAccountError && <p className="text-[11px] text-red-600 mt-2">{openAccountError}</p>}
          {openAccountSuccess && <p className="text-[11px] text-mint-700 mt-2">{openAccountSuccess}</p>}
        </div>
      )}

      {/* Savings breakdown */}
      {member.savings_breakdown.length > 0 && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-4">
          <div className="font-semibold text-sm text-ink mb-3">Savings breakdown &amp; Admin Controls</div>
          <div className="flex flex-col gap-2.5">
            {member.savings_breakdown.map((s, i) => (
              <div key={i} className="p-3 bg-surface-2 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink">{s.savings_type || 'General'}</div>
                    <div className="text-[10px] text-ink-muted">
                      +KES {s.total_contributions.toLocaleString()} contributed · -KES {s.total_withdrawals.toLocaleString()} withdrawn
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-ink">KES {s.amount.toLocaleString()}</div>
                    <div className="text-[10px] font-semibold text-violet-700 capitalize">
                      {s.status || 'Active'} · {s.dividend_eligible !== false ? 'Dividend Eligible' : 'Ineligible for Dividend'}
                    </div>
                  </div>
                </div>

                {s.id && (
                  <div className="flex gap-2 pt-1.5 border-t border-surface-3 justify-end">
                    <button
                      onClick={() => {
                        setActionError(null)
                        setStatusModalSaving({ id: s.id!, type: s.savings_type || 'General', currentStatus: s.status || 'ACTIVE' })
                      }}
                      className="px-2 py-1 bg-white border border-[#e5ede9] rounded text-[10px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
                    >
                      Status Action
                    </button>
                    <button
                      onClick={() => {
                        setActionError(null)
                        setDividendModalSaving({ id: s.id!, type: s.savings_type || 'General', currentEligible: s.dividend_eligible !== false })
                      }}
                      className="px-2 py-1 bg-white border border-[#e5ede9] rounded text-[10px] font-semibold text-ink-muted hover:text-ink cursor-pointer"
                    >
                      Dividend Eligibility
                    </button>
                    <button
                      onClick={() => {
                        setActionError(null)
                        setReversalModalSaving({ id: s.id!, type: s.savings_type || 'General' })
                      }}
                      className="px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                    >
                      Reverse Transaction
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active loans */}
      {member.active_loans.length > 0 && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-4">
          <div className="font-semibold text-sm text-ink mb-3">Active loans</div>
          <div className="flex flex-col gap-2">
            {member.active_loans.map(loan => (
              <div key={loan.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
                <div>
                  <div className="text-xs font-medium text-ink">{loan.loan_type || 'Loan'}</div>
                  <div className="text-[10px] text-ink-muted">
                    KES {loan.amount.toLocaleString()} at {loan.interest_rate}%{loan.term_months ? ` · ${loan.term_months} months` : ''}
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="text-xs font-semibold text-ink">KES {loan.outstanding_balance.toLocaleString()} owed</div>
                    {loan.status && <div className="text-[10px] text-ink-muted">{loan.status}</div>}
                  </div>
                  <button
                    onClick={() => setRestructureModalLoan({
                      id: loan.id,
                      label: loan.loan_type || 'Loan',
                      outstanding_balance: loan.outstanding_balance,
                      interest_rate: loan.interest_rate,
                      term_months: loan.term_months ?? 0,
                    })}
                    className="px-2.5 py-1 rounded-[6px] border border-ink-faint bg-white hover:bg-surface-1 text-ink text-[11px] font-semibold cursor-pointer transition-colors"
                  >
                    Restructure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {member.recent_transactions.length > 0 && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 mb-4">
          <div className="font-semibold text-sm text-ink mb-3">Recent transactions</div>
          <div className="flex flex-col gap-2">
            {member.recent_transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
                <div>
                  <div className="text-xs font-medium text-ink">{t.description || t.transaction_type || 'Transaction'}</div>
                  <div className="text-[10px] text-ink-muted">
                    {t.reference || t.id} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-ink">KES {t.amount.toLocaleString()}</div>
                  {t.status && <div className="text-[10px] text-ink-muted">{t.status}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles section — lists every role this user holds (member AND admin of same SACCO, etc.) */}
      {roles && roles.length > 0 && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3">Platform roles</div>
          <div className="flex flex-col gap-2">
            {roles.map((role: any) => (
              <div key={role.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
                <div>
                  <span className={`${roleBadge} text-[11px] font-semibold px-2 py-0.5 rounded-full`}>
                    {role.role_label}
                  </span>
                  {role.sacco_name && (
                    <span className="ml-2 text-xs text-ink-muted">{role.sacco_name}</span>
                  )}
                </div>
                <span className="text-[10px] text-ink-muted">
                  {role.created_at ? new Date(role.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: SAVINGS STATUS */}
      {statusModalSaving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-base text-ink">Change Savings Account Status</div>
              <button onClick={() => setStatusModalSaving(null)} className="text-ink-muted text-lg font-bold">&times;</button>
            </div>
            {actionError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{actionError}</div>}
            <div className="text-xs text-ink-muted">
              Account: <span className="font-bold text-ink">{statusModalSaving.type}</span> (Current: {statusModalSaving.currentStatus})
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="freeze">Freeze Account (Suspend deposits &amp; withdrawals)</option>
                <option value="reactivate">Reactivate Account</option>
                <option value="close">Close Account</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Audit Reason</label>
              <textarea
                rows={3}
                placeholder="Reason for changing account status..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStatusModalSaving(null)} className="flex-1 py-2 border border-ink-faint rounded text-xs text-ink-muted font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={() => updateStatusMutation.mutate({ id: statusModalSaving.id, action: newStatus, reason: statusReason })}
                disabled={updateStatusMutation.isPending || !statusReason}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DIVIDEND ELIGIBILITY */}
      {dividendModalSaving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-base text-ink">Dividend Eligibility Toggle</div>
              <button onClick={() => setDividendModalSaving(null)} className="text-ink-muted text-lg font-bold">&times;</button>
            </div>
            {actionError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{actionError}</div>}
            <div className="text-xs text-ink-muted">
              Account: <span className="font-bold text-ink">{dividendModalSaving.type}</span> (Currently: {dividendModalSaving.currentEligible ? 'Eligible' : 'Ineligible'})
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Reason for Toggling Dividend Eligibility</label>
              <textarea
                rows={3}
                placeholder="Provide justification..."
                value={dividendReason}
                onChange={(e) => setDividendReason(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDividendModalSaving(null)} className="flex-1 py-2 border border-ink-faint rounded text-xs text-ink-muted font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={() => updateDividendMutation.mutate({ id: dividendModalSaving.id, eligible: !dividendModalSaving.currentEligible, reason: dividendReason })}
                disabled={updateDividendMutation.isPending || !dividendReason}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {updateDividendMutation.isPending ? 'Updating...' : `Set as ${dividendModalSaving.currentEligible ? 'Ineligible' : 'Eligible'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVERSAL */}
      {reversalModalSaving && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-[#e5ede9]">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-base text-ink">Reverse Savings Entry</div>
              <button onClick={() => setReversalModalSaving(null)} className="text-ink-muted text-lg font-bold">&times;</button>
            </div>
            {actionError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{actionError}</div>}
            <div className="text-xs text-ink-muted">
              Reversing entry on <span className="font-bold text-ink">{reversalModalSaving.type}</span> account. Reversals require step-up verification.
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Reversal Amount (KES)</label>
              <input
                type="number"
                placeholder="Amount to reverse"
                value={reversalAmount}
                onChange={(e) => setReversalAmount(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Direction</label>
              <select
                value={reversalDirection}
                onChange={(e) => setReversalDirection(e.target.value as any)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="DEBIT">DEBIT (Deduct incorrectly credited funds)</option>
                <option value="CREDIT">CREDIT (Refund incorrectly debited funds)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Reason / Reference</label>
              <textarea
                rows={3}
                placeholder="Audit reason for reversal..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setReversalModalSaving(null)} className="flex-1 py-2 border border-ink-faint rounded text-xs text-ink-muted font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={() => {
                  if (!reversalAmount || !reversalReason) return
                  setPendingReversalPayload({
                    id: reversalModalSaving.id,
                    amount: Number(reversalAmount),
                    direction: reversalDirection,
                    reason: reversalReason,
                  })
                  setStepUpError(null)
                  setShowStepUp(true)
                }}
                disabled={!reversalAmount || !reversalReason}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Request Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      <StepUpModal
        isOpen={showStepUp}
        title="Authorize Savings Reversal"
        description="Savings entry reversals are high-risk financial actions requiring staff step-up authorization."
        error={stepUpError}
        onClose={() => { setShowStepUp(false); setStepUpError(null) }}
        onSubmitCode={(code) => {
          if (pendingReversalPayload) {
            reverseTransactionMutation.mutate({ ...pendingReversalPayload, verification_code: code })
          }
        }}
      />

      {/* MODAL 4: LOAN RESTRUCTURE (P17) */}
      {restructureModalLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-[#e5ede9] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
              <div className="font-bold text-base text-ink">Restructure — {restructureModalLoan.label}</div>
              <button onClick={resetRestructureModal} className="text-ink-muted text-lg font-bold">&times;</button>
            </div>

            {restructureError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{restructureError}</div>}

            <div className="text-[11px] text-ink-muted bg-surface-2 p-2.5 rounded-lg">
              Outstanding KES {restructureModalLoan.outstanding_balance.toLocaleString()} · {restructureModalLoan.interest_rate}% ·{' '}
              {restructureModalLoan.term_months} months remaining. Always goes through the maker-checker queue —
              a type that raises the loan's exposure above what its guarantors already consented to also needs
              their fresh re-consent before it applies.
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Restructure type</label>
              <select
                value={restructureType}
                onChange={(e) => setRestructureType(e.target.value as any)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="RESTRUCTURE">Restructure (change terms)</option>
                <option value="RESCHEDULE">Reschedule (change term/rate)</option>
                <option value="TOP_UP">Top-up (increase balance)</option>
                <option value="BUY_OFF">Buy-off (settle below balance)</option>
                <option value="PENALTY_WAIVER">Penalty waiver</option>
              </select>
            </div>

            {restructureType !== 'PENALTY_WAIVER' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-ink-muted mb-1 block">
                    {restructureType === 'TOP_UP' ? 'New balance (KES)' : 'After amount (KES)'}
                  </label>
                  <input
                    type="number"
                    placeholder={String(restructureModalLoan.outstanding_balance)}
                    value={afterAmount}
                    onChange={(e) => setAfterAmount(e.target.value)}
                    className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ink-muted mb-1 block">After rate (%)</label>
                  <input
                    type="number"
                    placeholder={String(restructureModalLoan.interest_rate)}
                    value={afterInterestRate}
                    onChange={(e) => setAfterInterestRate(e.target.value)}
                    className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-ink-muted mb-1 block">After term (months)</label>
                  <input
                    type="number"
                    placeholder={String(restructureModalLoan.term_months)}
                    value={afterTermMonths}
                    onChange={(e) => setAfterTermMonths(e.target.value)}
                    className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Reason</label>
              <textarea
                rows={3}
                placeholder="Why is this loan being restructured?"
                value={restructureReason}
                onChange={(e) => setRestructureReason(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />
            </div>

            <button
              onClick={() => submitRestructure()}
              disabled={requestRestructure.isPending || !restructureReason.trim()}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {requestRestructure.isPending ? 'Submitting…' : 'Submit for approval'}
            </button>

            {restructureHistory.length > 0 && (
              <div className="border-t border-[#e5ede9] pt-3">
                <div className="text-[11px] font-semibold text-ink-soft mb-2 uppercase tracking-wide">History</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {restructureHistory.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-2.5 py-1.5 bg-surface-2 rounded text-[11px]">
                      <div>
                        <span className="font-semibold text-ink">{r.restructure_type}</span>
                        <span className="ml-2 text-ink-muted">{r.status}</span>
                      </div>
                      <span className="text-ink-faint">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <StepUpModal
        isOpen={showRestructureStepUp}
        title="Authorize loan restructure"
        description="Restructuring a loan is a maker-checker-gated financial action requiring staff step-up authorization."
        error={restructureStepUpError}
        onClose={() => { setShowRestructureStepUp(false); setRestructureStepUpError(null) }}
        onSubmitCode={(code) => submitRestructure(code)}
      />
    </div>
  )
}

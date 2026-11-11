import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { formatKES } from '@saccosphere/config'
import { useSacco } from '../../hooks/useSacco'
import { InfoTip } from '@saccosphere/ui'
import {
  useGLTrialBalance,
  useGLReconciliation,
} from '../../hooks/useLedger'

const CATEGORY_LABELS: Record<string, string> = {
  SAVING_DEPOSIT: 'Saving Deposit',
  SAVING_WITHDRAWAL: 'Saving Withdrawal',
  LOAN_DISBURSEMENT: 'Loan Disbursement',
  LOAN_REPAYMENT: 'Loan Repayment',
  FEE: 'Fee Charge',
  PENALTY: 'Penalty Charge',
  DIVIDEND: 'Dividend Declaration',
  DIVIDEND_PAYOUT: 'Dividend Payout',
  ADJUSTMENT: 'Manual Adjustment',
}

export function LedgerManagement() {
  const { data: sacco } = useSacco()

  const [activeTab, setActiveTab] = useState<'entries' | 'statement' | 'trial_balance' | 'adjustment'>('trial_balance')

  // Filters (still used by the GL Account Statement drill-down below)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])

  const { data: trialBalance, isLoading: isTrialBalanceLoading } = useGLTrialBalance()
  const { data: reconciliation, isLoading: isReconciliationLoading } = useGLReconciliation()

  // GL Account Statement Drill-Down State
  const [selectedGlAccount, setSelectedGlAccount] = useState<{ id: string; code: string; name: string } | null>(null)

  const { data: glAccountStatement, isLoading: isGlAccountStatementLoading } = useQuery({
    queryKey: ['gl-account-statement', selectedGlAccount?.id, fromDate, toDate],
    queryFn: () =>
      selectedGlAccount?.id
        ? api.saccoAdmin.getGLAccountStatement(selectedGlAccount.id, { from_date: fromDate, to_date: toDate })
        : null,
    enabled: Boolean(selectedGlAccount?.id),
  })

  // Adjustment form state
  const [adjCategory, setAdjCategory] = useState('ADJUSTMENT')
  const [adjType, setAdjType] = useState<'DEBIT' | 'CREDIT'>('CREDIT')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReference, setAdjReference] = useState('')
  const [adjDescription, setAdjDescription] = useState('')
  const [adjStatus, setAdjStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjAmount || !adjReference || !adjDescription) {
      setAdjStatus({ type: 'error', message: 'Please fill in all required fields.' })
      return
    }

    const amount = Number(adjAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setAdjStatus({ type: 'error', message: 'Amount must be a positive number.' })
      return
    }

    setAdjStatus({
      type: 'error',
      message: 'Manual journal posting is not available because the backend does not provide a SACCO-scoped posting endpoint.',
    })
  }

  const formatCurrency = (val: number | undefined) => formatKES(val, 'KES 0.00')

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            General Ledger & Double-Entry Accounting
            <InfoTip text="This SACCO's full accounting record — every transaction, recorded twice (once as a debit, once as a credit) so the books always balance." label="About the General Ledger" />
          </div>
          <div className="text-xs text-ink-muted">
            Inspect live journal entries, running balances, financial statements, and account postings.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            {sacco?.name || 'SACCO General Ledger'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('entries')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'entries'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          General Ledger Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'statement'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Financial Statement & PDF Export
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'trial_balance'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Trial Balance & Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('adjustment')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'adjustment'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Manual Journal Entry
        </button>
      </div>

      {/* TAB 1: JOURNAL ENTRIES - the backend endpoint this called
          (/ledger/entries/) is member-facing only: it looks up
          Membership.objects.get(user=request.user, sacco_id=..., status=APPROVED)
          - i.e. the caller's OWN membership in the SACCO. A SACCO admin
          is staff, not a member, so this 400s every time
          ("No approved membership found for this SACCO") and always
          will, for any admin account. No SACCO-scoped admin equivalent
          exists in the backend - disclosed rather than silently left to
          fail (it previously crashed the whole page on render when the
          error response reached a .map() expecting an array). Use Trial
          Balance / Reconciliation below for the real, working
          admin-scoped view of the same data. */}
      {activeTab === 'entries' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 shadow-sm">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="font-semibold mb-1">Not available for admin accounts yet</div>
            <p className="text-xs leading-relaxed">
              This would list every ledger entry for the SACCO, but the backend's{' '}
              <code className="font-mono">/ledger/entries/</code> endpoint only returns the
              calling user's own membership entries — it has no SACCO-wide admin view. Since a
              SACCO admin isn't a member of their own SACCO, this always returns an error rather
              than real data. Use the <span className="font-semibold">Trial Balance &amp;
              Reconciliation</span> tab for the real, working double-entry view of this SACCO's
              books.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL STATEMENT - same backend gap as TAB 1
          (/ledger/statement/ and /ledger/statement/pdf/ are both
          member-facing only; see note above). */}
      {activeTab === 'statement' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 shadow-sm">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="font-semibold mb-1">Not available for admin accounts yet</div>
            <p className="text-xs leading-relaxed">
              Statement generation and the PDF export use the same member-only{' '}
              <code className="font-mono">/ledger/statement/</code> endpoint as above, so they
              have the same gap — there's no SACCO-scoped admin equivalent yet. Use{' '}
              <span className="font-semibold">Trial Balance &amp; Reconciliation</span> or the
              GL account statement drill-down there for a working admin-facing statement.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE & RECONCILIATION (real double-entry GL data) */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-base text-ink">Trial Balance</div>
                <div className="text-xs text-ink-muted">
                  Every GL account with its debit/credit totals{trialBalance?.as_of ? ` as of ${trialBalance.as_of}` : ''}.
                </div>
              </div>
              {trialBalance && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    trialBalance.balanced ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {trialBalance.balanced ? 'Balanced' : 'Out of balance'}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Debit</th>
                    <th className="py-2.5 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isTrialBalanceLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-muted text-sm">
                        Loading trial balance...
                      </td>
                    </tr>
                  ) : (trialBalance?.accounts ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-muted text-sm">
                        No GL accounts found for this SACCO yet.
                      </td>
                    </tr>
                  ) : (
                    (trialBalance?.accounts ?? []).map((a: { code: string; name: string; type: string; debit: number; credit: number; id?: string }) => (
                      <tr
                        key={a.code}
                        onClick={() => setSelectedGlAccount({ id: a.id || a.code, code: a.code, name: a.name })}
                        className="hover:bg-violet-50/50 cursor-pointer transition-colors"
                        title="Click to drill down into GL account statement"
                      >
                        <td className="py-2.5 px-3 font-mono text-xs text-violet-700 font-bold">{a.code}</td>
                        <td className="py-2.5 px-3 text-ink text-xs font-medium">{a.name}</td>
                        <td className="py-2.5 px-3 text-xs text-ink-muted uppercase">{a.type}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-amber-700 text-xs">
                          {a.debit ? formatCurrency(a.debit) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-mint-700 text-xs">
                          {a.credit ? formatCurrency(a.credit) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {trialBalance && (trialBalance.accounts ?? []).length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#e5ede9] font-bold text-xs">
                      <td colSpan={3} className="py-2.5 px-3 text-ink">Total</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{formatCurrency(trialBalance.total_debit)}</td>
                      <td className="py-2.5 px-3 text-right text-mint-700">{formatCurrency(trialBalance.total_credit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-base text-ink">Control Account Reconciliation</div>
                <div className="text-xs text-ink-muted">
                  Compares each control account's GL balance against its independently computed sub-ledger figure.
                </div>
              </div>
              {reconciliation && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    reconciliation.all_reconciled ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {reconciliation.all_reconciled ? 'All reconciled' : 'Discrepancy found'}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3 text-right">GL Balance</th>
                    <th className="py-2.5 px-3 text-right">Sub-Ledger Balance</th>
                    <th className="py-2.5 px-3 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isReconciliationLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-ink-muted text-sm">
                        Loading reconciliation...
                      </td>
                    </tr>
                  ) : (reconciliation?.results ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-ink-muted text-sm">
                        No control accounts configured for this SACCO yet.
                      </td>
                    </tr>
                  ) : (
                    (reconciliation?.results ?? []).map((row: { account_code: string; account_name: string; gl_balance: number; sub_ledger_balance: number; difference: number }) => (
                      <tr key={row.account_code} className="hover:bg-surface-1 transition-colors">
                        <td className="py-2.5 px-3 text-ink text-xs">
                          <span className="font-mono text-ink-soft">{row.account_code}</span> — {row.account_name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-ink">{formatCurrency(row.gl_balance)}</td>
                        <td className="py-2.5 px-3 text-right text-xs text-ink">{formatCurrency(row.sub_ledger_balance)}</td>
                        <td className={`py-2.5 px-3 text-right text-xs font-semibold ${row.difference === 0 ? 'text-mint-700' : 'text-red-700'}`}>
                          {formatCurrency(row.difference)}
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

      {/* TAB 4: MANUAL JOURNAL ADJUSTMENT */}
      {activeTab === 'adjustment' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 max-w-2xl space-y-4 shadow-sm">
          <div>
            <div className="font-semibold text-base text-ink">Manual Journal Entry</div>
            <div className="text-xs text-ink-muted">
              Manual journal posting is unavailable until the backend exposes a SACCO-scoped posting endpoint.
            </div>
          </div>

          {adjStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold ${
                adjStatus.type === 'success' ? 'bg-mint-50 text-mint-700 border border-mint-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {adjStatus.message}
            </div>
          )}

          <form onSubmit={handlePostAdjustment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Entry Category</label>
                <select
                  value={adjCategory}
                  onChange={(e) => setAdjCategory(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Entry Type</label>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdjType('CREDIT')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      adjType === 'CREDIT'
                        ? 'bg-mint-500 text-white border-mint-500'
                        : 'bg-white text-ink-muted border-ink-faint'
                    }`}
                  >
                    CREDIT (Inflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('DEBIT')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                      adjType === 'DEBIT'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-ink-muted border-ink-faint'
                    }`}
                  >
                    DEBIT (Outflow)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Amount (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5000.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Reference Code</label>
                <input
                  type="text"
                  placeholder="e.g. ADJ-2026-0817"
                  value={adjReference}
                  onChange={(e) => setAdjReference(e.target.value)}
                  className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">Description & Audit Reason</label>
              <textarea
                rows={3}
                placeholder="Reason for manual journal adjustment..."
                value={adjDescription}
                onChange={(e) => setAdjDescription(e.target.value)}
                className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm cursor-pointer transition-colors"
            >
              Post Journal Entry to Ledger
            </button>
          </form>
        </div>
      )}

      {/* GL ACCOUNT STATEMENT DRILL-DOWN MODAL */}
      {selectedGlAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-[#e5ede9] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3 shrink-0">
              <div>
                <div className="font-bold text-lg text-ink">
                  GL Account Statement: <span className="text-violet-700">{selectedGlAccount.code}</span> — {selectedGlAccount.name}
                </div>
                <div className="text-xs text-ink-muted">Detailed postings for this general ledger account</div>
              </div>
              <button
                onClick={() => setSelectedGlAccount(null)}
                aria-label="Close"
                className="text-ink-muted hover:text-ink text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-3 items-end shrink-0">
              <div>
                <label className="text-[10px] text-ink-muted mb-1 block">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="py-1 px-2 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-muted mb-1 block">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="py-1 px-2 border border-ink-faint rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-2 p-3 rounded-lg shrink-0 text-xs">
              <div>
                <span className="text-ink-muted block">Opening Balance</span>
                <span className="font-bold text-ink text-sm">
                  {isGlAccountStatementLoading ? '...' : formatCurrency(glAccountStatement?.opening_balance)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">Total Debits</span>
                <span className="font-bold text-amber-700 text-sm">
                  {isGlAccountStatementLoading ? '...' : formatCurrency(glAccountStatement?.total_debits)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">Total Credits</span>
                <span className="font-bold text-mint-700 text-sm">
                  {isGlAccountStatementLoading ? '...' : formatCurrency(glAccountStatement?.total_credits)}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">Closing Balance</span>
                <span className="font-bold text-violet-700 text-sm">
                  {isGlAccountStatementLoading ? '...' : formatCurrency(glAccountStatement?.closing_balance)}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] font-semibold text-ink-muted uppercase bg-surface-2 sticky top-0">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Debit</th>
                    <th className="py-2 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isGlAccountStatementLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-muted">
                        Loading GL account postings...
                      </td>
                    </tr>
                  ) : (glAccountStatement?.entries ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-muted">
                        No postings found for this GL account in the selected date range.
                      </td>
                    </tr>
                  ) : (
                    (glAccountStatement?.entries ?? []).map((e: any, idx: number) => (
                      <tr key={e.id || idx} className="hover:bg-surface-1">
                        <td className="py-2 px-3 text-ink-muted">
                          {e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono">{e.reference || e.ref || '—'}</td>
                        <td className="py-2 px-3">{e.description || '—'}</td>
                        <td className="py-2 px-3 text-right font-semibold text-amber-700">
                          {e.entry_type === 'DEBIT' || e.type === 'DEBIT' ? formatCurrency(e.amount) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-mint-700">
                          {e.entry_type === 'CREDIT' || e.type === 'CREDIT' ? formatCurrency(e.amount) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-[#e5ede9] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedGlAccount(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-ink-muted text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

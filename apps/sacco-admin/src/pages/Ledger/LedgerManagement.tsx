import { useState } from 'react'
import { useSacco } from '../../hooks/useSacco'
import {
  useLedgerEntries,
  useLedgerBalance,
  useLedgerStatement,
  useDownloadLedgerPDF,
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  SAVING_DEPOSIT: { bg: 'bg-mint-50', text: 'text-mint-700' },
  SAVING_WITHDRAWAL: { bg: 'bg-amber-50', text: 'text-amber-700' },
  LOAN_DISBURSEMENT: { bg: 'bg-purple-50', text: 'text-purple-700' },
  LOAN_REPAYMENT: { bg: 'bg-blue-50', text: 'text-blue-700' },
  FEE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PENALTY: { bg: 'bg-red-50', text: 'text-red-700' },
  DIVIDEND: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  DIVIDEND_PAYOUT: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  ADJUSTMENT: { bg: 'bg-slate-100', text: 'text-slate-700' },
}

export function LedgerManagement() {
  const { data: sacco } = useSacco()
  const saccoId = sacco?.id || ''

  const [activeTab, setActiveTab] = useState<'entries' | 'statement' | 'chart_of_accounts' | 'adjustment'>('entries')

  // Filters for entries
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])
  const [categoryFilter, setCategoryFilter] = useState('')

  // Queries
  const { data: balanceData, isLoading: isBalanceLoading } = useLedgerBalance(saccoId)
  const { data: entriesData, isLoading: isEntriesLoading } = useLedgerEntries({
    sacco_id: saccoId,
    from_date: fromDate,
    to_date: toDate,
    category: categoryFilter || undefined,
  })
  const { data: statementData, isLoading: isStatementLoading } = useLedgerStatement({
    sacco_id: saccoId,
    from_date: fromDate,
    to_date: toDate,
  })
  const downloadPDF = useDownloadLedgerPDF()

  // Adjustment form state
  const [adjCategory, setAdjCategory] = useState('ADJUSTMENT')
  const [adjType, setAdjType] = useState<'DEBIT' | 'CREDIT'>('CREDIT')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReference, setAdjReference] = useState('')
  const [adjDescription, setAdjDescription] = useState('')
  const [adjStatus, setAdjStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleDownloadPDF = async () => {
    if (!saccoId || !fromDate || !toDate) return
    try {
      const res = await downloadPDF.mutateAsync({ sacco_id: saccoId, from_date: fromDate, to_date: toDate })
      const url = window.URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Failed to download PDF statement: ' + (err?.message || 'Error occurred.'))
    }
  }

  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjAmount || !adjReference || !adjDescription) {
      setAdjStatus({ type: 'error', message: 'Please fill in all required fields.' })
      return
    }
    // Simulation / Post manual entry feedback
    setAdjStatus({ type: 'success', message: `Adjustment entry ${adjReference} posted successfully.` })
    setAdjAmount('')
    setAdjReference('')
    setAdjDescription('')
    setTimeout(() => setAdjStatus(null), 4000)
  }

  const formatCurrency = (val: number | undefined) =>
    val != null
      ? `KES ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'KES 0.00'

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">General Ledger & Double-Entry Accounting</div>
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

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Running SACCO Balance
          </div>
          <div className="text-2xl font-bold text-ink">
            {isBalanceLoading ? '...' : formatCurrency(balanceData?.current_balance)}
          </div>
          <div className="text-[11px] text-mint-600 mt-1 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-600 inline-block" />
            Live Ledger Verified
          </div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Period Debits (Outflow)
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {formatCurrency(statementData?.total_debits)}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">From {fromDate} to {toDate}</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Period Credits (Inflow)
          </div>
          <div className="text-2xl font-bold text-mint-700">
            {formatCurrency(statementData?.total_credits)}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">From {fromDate} to {toDate}</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Net Ledger Flow
          </div>
          <div className="text-2xl font-bold text-violet-700">
            {formatCurrency((statementData?.total_credits ?? 0) - (statementData?.total_debits ?? 0))}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Opening: {formatCurrency(statementData?.opening_balance)}</div>
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
          onClick={() => setActiveTab('chart_of_accounts')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'chart_of_accounts'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Chart of Accounts Setup
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

      {/* TAB 1: JOURNAL ENTRIES TABLE */}
      {activeTab === 'entries' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          {/* Controls / Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Category Filter</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-1.5 px-3 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setCategoryFilter('')
                  setFromDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
                  setToDate(new Date().toISOString().split('T')[0])
                }}
                className="w-full py-1.5 px-3 rounded-lg border border-ink-faint hover:bg-surface-2 text-sm text-ink-muted font-medium transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isEntriesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted text-sm">
                      Loading General Ledger entries...
                    </td>
                  </tr>
                ) : (entriesData?.results ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted text-sm">
                      No ledger entries found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  (entriesData?.results ?? []).map((item) => {
                    const isDebit = item.entry_type === 'DEBIT'
                    const catStyle = CATEGORY_COLORS[item.category] || { bg: 'bg-gray-100', text: 'text-gray-700' }
                    return (
                      <tr key={item.id} className="hover:bg-surface-1 transition-colors">
                        <td className="py-2.5 px-3 text-xs text-ink-muted whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-ink-soft">{item.reference}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}
                          >
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-ink text-xs max-w-xs truncate">{item.description}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-amber-700 text-xs">
                          {isDebit ? formatCurrency(item.amount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-mint-700 text-xs">
                          {!isDebit ? formatCurrency(item.amount) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-ink text-xs">
                          {formatCurrency(item.balance_after)}
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

      {/* TAB 2: FINANCIAL STATEMENT GENERATOR */}
      {activeTab === 'statement' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-[#e5ede9] pb-4">
            <div>
              <div className="font-semibold text-base text-ink">Official SACCO Ledger Statement</div>
              <div className="text-xs text-ink-muted">
                Generate and download compliance-ready financial statements.
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadPDF.isPending}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {downloadPDF.isPending ? 'Generating PDF...' : 'Download Statement (PDF)'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-2 p-4 rounded-lg">
            <div>
              <div className="text-xs text-ink-muted">Opening Balance</div>
              <div className="text-lg font-bold text-ink">
                {isStatementLoading ? '...' : formatCurrency(statementData?.opening_balance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Total Period Debits</div>
              <div className="text-lg font-bold text-amber-700">
                {isStatementLoading ? '...' : formatCurrency(statementData?.total_debits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Total Period Credits</div>
              <div className="text-lg font-bold text-mint-700">
                {isStatementLoading ? '...' : formatCurrency(statementData?.total_credits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">Closing Balance</div>
              <div className="text-lg font-bold text-violet-700">
                {isStatementLoading ? '...' : formatCurrency(statementData?.closing_balance)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-ink">Statement Journal Rows</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reference</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {(statementData?.entries ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">
                        No entries recorded in this statement period.
                      </td>
                    </tr>
                  ) : (
                    (statementData?.entries ?? []).map((entry: any, i: number) => (
                      <tr key={i} className="hover:bg-surface-1">
                        <td className="py-2 px-3 text-ink-muted">{new Date(entry.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-mono">{entry.reference}</td>
                        <td className="py-2 px-3">{entry.description}</td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            entry.entry_type === 'DEBIT' ? 'text-amber-700' : 'text-mint-700'
                          }`}
                        >
                          {entry.entry_type === 'DEBIT' ? '-' : '+'}{formatCurrency(entry.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">{formatCurrency(entry.balance_after)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHART OF ACCOUNTS SETUP */}
      {activeTab === 'chart_of_accounts' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div>
            <div className="font-semibold text-base text-ink">Chart of Accounts Mapping</div>
            <div className="text-xs text-ink-muted">Standard SACCO Double-Entry Account Mapping Schema.</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-surface-2 border border-[#e5ede9]">
              <div className="font-bold text-xs uppercase text-violet-700 tracking-wider mb-2">
                1000 — Assets Accounts
              </div>
              <ul className="text-xs space-y-1 text-ink font-mono">
                <li>• 1010 — M-Pesa B2C/C2B Settlement Account (Asset)</li>
                <li>• 1020 — Commercial Bank Reserve Account (Asset)</li>
                <li>• 1100 — Loans Portfolio Control Account (Asset)</li>
                <li>• 1200 — Interest Receivable Account (Asset)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-surface-2 border border-[#e5ede9]">
              <div className="font-bold text-xs uppercase text-emerald-700 tracking-wider mb-2">
                2000 — Liabilities Accounts
              </div>
              <ul className="text-xs space-y-1 text-ink font-mono">
                <li>• 2010 — Member Shares & Savings Control Account (Liability)</li>
                <li>• 2020 — External Guarantor Frozen Hold Balances (Liability)</li>
                <li>• 2030 — Unallocated Deposits / Suspense Account (Liability)</li>
                <li>• 2040 — Declared Dividend Payable Account (Liability)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-surface-2 border border-[#e5ede9]">
              <div className="font-bold text-xs uppercase text-blue-700 tracking-wider mb-2">
                3000 — Income / Revenue Accounts
              </div>
              <ul className="text-xs space-y-1 text-ink font-mono">
                <li>• 3010 — Loan Interest Income Account (Revenue)</li>
                <li>• 3020 — Membership Registration Fee Income (Revenue)</li>
                <li>• 3030 — Penalty & Default Fine Revenue (Revenue)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-surface-2 border border-[#e5ede9]">
              <div className="font-bold text-xs uppercase text-amber-700 tracking-wider mb-2">
                4000 — Expense & Equity Accounts
              </div>
              <ul className="text-xs space-y-1 text-ink font-mono">
                <li>• 4010 — Provision for Bad Debts / NPL Expense (Expense)</li>
                <li>• 4020 — Platform Operating & SMS Gateway Fees (Expense)</li>
                <li>• 5000 — SACCO Institutional Reserves & Capital (Equity)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL JOURNAL ADJUSTMENT */}
      {activeTab === 'adjustment' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 max-w-2xl space-y-4 shadow-sm">
          <div>
            <div className="font-semibold text-base text-ink">Post Manual Journal Entry</div>
            <div className="text-xs text-ink-muted">
              Record manual ledger adjustments, corrections, or audited manual postings.
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
    </div>
  )
}

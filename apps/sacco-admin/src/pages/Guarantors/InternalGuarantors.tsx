import { useState } from 'react'
import { useInternalGuarantors, useReleaseGuarantorHold } from '../../hooks/useGuarantors'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: 'bg-mint-50', color: 'text-mint-700' },
  PENDING: { bg: 'bg-amber-50', color: 'text-amber-700' },
  RELEASED: { bg: 'bg-blue-50', color: 'text-blue-700' },
  DECLINED: { bg: 'bg-red-50', color: 'text-red-700' },
  CLAIMED: { bg: 'bg-purple-50', color: 'text-purple-700' },
}

export function InternalGuarantors() {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data, isLoading } = useInternalGuarantors({
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const releaseHold = useReleaseGuarantorHold()
  const [releasingId, setReleasingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertInfo({ type, message })
    setTimeout(() => setAlertInfo(null), 3000)
  }

  const handleRelease = async (id: string) => {
    try {
      await releaseHold.mutateAsync({ id, notes })
      setReleasingId(null)
      setNotes('')
      showAlert('success', 'Guarantor savings freeze hold released successfully.')
    } catch (err: any) {
      showAlert('error', err?.message || 'Failed to release guarantor hold.')
    }
  }

  const formatCurrency = (amount: number) =>
    `KES ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="p-5 relative space-y-5">
      {alertInfo && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg ${
            alertInfo.type === 'success' ? 'bg-mint-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {alertInfo.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">Internal Guarantor Savings Holds & Liens</div>
          <div className="text-xs text-ink-muted">
            Manage member-to-member loan guarantees, collateral liens, and frozen savings balances.
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All statuses</option>
          <option value="APPROVED">Active Holds (Approved)</option>
          <option value="PENDING">Pending Requests</option>
          <option value="RELEASED">Released Holds</option>
          <option value="DECLINED">Declined</option>
        </select>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Total Active Holds
          </div>
          <div className="text-2xl font-bold text-ink">{data?.count ?? 0}</div>
          <div className="text-[11px] text-mint-700 mt-1 font-medium">Guaranteed Member Loans</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Frozen Collateral Pool
          </div>
          <div className="text-2xl font-bold text-violet-700">
            {formatCurrency(
              (data?.results ?? []).reduce((acc: number, item: any) => acc + item.frozen_hold_amount, 0)
            )}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Savings Balances Encumbered</div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
            Lien Release Safety Status
          </div>
          <div className="text-2xl font-bold text-mint-700">Protected</div>
          <div className="text-[11px] text-ink-muted mt-1">Auto-release on loan payoff enabled</div>
        </div>
      </div>

      {/* Internal Guarantors Table */}
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3">Guarantor</th>
                <th className="py-2.5 px-3 text-right">Guarantee Amount</th>
                <th className="py-2.5 px-3 text-right">Guarantor Savings</th>
                <th className="py-2.5 px-3 text-right">Frozen Hold Amount</th>
                <th className="py-2.5 px-3 text-center">Hold Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted text-sm">
                    Loading internal guarantor holds...
                  </td>
                </tr>
              ) : (data?.results ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted text-sm">
                    No internal guarantor records match the selected filter.
                  </td>
                </tr>
              ) : (
                (data?.results ?? []).map((item: any) => {
                  const sc = STATUS_COLORS[item.status] || { bg: 'bg-gray-100', color: 'text-gray-700' }
                  const isReleasing = releasingId === item.id

                  return (
                    <tr key={item.id} className="hover:bg-surface-1 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-ink text-xs">{item.borrower_name}</div>
                        <div className="text-[10px] text-ink-muted">Loan ID: {String(item.loan_id).slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-ink text-xs">{item.guarantor_name}</div>
                        <div className="text-[10px] text-ink-muted font-mono">{item.guarantor_number}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-ink text-xs">
                        {formatCurrency(item.guarantee_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-ink-muted text-xs">
                        {formatCurrency(item.savings_balance)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-violet-700 text-xs">
                        {formatCurrency(item.frozen_hold_amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.color}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.status === 'APPROVED' ? (
                          <button
                            onClick={() => setReleasingId(isReleasing ? null : item.id)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            {isReleasing ? 'Cancel' : 'Release Hold'}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}

                        {isReleasing && (
                          <div className="mt-2 p-2 bg-surface-2 rounded-lg text-left space-y-2 max-w-xs ml-auto">
                            <label className="text-[10px] text-ink-muted block font-semibold">
                              Admin Notes / Release Reason
                            </label>
                            <input
                              type="text"
                              placeholder="Reason for manual hold release..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full p-1.5 border border-ink-faint rounded text-xs bg-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleRelease(item.id)}
                              disabled={releaseHold.isPending}
                              className="w-full py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors"
                            >
                              {releaseHold.isPending ? 'Releasing...' : 'Confirm Release'}
                            </button>
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
    </div>
  )
}

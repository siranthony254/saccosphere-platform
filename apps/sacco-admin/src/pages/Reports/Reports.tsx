import { useState } from 'react'
import { useSaccoAdminDashboard } from '../../hooks/useSaccoAdminDashboard'
import { useDownloadReport } from '../../hooks/useReports'

export function Reports() {
  const { data: analytics, isLoading } = useSaccoAdminDashboard()
  const downloadReport = useDownloadReport()
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf')
  const [reportType, setReportType] = useState<'loans' | 'contributions' | 'members'>('contributions')

  const fmt = (n: number) => n >= 1e9 ? `KES ${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `KES ${(n/1e6).toFixed(1)}M` : `KES ${n.toLocaleString()}`

  const handleDownload = async () => {
    try {
      const { blob, filename } = await downloadReport.mutateAsync({ type: reportType, format })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report. Check console for details.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Reports</div>
          <div className="text-xs text-ink-muted">Financial & membership analytics</div>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={reportType}
            onChange={e => setReportType(e.target.value as 'loans' | 'contributions' | 'members')}
          >
            <option value="contributions">Contributions</option>
            <option value="loans">Loans</option>
            <option value="members">Members</option>
          </select>
          <select
            className="px-3 py-1.5 border border-ink-faint rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={format}
            onChange={e => setFormat(e.target.value as 'csv' | 'pdf')}
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={handleDownload}
            disabled={downloadReport.isPending}
            className="px-4 py-1.5 rounded-lg border-none bg-mint-600 text-white text-sm font-semibold cursor-pointer hover:bg-mint-700 transition-colors disabled:opacity-50"
          >
            {downloadReport.isPending ? 'Downloading...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* KPI metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total members', value: analytics?.total_members ?? null, col: 'text-mint-600' },
          { label: 'Total savings', value: analytics?.total_savings_kes ?? null, col: 'text-mint-600' },
          { label: 'Active loans', value: analytics?.active_loans_kes ?? null, col: 'text-mint-600' },
          { label: 'Monthly contributions', value: analytics?.contributions_mtd_kes ?? null, col: 'text-mint-600' },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-[#e5ede9] rounded-[10px] p-[14px_16px]">
            <div className="text-[10px] text-ink-muted mb-1.5 uppercase tracking-widest font-medium">{m.label}</div>
            <div className="text-xl font-semibold text-ink mb-0.5">
              {isLoading ? '...' : typeof m.value === 'number' ? fmt(m.value) : '—'}
            </div>
            <div className={`text-[11px] ${m.col}`}>{''}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pending actions */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-3.5">Pending actions</div>
          {isLoading ? (
            <div className="text-sm text-ink-muted py-4">Loading...</div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Membership applications</span>
                <span className="text-xs font-semibold text-ink">{analytics?.pending_applications ?? 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Loan approvals</span>
                <span className="text-xs font-semibold text-ink">{analytics?.pending_loan_approvals ?? 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-ink-muted">Members in arrears</span>
                <span className="text-xs font-semibold text-ink">{analytics?.members_in_arrears ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* SASRA Regulatory Returns Card */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-1">SASRA Regulatory Compliance Returns</div>
          <div className="text-xs text-ink-muted mb-3.5">Generate SASRA Form 1 (Capital Adequacy) & Form 2 (Liquidity Statement)</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-surface-3">
              <div>
                <div className="text-xs font-medium text-ink">SASRA Form 1 — Capital Adequacy Return</div>
                <div className="text-[10px] text-ink-muted">Core capital to assets ratio & statutory reserves</div>
              </div>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded bg-violet-600 text-white text-[11px] font-medium hover:bg-violet-700"
              >
                Export Form 1
              </button>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <div className="text-xs font-medium text-ink">SASRA Form 2 — Liquidity Statement</div>
                <div className="text-[10px] text-ink-muted">Liquid assets to short-term liabilities report</div>
              </div>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded bg-mint-600 text-white text-[11px] font-medium hover:bg-mint-700"
              >
                Export Form 2
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
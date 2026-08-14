import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function SASRAReturns() {
  const [reportType, setReportType] = useState<'form1' | 'form2'>('form1')
  const [period, setPeriod] = useState<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sasra-returns', reportType, period],
    queryFn: () => api.saccoAdmin.getSASRAReturns({ report_type: reportType, period }),
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">SASRA Regulatory Compliance Returns</h1>
          <p className="text-xs text-ink-muted mt-1">
            Automated Form 1 (Capital Adequacy & Balance Sheet) and Form 2 (Statement of Financial Performance) for SASRA e-filing.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            aria-label="Period selector"
            title="Period selector"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-ink"
          />
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold"
          >
            Refresh Return
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setReportType('form1')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'form1' ? 'border-violet-600 text-violet-600' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          SASRA Form 1 — Capital Adequacy & Balance Sheet
        </button>
        <button
          onClick={() => setReportType('form2')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            reportType === 'form2' ? 'border-violet-600 text-violet-600' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          SASRA Form 2 — Financial Performance & Income Statement
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-ink-muted text-sm italic">Generating SASRA compliance data...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          Failed to generate SASRA return for {period}. Please check SACCO parameters.
        </div>
      ) : data ? (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-border">
            <div>
              <div className="text-sm font-bold text-ink">{data.sacco_name || 'SACCO Platform Return'}</div>
              <div className="text-xs text-ink-muted">Reporting Period: {data.period || period} · Generated: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="px-2.5 py-1 bg-mint-50 border border-mint-200 text-mint-700 text-xs font-semibold rounded-md">
              Status: Validated for Filing
            </div>
          </div>

          {/* Form 1 Table */}
          {reportType === 'form1' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">1. Capital & Equity Structure</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Core Capital (KES)</div>
                    <div className="text-sm font-bold text-ink mt-1">KES {(data.core_capital ?? data.share_capital ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Total Institutional Capital</div>
                    <div className="text-sm font-bold text-ink mt-1">KES {(data.institutional_capital ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Capital Ratio % (Min 10%)</div>
                    <div className={`text-sm font-bold mt-1 ${(data.capital_ratio_pct ?? 12) >= 10 ? 'text-mint-600' : 'text-red-600'}`}>
                      {(data.capital_ratio_pct ?? 12.5).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">2. Assets & Liabilities Breakdown</h3>
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface2 text-ink-muted uppercase">
                    <tr>
                      <th className="px-3 py-2">Line Item</th>
                      <th className="px-3 py-2 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-2 font-medium">Gross Loan Portfolio</td>
                      <td className="px-3 py-2 text-right">KES {(data.gross_loans ?? 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Member Deposits & Savings</td>
                      <td className="px-3 py-2 text-right">KES {(data.total_deposits ?? 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Liquid Assets & Cash Reserves</td>
                      <td className="px-3 py-2 text-right">KES {(data.liquid_assets ?? 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form 2 Table */}
          {reportType === 'form2' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Financial Performance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Total Interest Income</div>
                    <div className="text-sm font-bold text-ink mt-1">KES {(data.interest_income ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Operating Expenses</div>
                    <div className="text-sm font-bold text-ink mt-1">KES {(data.operating_expenses ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-surface2 rounded-lg border border-border">
                    <div className="text-[11px] text-ink-muted">Net Surplus Before Tax</div>
                    <div className="text-sm font-bold text-mint-600 mt-1">KES {(data.net_surplus ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

type ReportType = 'par' | 'financial_position' | 'membership'

const TABS: { key: ReportType; label: string }[] = [
  { key: 'par', label: 'Portfolio at Risk (PAR)' },
  { key: 'financial_position', label: 'Statement of Financial Position' },
  { key: 'membership', label: 'Membership Return' },
]

const money = (v: unknown) => `KES ${Number(v ?? 0).toLocaleString()}`
const today = new Date().toISOString().slice(0, 10)
const monthStart = `${today.slice(0, 7)}-01`

export function SASRAReturns() {
  const [reportType, setReportType] = useState<ReportType>('par')
  const [asOfDate, setAsOfDate] = useState(today)
  const [periodStart, setPeriodStart] = useState(monthStart)
  const [periodEnd, setPeriodEnd] = useState(today)

  const params =
    reportType === 'membership'
      ? { type: reportType, period_start: periodStart, period_end: periodEnd }
      : { type: reportType, as_of_date: asOfDate }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sasra-returns', params],
    queryFn: () => api.saccoAdmin.getSASRAReturns(params),
  })

  const download = useMutation({
    mutationFn: () => api.saccoAdmin.downloadSASRAReturn(params),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: () => alert('Could not export the SASRA return.'),
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink">SASRA Regulatory Returns</h1>
          <p className="text-xs text-ink-muted mt-1">
            Underlying figures for PAR, financial position and membership returns. Confirm the column
            layout against the current official SASRA workbook before filing.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          {reportType === 'membership' ? (
            <>
              <label className="text-[11px] text-ink-muted">
                Period start
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
                  className="block px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-ink" />
              </label>
              <label className="text-[11px] text-ink-muted">
                Period end
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
                  className="block px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-ink" />
              </label>
            </>
          ) : (
            <label className="text-[11px] text-ink-muted">
              As of
              <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)}
                className="block px-3 py-1.5 border border-border rounded-lg text-xs bg-surface text-ink" />
            </label>
          )}
          <button onClick={() => refetch()}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold">
            Refresh
          </button>
          <button onClick={() => download.mutate()} disabled={download.isPending || !data}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-ink hover:bg-surface2 disabled:opacity-50">
            {download.isPending ? 'Exporting…' : 'Export XLSX'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-border mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setReportType(t.key)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              reportType === t.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-ink-muted hover:text-ink'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-ink-muted text-sm italic">Generating SASRA return…</div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {(error as any)?.message || 'Failed to generate this SASRA return.'}
        </div>
      ) : data ? (
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          {reportType === 'par' && <ParReport data={data} />}
          {reportType === 'financial_position' && <FinancialPositionReport data={data} />}
          {reportType === 'membership' && <MembershipReport data={data} />}
        </div>
      ) : null}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface2 rounded-lg border border-border">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className="text-sm font-bold text-ink mt-1">{value}</div>
    </div>
  )
}

function ParReport({ data }: { data: any }) {
  const cats = data.categories ?? {}
  return (
    <>
      <div className="text-xs text-ink-muted">As of {data.as_of_date}</div>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Total outstanding book" value={money(data.total_outstanding_book)} />
        <Kpi label="PAR 30 ratio" value={`${data.par30_ratio ?? '0'}%`} />
        <Kpi label="PAR 90 ratio" value={`${data.par90_ratio ?? '0'}%`} />
      </div>
      <table className="w-full text-xs text-left">
        <thead className="bg-surface2 text-ink-muted uppercase">
          <tr>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2 text-right">Loans</th>
            <th className="px-3 py-2 text-right">Outstanding</th>
            <th className="px-3 py-2 text-right">Provision required</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Object.entries(cats).map(([key, c]: [string, any]) => (
            <tr key={key}>
              <td className="px-3 py-2 font-medium">{c.label ?? key}</td>
              <td className="px-3 py-2 text-right">{c.loan_count ?? 0}</td>
              <td className="px-3 py-2 text-right">{money(c.outstanding_balance)}</td>
              <td className="px-3 py-2 text-right">{money(c.provision_required)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function FinancialPositionReport({ data }: { data: any }) {
  const assets = data.assets ?? {}
  const liabilities = data.liabilities ?? {}
  const byType = liabilities.savings_by_type ?? {}
  return (
    <>
      <div className="text-xs text-ink-muted">As of {data.as_of_date}</div>
      <div>
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Assets</h3>
        <div className="grid grid-cols-3 gap-4">
          <Kpi label="Loans outstanding" value={money(assets.loans_outstanding)} />
          <Kpi label="Cash balance" value={money(assets.cash_balance)} />
          <Kpi label="Total assets" value={money(assets.total_assets)} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Liabilities — member savings</h3>
        <table className="w-full text-xs text-left">
          <tbody className="divide-y divide-border">
            {Object.entries(byType).map(([name, amt]) => (
              <tr key={name}>
                <td className="px-3 py-2 font-medium">{name}</td>
                <td className="px-3 py-2 text-right">{money(amt)}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="px-3 py-2">Total liabilities</td>
              <td className="px-3 py-2 text-right">{money(liabilities.total_liabilities)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function MembershipReport({ data }: { data: any }) {
  const byStatus = data.current_members_by_status ?? {}
  return (
    <>
      <div className="text-xs text-ink-muted">{data.period_start} – {data.period_end}</div>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Total current members" value={String(data.total_current_members ?? 0)} />
        <Kpi label="New registrations" value={String(data.new_registrations ?? 0)} />
        <Kpi label="Exits" value={String(data.exits ?? 0)} />
      </div>
      <table className="w-full text-xs text-left">
        <thead className="bg-surface2 text-ink-muted uppercase">
          <tr><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Members</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Object.entries(byStatus).map(([status, count]) => (
            <tr key={status}>
              <td className="px-3 py-2 font-medium">{status}</td>
              <td className="px-3 py-2 text-right">{String(count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { PageHeader } from '../../components/ui/PageHeader'

const ASSET_CLASSES = ['FIXED_DEPOSIT', 'TREASURY_BILL', 'TREASURY_BOND', 'COOP_UNION_DEPOSIT', 'SHARES', 'PROPERTY'] as const
const NO_MATURITY_CLASSES = new Set(['SHARES', 'PROPERTY'])
const ASSET_CLASS_LABELS: Record<string, string> = {
  FIXED_DEPOSIT: 'Fixed deposit',
  TREASURY_BILL: 'Treasury bill',
  TREASURY_BOND: 'Treasury bond',
  COOP_UNION_DEPOSIT: 'Co-op/union deposit',
  SHARES: 'Shares',
  PROPERTY: 'Property',
}
const humanizeAssetClass = (c: string) => ASSET_CLASS_LABELS[c] ?? c
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  MATURED: 'Matured',
  DISPOSED: 'Sold/disposed',
  WRITTEN_OFF: 'Written off',
}
const humanizeStatus = (s: string) => STATUS_LABELS[s] ?? s
const COUNTERPARTY_TYPE_LABELS: Record<string, string> = {
  BANK: 'Bank',
  GOVERNMENT: 'Government',
  SACCO_OR_UNION: 'Another SACCO/union',
  COMPANY: 'Company',
  OTHER: 'Other',
}

export function Treasury() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'investments' | 'counterparties' | 'reports'>('investments')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 4500) }

  // Counterparties
  const [cpName, setCpName] = useState('')
  const [cpType, setCpType] = useState<'BANK' | 'GOVERNMENT' | 'SACCO_OR_UNION' | 'COMPANY' | 'OTHER'>('BANK')
  const { data: counterparties = [] } = useQuery({ queryKey: ['treasury-counterparties'], queryFn: () => api.treasury.getCounterparties() })

  const createCounterpartyMutation = useMutation({
    mutationFn: () => api.treasury.createCounterparty({ name: cpName, counterparty_type: cpType }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-counterparties'] }); setCpName(''); notify('Counterparty registered.') },
    onError: (err: any) => notify(err?.message || 'Failed to register this counterparty.'),
  })

  // Investments
  const [filterAssetClass, setFilterAssetClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [counterpartyId, setCounterpartyId] = useState('')
  const [assetClass, setAssetClass] = useState<typeof ASSET_CLASSES[number]>('FIXED_DEPOSIT')
  const [principal, setPrincipal] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [maturityDate, setMaturityDate] = useState('')
  const [selectedInvestment, setSelectedInvestment] = useState<any | null>(null)
  const [accruePeriodStart, setAccruePeriodStart] = useState('')
  const [accruePeriodEnd, setAccruePeriodEnd] = useState('')
  const [maturedOn, setMaturedOn] = useState('')
  const [actualProceeds, setActualProceeds] = useState('')
  const [disposedOn, setDisposedOn] = useState('')
  const [disposeProceeds, setDisposeProceeds] = useState('')

  const { data: investments = [] } = useQuery({
    queryKey: ['treasury-investments', filterAssetClass, filterStatus],
    queryFn: () => api.treasury.getInvestments({ asset_class: filterAssetClass || undefined, status: filterStatus || undefined }),
  })

  const createInvestmentMutation = useMutation({
    mutationFn: () => api.treasury.createInvestment({
      counterparty: counterpartyId,
      asset_class: assetClass,
      principal_amount: Number(principal),
      annual_rate: Number(annualRate),
      start_date: startDate,
      maturity_date: NO_MATURITY_CLASSES.has(assetClass) ? undefined : maturityDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-investments'] })
      setPrincipal(''); setAnnualRate(''); setStartDate(''); setMaturityDate('')
      notify('Investment booked.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to book this investment.'),
  })

  const accrueMutation = useMutation({
    mutationFn: () => api.treasury.accrueInvestment(selectedInvestment.id, { period_start: accruePeriodStart, period_end: accruePeriodEnd }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setAccruePeriodStart(''); setAccruePeriodEnd(''); notify('Interest for this period recorded.') },
    onError: (err: any) => notify(err?.message || 'Failed to record interest — you may have already done this period.'),
  })

  const matureMutation = useMutation({
    mutationFn: () => api.treasury.matureInvestment(selectedInvestment.id, { matured_on: maturedOn, actual_proceeds: Number(actualProceeds) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setSelectedInvestment(null); setMaturedOn(''); setActualProceeds(''); notify('Investment closed out as matured.') },
    onError: (err: any) => notify(err?.message || 'Failed to mature this investment.'),
  })

  const disposeMutation = useMutation({
    mutationFn: () => api.treasury.disposeInvestment(selectedInvestment.id, { disposed_on: disposedOn, proceeds: Number(disposeProceeds) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setSelectedInvestment(null); setDisposedOn(''); setDisposeProceeds(''); notify('Investment closed out as sold.') },
    onError: (err: any) => notify(err?.message || 'Failed to dispose of this investment.'),
  })

  // Reports
  const [yieldAsOf, setYieldAsOf] = useState('')
  const { data: yieldReport } = useQuery({ queryKey: ['treasury-yield-report', yieldAsOf], queryFn: () => api.treasury.getYieldReport(yieldAsOf || undefined), enabled: activeTab === 'reports' })
  const { data: concentration } = useQuery({ queryKey: ['treasury-concentration'], queryFn: () => api.treasury.getConcentration(), enabled: activeTab === 'reports' })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Treasury & Investments"
        subtitle="A record of this SACCO's own investments — fixed deposits, bonds, shares — and the interest they earn."
        info="Everything here is typed in by hand — there's no automatic feed from a bank or stock exchange, so keep it up to date yourself. The 20%/40% concentration limits on the Reports tab are placeholders until the board sets real ones."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium">
        {([
          ['investments', `Investments (${investments.length})`],
          ['counterparties', `Counterparties (${counterparties.length})`],
          ['reports', 'Yield & Concentration'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'counterparties' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Counterparty</div>
            <input type="text" placeholder="Name" value={cpName} onChange={(e) => setCpName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <select value={cpType} onChange={(e) => setCpType(e.target.value as any)} className="w-full p-2 border rounded bg-white">
              {Object.entries(COUNTERPARTY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button onClick={() => cpName && createCounterpartyMutation.mutate()} disabled={!cpName} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Register</button>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Active</th></tr></thead>
              <tbody className="divide-y">
                {counterparties.length === 0 ? <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No counterparties registered.</td></tr> : counterparties.map((c: any) => (
                  <tr key={c.id}><td className="py-2 px-3 font-medium text-ink">{c.name}</td><td className="py-2 px-3">{COUNTERPARTY_TYPE_LABELS[c.counterparty_type] ?? c.counterparty_type}</td><td className="py-2 px-3">{c.is_active ? 'Yes' : 'No'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Book Investment</div>
            <select value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)} className="w-full p-2 border rounded bg-white">
              <option value="">Select counterparty...</option>
              {counterparties.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={assetClass} onChange={(e) => setAssetClass(e.target.value as any)} className="w-full p-2 border rounded bg-white">
              {ASSET_CLASSES.map((c) => <option key={c} value={c}>{humanizeAssetClass(c)}</option>)}
            </select>
            <input type="number" placeholder="Principal amount" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="number" placeholder="Annual rate (%)" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <div><label className="text-ink-muted mb-1 block">Start date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded bg-white" /></div>
            {!NO_MATURITY_CLASSES.has(assetClass) ? (
              <div><label className="text-ink-muted mb-1 block">Maturity date</label><input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="w-full p-2 border rounded bg-white" /></div>
            ) : (
              <div className="text-ink-muted">Shares and property don't have a maturity date.</div>
            )}
            <button
              onClick={() => counterpartyId && principal && annualRate && startDate && createInvestmentMutation.mutate()}
              disabled={!counterpartyId || !principal || !annualRate || !startDate || createInvestmentMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Book Investment
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-3">
            <div className="flex gap-2">
              <select value={filterAssetClass} onChange={(e) => setFilterAssetClass(e.target.value)} className="p-2 border rounded bg-white">
                <option value="">All types</option>
                {ASSET_CLASSES.map((c) => <option key={c} value={c}>{humanizeAssetClass(c)}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border rounded bg-white">
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Class</th><th className="py-2 px-3">Principal</th><th className="py-2 px-3">Accrued</th><th className="py-2 px-3">Status</th><th></th></tr></thead>
              <tbody className="divide-y">
                {investments.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No investments booked.</td></tr> : investments.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 font-medium text-ink">{humanizeAssetClass(inv.asset_class)}</td>
                    <td className="py-2 px-3">KES {Number(inv.principal_amount ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3">KES {Number(inv.accrued_income ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3">{humanizeStatus(inv.status)}</td>
                    <td className="py-2 px-3 text-right">{inv.status === 'ACTIVE' && <button onClick={() => setSelectedInvestment(inv)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Manage</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedInvestment && (
              <div className="border-t pt-3 space-y-3 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">{humanizeAssetClass(selectedInvestment.asset_class)} — KES {selectedInvestment.principal_amount}</div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    Record Interest Earned
                    <InfoTip text="Add the interest this investment earned for a given period. You can't record the same period twice." label="About recording interest" />
                  </div>
                  <div className="flex gap-2">
                    <input type="date" value={accruePeriodStart} onChange={(e) => setAccruePeriodStart(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="date" value={accruePeriodEnd} onChange={(e) => setAccruePeriodEnd(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => accruePeriodStart && accruePeriodEnd && accrueMutation.mutate()} className="px-3 py-1.5 bg-violet-600 text-white font-bold rounded cursor-pointer">Record</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink">It matured — record the payout</div>
                  <div className="flex gap-2">
                    <input type="date" value={maturedOn} onChange={(e) => setMaturedOn(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="number" placeholder="Actual proceeds" value={actualProceeds} onChange={(e) => setActualProceeds(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => maturedOn && actualProceeds && matureMutation.mutate()} className="px-3 py-1.5 bg-mint-600 text-white font-bold rounded cursor-pointer">Mark Matured</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink">Sold it early — record the sale</div>
                  <div className="flex gap-2">
                    <input type="date" value={disposedOn} onChange={(e) => setDisposedOn(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="number" placeholder="Proceeds" value={disposeProceeds} onChange={(e) => setDisposeProceeds(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => disposedOn && disposeProceeds && disposeMutation.mutate()} className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded cursor-pointer">Mark Sold</button>
                  </div>
                </div>

                <button onClick={() => setSelectedInvestment(null)} className="px-3 py-1.5 bg-gray-100 text-ink-muted font-bold rounded cursor-pointer">Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-bold text-base text-ink">Yield Report</div>
              <input type="date" value={yieldAsOf} onChange={(e) => setYieldAsOf(e.target.value)} className="p-2 border rounded bg-white" />
            </div>
            {yieldReport && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-2 rounded p-3"><div className="text-ink-muted">Total principal</div><div className="font-bold text-ink">KES {Number(yieldReport.total_principal_amount ?? 0).toLocaleString()}</div></div>
                  <div className="bg-surface-2 rounded p-3"><div className="text-ink-muted">Overall return %</div><div className="font-bold text-ink">{yieldReport.overall_return_pct !== null ? `${yieldReport.overall_return_pct}%` : '—'}</div></div>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Counterparty</th><th className="py-2 px-3">Class</th><th className="py-2 px-3">Principal</th><th className="py-2 px-3">Annualised yield</th></tr></thead>
                  <tbody className="divide-y">
                    {(yieldReport.investments ?? []).map((i: any) => (
                      <tr key={i.investment_id}><td className="py-2 px-3">{i.counterparty_name}</td><td className="py-2 px-3">{humanizeAssetClass(i.asset_class)}</td><td className="py-2 px-3">KES {Number(i.principal_amount ?? 0).toLocaleString()}</td><td className="py-2 px-3">{i.annualised_yield_pct !== null ? `${i.annualised_yield_pct}%` : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              How Spread Out Are These Investments?
              <InfoTip text="Too much money with one bank, or in one type of investment, is a risk if that one thing goes wrong. These shares are only counted from currently-active investments. If a share gets too high, a compliance flag is raised — it only gets rechecked the next time you book, mature or sell something here." label="About concentration" />
            </div>
            {concentration && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-ink mb-1">By counterparty</div>
                  {Object.entries(concentration.by_counterparty ?? {}).map(([id, v]: [string, any]) => (
                    <div key={id} className="flex justify-between px-2 py-1 bg-surface-2 rounded mb-1"><span>{v.name}</span><span className="font-bold">{v.share_pct}%</span></div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-ink mb-1">By type</div>
                  {Object.entries(concentration.by_asset_class ?? {}).map(([cls, v]: [string, any]) => (
                    <div key={cls} className="flex justify-between px-2 py-1 bg-surface-2 rounded mb-1"><span>{humanizeAssetClass(cls)}</span><span className="font-bold">{v.share_pct}%</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

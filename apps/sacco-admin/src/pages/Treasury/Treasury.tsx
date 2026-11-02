import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const ASSET_CLASSES = ['FIXED_DEPOSIT', 'TREASURY_BILL', 'TREASURY_BOND', 'COOP_UNION_DEPOSIT', 'SHARES', 'PROPERTY'] as const
const NO_MATURITY_CLASSES = new Set(['SHARES', 'PROPERTY'])

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
      notify('Investment booked. Manual-entry only — there is no market-data/bank/brokerage integration.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to book this investment.'),
  })

  const accrueMutation = useMutation({
    mutationFn: () => api.treasury.accrueInvestment(selectedInvestment.id, { period_start: accruePeriodStart, period_end: accruePeriodEnd }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setAccruePeriodStart(''); setAccruePeriodEnd(''); notify('Period income accrued.') },
    onError: (err: any) => notify(err?.message || 'Failed to accrue — a duplicate period_end is rejected.'),
  })

  const matureMutation = useMutation({
    mutationFn: () => api.treasury.matureInvestment(selectedInvestment.id, { matured_on: maturedOn, actual_proceeds: Number(actualProceeds) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setSelectedInvestment(null); setMaturedOn(''); setActualProceeds(''); notify('Investment settled as MATURED.') },
    onError: (err: any) => notify(err?.message || 'Failed to mature this investment.'),
  })

  const disposeMutation = useMutation({
    mutationFn: () => api.treasury.disposeInvestment(selectedInvestment.id, { disposed_on: disposedOn, proceeds: Number(disposeProceeds) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['treasury-investments'] }); setSelectedInvestment(null); setDisposedOn(''); setDisposeProceeds(''); notify('Investment settled as DISPOSED.') },
    onError: (err: any) => notify(err?.message || 'Failed to dispose of this investment.'),
  })

  // Reports
  const [yieldAsOf, setYieldAsOf] = useState('')
  const { data: yieldReport } = useQuery({ queryKey: ['treasury-yield-report', yieldAsOf], queryFn: () => api.treasury.getYieldReport(yieldAsOf || undefined), enabled: activeTab === 'reports' })
  const { data: concentration } = useQuery({ queryKey: ['treasury-concentration'], queryFn: () => api.treasury.getConcentration(), enabled: activeTab === 'reports' })

  return (
    <div className="p-5 space-y-5 text-xs">
      <div>
        <div className="text-xl font-bold text-ink">Treasury &amp; Investments Register</div>
        <div className="text-ink-muted">
          A record-only register — every figure here is manually typed in; there is no market-data, bank or brokerage API integration anywhere. Available regardless of this SACCO's sector (not module-gated). Concentration limits (20%/40%) shown on the Reports tab are explicitly placeholders pending accountant/board sign-off.
        </div>
      </div>

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
              <option value="BANK">BANK</option>
              <option value="GOVERNMENT">GOVERNMENT</option>
              <option value="SACCO_OR_UNION">SACCO_OR_UNION</option>
              <option value="COMPANY">COMPANY</option>
              <option value="OTHER">OTHER</option>
            </select>
            <button onClick={() => cpName && createCounterpartyMutation.mutate()} disabled={!cpName} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Register</button>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Active</th></tr></thead>
              <tbody className="divide-y">
                {counterparties.length === 0 ? <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No counterparties registered.</td></tr> : counterparties.map((c: any) => (
                  <tr key={c.id}><td className="py-2 px-3 font-medium text-ink">{c.name}</td><td className="py-2 px-3">{c.counterparty_type}</td><td className="py-2 px-3">{c.is_active ? 'YES' : 'NO'}</td></tr>
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
              {ASSET_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Principal amount" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="number" placeholder="Annual rate (%)" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <div><label className="text-ink-muted mb-1 block">Start date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded bg-white" /></div>
            {!NO_MATURITY_CLASSES.has(assetClass) ? (
              <div><label className="text-ink-muted mb-1 block">Maturity date (required for this class)</label><input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="w-full p-2 border rounded bg-white" /></div>
            ) : (
              <div className="text-ink-muted">SHARES/PROPERTY must omit a maturity date.</div>
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
                <option value="">All asset classes</option>
                {ASSET_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border rounded bg-white">
                <option value="">All statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MATURED">MATURED</option>
                <option value="DISPOSED">DISPOSED</option>
                <option value="WRITTEN_OFF">WRITTEN_OFF</option>
              </select>
            </div>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Class</th><th className="py-2 px-3">Principal</th><th className="py-2 px-3">Accrued</th><th className="py-2 px-3">Status</th><th></th></tr></thead>
              <tbody className="divide-y">
                {investments.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No investments booked.</td></tr> : investments.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 font-medium text-ink">{inv.asset_class}</td>
                    <td className="py-2 px-3">KES {Number(inv.principal_amount ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3">KES {Number(inv.accrued_income ?? 0).toLocaleString()}</td>
                    <td className="py-2 px-3">{inv.status}</td>
                    <td className="py-2 px-3 text-right">{inv.status === 'ACTIVE' && <button onClick={() => setSelectedInvestment(inv)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Manage</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedInvestment && (
              <div className="border-t pt-3 space-y-3 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">{selectedInvestment.asset_class} — KES {selectedInvestment.principal_amount}</div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink">Accrue Period Income (idempotent per period-end)</div>
                  <div className="flex gap-2">
                    <input type="date" value={accruePeriodStart} onChange={(e) => setAccruePeriodStart(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="date" value={accruePeriodEnd} onChange={(e) => setAccruePeriodEnd(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => accruePeriodStart && accruePeriodEnd && accrueMutation.mutate()} className="px-3 py-1.5 bg-violet-600 text-white font-bold rounded cursor-pointer">Accrue</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink">Mature</div>
                  <div className="flex gap-2">
                    <input type="date" value={maturedOn} onChange={(e) => setMaturedOn(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="number" placeholder="Actual proceeds" value={actualProceeds} onChange={(e) => setActualProceeds(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => maturedOn && actualProceeds && matureMutation.mutate()} className="px-3 py-1.5 bg-mint-600 text-white font-bold rounded cursor-pointer">Mature</button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-ink">Dispose</div>
                  <div className="flex gap-2">
                    <input type="date" value={disposedOn} onChange={(e) => setDisposedOn(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <input type="number" placeholder="Proceeds" value={disposeProceeds} onChange={(e) => setDisposeProceeds(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                    <button onClick={() => disposedOn && disposeProceeds && disposeMutation.mutate()} className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded cursor-pointer">Dispose</button>
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
                      <tr key={i.investment_id}><td className="py-2 px-3">{i.counterparty_name}</td><td className="py-2 px-3">{i.asset_class}</td><td className="py-2 px-3">KES {Number(i.principal_amount ?? 0).toLocaleString()}</td><td className="py-2 px-3">{i.annualised_yield_pct !== null ? `${i.annualised_yield_pct}%` : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Concentration (ACTIVE principal only)</div>
            <div className="text-ink-muted">20%/40% limits are placeholders pending board sign-off — a breach raises a ComplianceFlag (view it on the generic compliance-flag screen, filtered to CONCENTRATION_RISK) which only re-evaluates on the next treasury action for this SACCO.</div>
            {concentration && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-ink mb-1">By counterparty</div>
                  {Object.entries(concentration.by_counterparty ?? {}).map(([id, v]: [string, any]) => (
                    <div key={id} className="flex justify-between px-2 py-1 bg-surface-2 rounded mb-1"><span>{v.name}</span><span className="font-bold">{v.share_pct}%</span></div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-ink mb-1">By asset class</div>
                  {Object.entries(concentration.by_asset_class ?? {}).map(([cls, v]: [string, any]) => (
                    <div key={cls} className="flex justify-between px-2 py-1 bg-surface-2 rounded mb-1"><span>{cls}</span><span className="font-bold">{v.share_pct}%</span></div>
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

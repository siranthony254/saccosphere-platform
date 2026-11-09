import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useCapabilities } from '../../hooks/useCapabilities'
import { ModuleGate } from '../../components/ui/ModuleGate'
import { StepUpModal } from '../../components/auth/StepUpModal'
import { InfoTip } from '@saccosphere/ui'

const STAGED_TRANCHES_MODULE = 'lending.staged_tranches'
const VARIABLE_INCOME_MODULE = 'lending.variable_income'
const DATA_TAPE_MODULE = 'lending.data_tape'

type PickedLoan = { id: string; label: string }

function LoanPicker({ selected, setSelected }: { selected: PickedLoan | null; setSelected: (v: PickedLoan | null) => void }) {
  const [search, setSearch] = useState('')
  // Collateral/tranche management applies to loans already approved (staged
  // tranches are an alternative to a single lump-sum disbursement), so this
  // picker only searches that pool rather than every loan ever filed.
  const { data: loans } = useQuery({
    queryKey: ['lending-loan-picker'],
    queryFn: () => api.saccoAdmin.getLoans({ status: 'approved' }),
  })
  const matches = search
    ? (loans?.results ?? []).filter((l: any) =>
        `${l.ref} ${l.loan_product_label} ${l.member_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : []
  return (
    <div>
      <input
        type="text"
        placeholder="Search by loan reference, product or member"
        value={selected ? '' : search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
        className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
        disabled={!!selected}
      />
      {selected ? (
        <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1 text-xs">
          <span className="text-ink font-medium">{selected.label}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-violet-700 font-semibold">Change</button>
        </div>
      ) : search && matches.length > 0 ? (
        <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
          {matches.slice(0, 20).map((l: any) => (
            <button
              type="button"
              key={l.id}
              onClick={() => setSelected({ id: l.id, label: `${l.ref} — ${l.member_name} (KES ${Number(l.amount_requested ?? 0).toLocaleString()})` })}
              className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded text-xs"
            >
              {l.ref} — {l.member_name} · KES {Number(l.amount_requested ?? 0).toLocaleString()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function SharedLendingPrimitives() {
  const queryClient = useQueryClient()
  const { isModuleEnabled } = useCapabilities()
  const [activeTab, setActiveTab] = useState<'assets' | 'collateral' | 'tranches' | 'income' | 'datatapes'>('assets')

  // Asset Form State
  const [assetClass, setAssetClass] = useState<'VEHICLE' | 'DEVICE' | 'EQUIPMENT' | 'PROPERTY' | 'OTHER'>('VEHICLE')
  const [assetIdentifier, setAssetIdentifier] = useState('')
  const [assetValue, setAssetValue] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)
  const [valuationAmount, setValuationAmount] = useState('')
  const [valuerName, setValuerName] = useState('')

  // Collateral tab state
  const [collateralLoan, setCollateralLoan] = useState<PickedLoan | null>(null)
  const [pledgeAssetId, setPledgeAssetId] = useState('')
  const [pledgeValue, setPledgeValue] = useState('')
  const [chargeRefByLink, setChargeRefByLink] = useState<Record<string, string>>({})
  const [releaseReasonByLink, setReleaseReasonByLink] = useState<Record<string, string>>({})

  // Tranches tab state
  const [trancheLoan, setTrancheLoan] = useState<PickedLoan | null>(null)
  const [trancheRows, setTrancheRows] = useState<Array<{ amount: string; planned_date: string; milestone: string; payout_method: 'B2C' | 'BANK' }>>([
    { amount: '', planned_date: '', milestone: '', payout_method: 'BANK' },
  ])
  const [inspectionByTranche, setInspectionByTranche] = useState<Record<string, { outcome: 'PASS' | 'FAIL'; inspected_on: string; findings: string }>>({})
  const [bankRefByTranche, setBankRefByTranche] = useState<Record<string, string>>({})
  const [stepUpTrancheId, setStepUpTrancheId] = useState<string | null>(null)
  const [stepUpError, setStepUpError] = useState<string | null>(null)

  // Income verification review state
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null)

  const [lendingMsg, setLendingMsg] = useState<string | null>(null)

  // Queries
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery({
    queryKey: ['lending-assets'],
    queryFn: () => api.lending.getAssets(),
  })

  const { data: incomeVerifications = [], isLoading: isIncomeLoading } = useQuery({
    queryKey: ['income-verifications'],
    queryFn: () => api.lending.getIncomeVerifications(),
  })

  const { data: dataTapes = [] } = useQuery({
    queryKey: ['data-tapes'],
    queryFn: () => api.lending.getDataTapes(),
  })

  const { data: collateralLinks = [], isLoading: isCollateralLoading } = useQuery({
    queryKey: ['loan-collateral', collateralLoan?.id],
    queryFn: () => api.lending.getCollateral(collateralLoan!.id),
    enabled: activeTab === 'collateral' && !!collateralLoan,
  })

  const { data: tranches = [], isLoading: isTranchesLoading } = useQuery({
    queryKey: ['loan-tranches', trancheLoan?.id],
    queryFn: () => api.lending.getTranches(trancheLoan!.id),
    enabled: activeTab === 'tranches' && !!trancheLoan,
  })

  // Mutations
  const pledgeCollateralMutation = useMutation({
    mutationFn: () => api.lending.pledgeCollateral(collateralLoan!.id, { asset_id: pledgeAssetId, pledged_value: Number(pledgeValue) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-collateral', collateralLoan?.id] })
      setPledgeAssetId('')
      setPledgeValue('')
      setLendingMsg('Asset pledged against this loan.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to pledge this asset — it may not be worth enough, or is already fully committed elsewhere.'),
  })

  const registerChargeMutation = useMutation({
    mutationFn: (data: { linkId: string; charge_reference: string }) => api.lending.registerCharge(data.linkId, { charge_reference: data.charge_reference }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-collateral', collateralLoan?.id] })
      setLendingMsg('Charge registered for this pledge.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to register this charge.'),
  })

  const releaseCollateralMutation = useMutation({
    mutationFn: (data: { linkId: string; reason: string }) => api.lending.releaseCollateral(data.linkId, { reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-collateral', collateralLoan?.id] })
      setLendingMsg('Collateral pledge released.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to release this pledge.'),
  })

  const setTranchePlanMutation = useMutation({
    mutationFn: () =>
      api.lending.setTranchePlan(
        trancheLoan!.id,
        trancheRows
          .filter((r) => r.amount && r.planned_date && r.milestone)
          .map((r) => ({ amount: Number(r.amount), planned_date: r.planned_date, milestone: r.milestone, payout_method: r.payout_method }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-tranches', trancheLoan?.id] })
      setLendingMsg('Tranche plan set.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to set the tranche plan — it can only be replaced before any tranche is inspected.'),
  })

  const inspectTrancheMutation = useMutation({
    mutationFn: (trancheId: string) => api.lending.inspectTranche(trancheId, inspectionByTranche[trancheId]),
    onSuccess: (_data, trancheId) => {
      queryClient.invalidateQueries({ queryKey: ['loan-tranches', trancheLoan?.id] })
      setInspectionByTranche((prev) => { const next = { ...prev }; delete next[trancheId]; return next })
      setLendingMsg('Inspection recorded.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to record this inspection.'),
  })

  const drawdownTrancheMutation = useMutation({
    mutationFn: (data: { trancheId: string; code?: string }) => api.lending.drawdownTranche(data.trancheId, data.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-tranches', trancheLoan?.id] })
      setStepUpTrancheId(null)
      setStepUpError(null)
      setLendingMsg('Drawdown requested — awaiting a second admin\'s approval.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any, vars) => {
      if (err?.status === 428) {
        setStepUpTrancheId(vars.trancheId)
        setStepUpError(err?.message || null)
        return
      }
      setLendingMsg(err?.message || 'Failed to request this drawdown.')
    },
  })

  const markTranchePaidMutation = useMutation({
    mutationFn: (data: { trancheId: string; bank_reference: string }) => api.lending.markTranchePaid(data.trancheId, { bank_reference: data.bank_reference }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loan-tranches', trancheLoan?.id] })
      setBankRefByTranche((prev) => { const next = { ...prev }; delete next[vars.trancheId]; return next })
      setLendingMsg('Bank payment recorded for this tranche.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to record this bank payment.'),
  })

  const retryTranchePayoutMutation = useMutation({
    mutationFn: (trancheId: string) => api.lending.retryTranchePayout(trancheId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-tranches', trancheLoan?.id] })
      setLendingMsg('Payout retried.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to retry this payout.'),
  })
  const createAssetMutation = useMutation({
    mutationFn: (data: { asset_class: 'VEHICLE' | 'DEVICE' | 'EQUIPMENT' | 'PROPERTY' | 'OTHER'; identifier: string; acquisition_value: number }) =>
      api.lending.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-assets'] })
      setAssetIdentifier('')
      setAssetValue('')
      setLendingMsg('Asset registered successfully.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
    onError: (err: any) => setLendingMsg(err?.message || 'Failed to register asset.'),
  })

  const addValuationMutation = useMutation({
    mutationFn: (data: { assetId: string; amount: number; valuer: string }) =>
      api.lending.addValuation(data.assetId, {
        valuation_amount: data.amount,
        valuer_name: data.valuer,
        valuation_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-assets'] })
      setValuationAmount('')
      setValuerName('')
      setLendingMsg('Asset valuation history updated.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
  })

  const approveIncomeMutation = useMutation({
    mutationFn: (id: string) => api.lending.approveIncomeVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-verifications'] })
      setSelectedVerification(null)
      setLendingMsg('Variable income verification approved and affordability ceiling frozen.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
  })

  const rejectIncomeMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) => api.lending.rejectIncomeVerification(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-verifications'] })
      setSelectedVerification(null)
      setLendingMsg('Variable income verification rejected.')
      setTimeout(() => setLendingMsg(null), 4000)
    },
  })

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Shared Lending Primitives &amp; Asset Register
            <InfoTip text="Tools for loans backed by an asset — a vehicle, device, equipment or property — or by a member's irregular income instead of a payslip." label="About Lending Primitives & Asset Register" />
          </div>
          <div className="text-xs text-ink-muted">
            A register of pledged assets, staged/installment loans, and reviewing what a member with irregular income can afford.
          </div>
        </div>
      </div>

      {lendingMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
          {lendingMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'assets'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Asset Register ({assets.length})
        </button>
        <button
          onClick={() => setActiveTab('collateral')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'collateral'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Collateral Charges
        </button>
        <button
          onClick={() => setActiveTab('tranches')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'tranches'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Staged Tranches
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'income'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Variable-Income Review Queue
        </button>
        <button
          onClick={() => setActiveTab('datatapes')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'datatapes'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Refinancer Data Tapes
        </button>
      </div>

      {/* TAB 1: ASSETS */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Register Physical / Digital Asset</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!assetIdentifier || !assetValue) return
                createAssetMutation.mutate({
                  asset_class: assetClass,
                  identifier: assetIdentifier,
                  acquisition_value: Number(assetValue),
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Asset Class</label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as any)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                >
                  {isModuleEnabled('lending.assets.vehicle') && <option value="VEHICLE">VEHICLE (PSV / Boda / Commercial)</option>}
                  {isModuleEnabled('lending.assets.device') && <option value="DEVICE">DEVICE (Laptop / Phone / Tablet)</option>}
                  {isModuleEnabled('lending.assets.equipment') && <option value="EQUIPMENT">EQUIPMENT (Agro / Medical / Industrial)</option>}
                  {isModuleEnabled('lending.assets.property') && <option value="PROPERTY">PROPERTY (Title Deed)</option>}
                  {isModuleEnabled('lending.assets.other') && <option value="OTHER">OTHER</option>}
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Normalized Identifier (Plate / Serial / Title Ref)</label>
                <input
                  type="text"
                  placeholder="e.g. KDA 123A or SN-9812401"
                  value={assetIdentifier}
                  onChange={(e) => setAssetIdentifier(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Acquisition Value (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500000"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createAssetMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Register Asset
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Asset Register &amp; Valuations</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Class</th>
                    <th className="py-2 px-3">Identifier</th>
                    <th className="py-2 px-3">Value (KES)</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isAssetsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">Loading assets...</td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">No assets registered.</td>
                    </tr>
                  ) : (
                    assets.map((a: any) => (
                      <tr key={a.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink-soft text-[10px]">{a.asset_class?.charAt(0)}{a.asset_class?.slice(1).toLowerCase()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-ink">{a.identifier}</td>
                        <td className="py-2.5 px-3 font-bold text-ink">KES {Number(a.acquisition_value ?? 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-violet-700">{a.status || 'ACTIVE'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedAsset(a)}
                            className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded"
                          >
                            Add Valuation
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedAsset && (
              <div className="border-t border-[#e5ede9] pt-3 space-y-3 bg-surface-2 p-3 rounded-lg text-xs">
                <div className="font-bold text-ink">Add Valuation for {selectedAsset.identifier}</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Valuation Amount (KES)"
                    value={valuationAmount}
                    onChange={(e) => setValuationAmount(e.target.value)}
                    className="p-2 border rounded bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Valuer Name / Agency"
                    value={valuerName}
                    onChange={(e) => setValuerName(e.target.value)}
                    className="p-2 border rounded bg-white text-xs"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!valuationAmount || !valuerName) return
                    addValuationMutation.mutate({ assetId: selectedAsset.id, amount: Number(valuationAmount), valuer: valuerName })
                  }}
                  className="px-3 py-1.5 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded"
                >
                  Record Valuation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COLLATERAL — same lending.assets module as the page's own gate. */}
      {activeTab === 'collateral' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Pledge an Asset
              <InfoTip text="Commits a registered asset's value as security for a loan. A loan's total pledged value is checked against its LTV cap, and an asset can't be pledged for more than its own current valuation." label="What pledging does" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Loan</label>
              <LoanPicker selected={collateralLoan} setSelected={setCollateralLoan} />
            </div>
            {collateralLoan && (
              <>
                <div>
                  <label className="text-ink-muted mb-1 block">Asset</label>
                  <select value={pledgeAssetId} onChange={(e) => setPledgeAssetId(e.target.value)} className="w-full p-2 border rounded bg-white">
                    <option value="">Select a registered asset...</option>
                    {assets.map((a: any) => <option key={a.id} value={a.id}>{a.identifier} ({a.asset_class})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Pledged Value (KES)</label>
                  <input type="number" value={pledgeValue} onChange={(e) => setPledgeValue(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
                <button
                  onClick={() => pledgeAssetId && pledgeValue && pledgeCollateralMutation.mutate()}
                  disabled={!pledgeAssetId || !pledgeValue || pledgeCollateralMutation.isPending}
                  className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
                >
                  Pledge Asset
                </button>
              </>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Pledges on This Loan</div>
            {!collateralLoan ? (
              <div className="text-ink-muted">Select a loan to view and manage its collateral pledges.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted bg-surface-2">
                      <th className="py-2 px-3">Asset</th>
                      <th className="py-2 px-3">Pledged Value</th>
                      <th className="py-2 px-3">Charge Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isCollateralLoading ? (
                      <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading pledges...</td></tr>
                    ) : collateralLinks.length === 0 ? (
                      <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No assets pledged against this loan yet.</td></tr>
                    ) : (
                      collateralLinks.map((link: any) => (
                        <tr key={link.id}>
                          <td className="py-2 px-3 font-mono font-bold text-ink">{link.asset?.identifier}</td>
                          <td className="py-2 px-3 font-bold">KES {Number(link.pledged_value ?? 0).toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] border ${
                              link.charge_status === 'REGISTERED' ? 'bg-mint-50 text-mint-700 border-mint-200' :
                              link.charge_status === 'RELEASED' ? 'bg-surface-2 text-ink-muted border-ink-faint' :
                              link.charge_status === 'ENFORCED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{link.charge_status}</span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {link.charge_status === 'PENDING' && (
                              <div className="flex items-center gap-1 justify-end">
                                <input
                                  type="text"
                                  placeholder="Charge reference"
                                  value={chargeRefByLink[link.id] ?? ''}
                                  onChange={(e) => setChargeRefByLink((prev) => ({ ...prev, [link.id]: e.target.value }))}
                                  className="p-1 border rounded text-[11px] w-32"
                                />
                                <button
                                  onClick={() => chargeRefByLink[link.id] && registerChargeMutation.mutate({ linkId: link.id, charge_reference: chargeRefByLink[link.id] })}
                                  disabled={!chargeRefByLink[link.id] || registerChargeMutation.isPending}
                                  className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold"
                                >
                                  Register
                                </button>
                              </div>
                            )}
                            {(link.charge_status === 'PENDING' || link.charge_status === 'REGISTERED') && (
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <input
                                  type="text"
                                  placeholder="Release reason"
                                  value={releaseReasonByLink[link.id] ?? ''}
                                  onChange={(e) => setReleaseReasonByLink((prev) => ({ ...prev, [link.id]: e.target.value }))}
                                  className="p-1 border rounded text-[11px] w-32"
                                />
                                <button
                                  onClick={() => releaseReasonByLink[link.id] && releaseCollateralMutation.mutate({ linkId: link.id, reason: releaseReasonByLink[link.id] })}
                                  disabled={!releaseReasonByLink[link.id] || releaseCollateralMutation.isPending}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                                >
                                  Release
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRANCHES — a different sub-module (lending.staged_tranches)
          from the one gating this whole page (lending.assets). */}
      {activeTab === 'tranches' && (
        <ModuleGate module={STAGED_TRANCHES_MODULE} moduleName="Staged tranches">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
              <div className="font-bold text-base text-ink flex items-center gap-1.5">
                Staged Disbursement Plan
                <InfoTip text="Instead of one lump sum, the loan pays out in planned instalments — each one released only after a site/delivery inspection passes, and each drawdown needs a second admin's sign-off." label="How staged tranches work" />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Loan</label>
                <LoanPicker selected={trancheLoan} setSelected={setTrancheLoan} />
              </div>

              {trancheLoan && (
                <div className="space-y-2 border-t pt-2">
                  <div className="font-bold text-ink">Set Tranche Plan</div>
                  <div className="text-ink-faint">Only possible before any tranche has been inspected.</div>
                  {trancheRows.map((row, i) => (
                    <div key={i} className="bg-surface-2 rounded p-2 space-y-1.5 border border-ink-faint">
                      <input type="number" placeholder="Amount (KES)" value={row.amount} onChange={(e) => setTrancheRows((prev) => prev.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} className="w-full p-1.5 border rounded bg-white" />
                      <input type="date" value={row.planned_date} onChange={(e) => setTrancheRows((prev) => prev.map((r, idx) => idx === i ? { ...r, planned_date: e.target.value } : r))} className="w-full p-1.5 border rounded bg-white" />
                      <input type="text" placeholder="Milestone (e.g. Foundation complete)" value={row.milestone} onChange={(e) => setTrancheRows((prev) => prev.map((r, idx) => idx === i ? { ...r, milestone: e.target.value } : r))} className="w-full p-1.5 border rounded bg-white" />
                      <div className="flex items-center gap-1.5">
                        <select value={row.payout_method} onChange={(e) => setTrancheRows((prev) => prev.map((r, idx) => idx === i ? { ...r, payout_method: e.target.value as any } : r))} className="flex-1 p-1.5 border rounded bg-white">
                          <option value="BANK">Bank transfer (manual)</option>
                          <option value="B2C">M-Pesa B2C</option>
                        </select>
                        {trancheRows.length > 1 && (
                          <button type="button" onClick={() => setTrancheRows((prev) => prev.filter((_, idx) => idx !== i))} className="px-2 py-1.5 border border-ink-faint rounded text-ink-muted">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTrancheRows((prev) => [...prev, { amount: '', planned_date: '', milestone: '', payout_method: 'BANK' }])}
                    className="w-full py-1.5 border border-dashed border-ink-faint rounded text-ink-muted"
                  >
                    + Add Tranche
                  </button>
                  <button
                    onClick={() => setTranchePlanMutation.mutate()}
                    disabled={setTranchePlanMutation.isPending}
                    className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
                  >
                    Set Tranche Plan
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-3">
              <div className="font-bold text-base text-ink">Tranches on This Loan</div>
              {!trancheLoan ? (
                <div className="text-ink-muted">Select a loan to view and manage its tranche plan.</div>
              ) : isTranchesLoading ? (
                <div className="text-ink-muted">Loading tranches...</div>
              ) : tranches.length === 0 ? (
                <div className="text-ink-muted">No tranche plan set for this loan yet.</div>
              ) : (
                <div className="space-y-3">
                  {tranches.map((t: any) => (
                    <div key={t.id} className="border border-ink-faint rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-ink">Tranche {t.sequence} — {t.milestone}</div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-200">{t.status}</span>
                      </div>
                      <div className="text-ink-muted">KES {Number(t.amount ?? 0).toLocaleString()} · planned {t.planned_date} · {t.payout_method === 'BANK' ? 'Bank transfer' : 'M-Pesa B2C'}</div>

                      {t.status === 'PLANNED' && (
                        <div className="bg-surface-2 rounded p-2 space-y-1.5">
                          <div className="font-semibold text-ink">Record Inspection</div>
                          <div className="flex gap-1.5">
                            <select
                              value={inspectionByTranche[t.id]?.outcome ?? 'PASS'}
                              onChange={(e) => setInspectionByTranche((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? { inspected_on: '', findings: '' }), outcome: e.target.value as any } }))}
                              className="p-1.5 border rounded bg-white"
                            >
                              <option value="PASS">Pass</option>
                              <option value="FAIL">Fail</option>
                            </select>
                            <input
                              type="date"
                              value={inspectionByTranche[t.id]?.inspected_on ?? ''}
                              onChange={(e) => setInspectionByTranche((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? { outcome: 'PASS', findings: '' }), inspected_on: e.target.value } }))}
                              className="p-1.5 border rounded bg-white flex-1"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Findings"
                            value={inspectionByTranche[t.id]?.findings ?? ''}
                            onChange={(e) => setInspectionByTranche((prev) => ({ ...prev, [t.id]: { ...(prev[t.id] ?? { outcome: 'PASS', inspected_on: '' }), findings: e.target.value } }))}
                            className="w-full p-1.5 border rounded bg-white"
                          />
                          <button
                            onClick={() => inspectTrancheMutation.mutate(t.id)}
                            disabled={!inspectionByTranche[t.id]?.inspected_on || !inspectionByTranche[t.id]?.findings || inspectTrancheMutation.isPending}
                            className="w-full py-1.5 bg-mint-600 text-white font-bold rounded"
                          >
                            Record Inspection
                          </button>
                        </div>
                      )}

                      {t.status === 'INSPECTED' && (
                        <button
                          onClick={() => drawdownTrancheMutation.mutate({ trancheId: t.id })}
                          disabled={drawdownTrancheMutation.isPending}
                          className="w-full py-1.5 bg-violet-600 text-white font-bold rounded"
                        >
                          Request Drawdown
                        </button>
                      )}

                      {t.status === 'APPROVED' && t.payout_method === 'BANK' && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Bank reference"
                            value={bankRefByTranche[t.id] ?? ''}
                            onChange={(e) => setBankRefByTranche((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            className="flex-1 p-1.5 border rounded bg-white"
                          />
                          <button
                            onClick={() => bankRefByTranche[t.id] && markTranchePaidMutation.mutate({ trancheId: t.id, bank_reference: bankRefByTranche[t.id] })}
                            disabled={!bankRefByTranche[t.id] || markTranchePaidMutation.isPending}
                            className="px-3 py-1.5 bg-mint-600 text-white font-bold rounded"
                          >
                            Record Payment
                          </button>
                        </div>
                      )}

                      {t.status === 'FAILED' && (
                        <button
                          onClick={() => retryTranchePayoutMutation.mutate(t.id)}
                          disabled={retryTranchePayoutMutation.isPending}
                          className="w-full py-1.5 bg-amber-600 text-white font-bold rounded"
                        >
                          Retry Payout
                        </button>
                      )}

                      {t.inspections?.length > 0 && (
                        <div className="text-ink-faint">
                          {t.inspections.map((insp: any) => (
                            <div key={insp.id}>{insp.inspected_on}: {insp.outcome} — {insp.findings}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <StepUpModal
            isOpen={!!stepUpTrancheId}
            title="Authorize Tranche Drawdown"
            description="Releasing a tranche drawdown requires second-factor staff authorization."
            error={stepUpError}
            onClose={() => { setStepUpTrancheId(null); setStepUpError(null) }}
            onSubmitCode={(code) => stepUpTrancheId && drawdownTrancheMutation.mutate({ trancheId: stepUpTrancheId, code })}
          />
        </ModuleGate>
      )}

      {/* TAB 4: VARIABLE INCOME — a different sub-module (lending.variable_income)
          from the one gating this whole page (lending.assets). */}
      {activeTab === 'income' && (
        <ModuleGate module={VARIABLE_INCOME_MODULE} moduleName="Variable income verification">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Irregular-Income Review Queue</div>
            <div className="overflow-y-auto max-h-[450px] space-y-2">
              {isIncomeLoading ? (
                <div className="text-xs text-ink-muted">Loading verifications...</div>
              ) : incomeVerifications.length === 0 ? (
                <div className="text-xs text-ink-muted">No pending variable-income verifications.</div>
              ) : (
                incomeVerifications.map((v: any) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVerification(v)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedVerification?.id === v.id
                        ? 'bg-violet-50 border-violet-400 font-semibold'
                        : 'bg-surface-2 border-ink-faint hover:bg-surface-1'
                    }`}
                  >
                    <div className="font-bold text-ink">{v.member_name || 'Member'}</div>
                    <div className="text-[10px] text-ink-muted">{v.months_count ?? 0} months of income on file</div>
                    <div className="text-[10px] font-bold text-violet-700 mt-1">{v.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Approve How Much They Can Afford</div>
            {selectedVerification ? (
              <div className="space-y-4 text-xs">
                <div className="bg-surface-2 p-3 rounded-lg border text-xs space-y-1">
                  <div><span className="text-ink-muted">Member:</span> <span className="font-bold">{selectedVerification.member_name || 'Member'}</span></div>
                  <div><span className="text-ink-muted">Status:</span> {selectedVerification.status}</div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => approveIncomeMutation.mutate(selectedVerification.id)}
                    disabled={approveIncomeMutation.isPending}
                    className="flex-1 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold rounded text-xs cursor-pointer"
                  >
                    Approve This Repayment Limit
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:')
                      if (reason) rejectIncomeMutation.mutate({ id: selectedVerification.id, reason })
                    }}
                    disabled={rejectIncomeMutation.isPending}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-ink-muted">Select a variable-income verification from the queue.</div>
            )}
          </div>
        </div>
        </ModuleGate>
      )}

      {/* TAB 5: DATA TAPES — off-by-default lending.data_tape module
          (mortgage refinancing pilots only), separate from lending.assets. */}
      {activeTab === 'datatapes' && (
        <ModuleGate module={DATA_TAPE_MODULE} moduleName="Refinancer data tapes">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Export Loan Book for a Refinancer</div>
          <div className="text-xs text-ink-muted flex items-start gap-1.5">
            <span>Generates a file listing this SACCO's loans, formatted for an outside funder (like KMRC) to review.</span>
            <InfoTip text="A 'refinancer' is an outside institution — like KMRC, Kenya's affordable-housing refinancer — that lends money to this SACCO against its existing loan book." label="What is a refinancer?" />
          </div>

          <div className="space-y-2">
            {dataTapes.map((dt: any) => (
              <div key={dt.code} className="p-3 bg-surface-2 rounded border flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-ink">{dt.name || dt.code}</div>
                  <div className="text-[10px] text-ink-muted">{dt.description || 'Data Tape Template'}</div>
                </div>
                <button
                  onClick={async () => {
                    const blob = await api.lending.exportDataTape(dt.code, 'csv')
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `data_tape_${dt.code}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded font-bold text-xs cursor-pointer"
                >
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </div>
        </ModuleGate>
      )}
    </div>
  )
}

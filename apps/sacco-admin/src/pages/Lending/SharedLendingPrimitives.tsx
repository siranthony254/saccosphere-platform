import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useCapabilities } from '../../hooks/useCapabilities'
import { InfoTip } from '@saccosphere/ui'

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

  // NOTE: the Collateral and Tranches tabs are registered below but have
  // no body yet (asset registration and the income-verification review
  // queue are the only parts of this pack actually built) — a dedicated
  // follow-up pass, not part of this correctness fix.

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

  // Mutations
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
            Asset register, collateral LTV row-locking, staged tranche drawdowns, variable-income affordability assessor &amp; refinancer data tapes.
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
                        <td className="py-2.5 px-3 uppercase font-semibold text-ink-soft text-[10px]">{a.asset_class}</td>
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

      {/* TAB 2: COLLATERAL */}
      {activeTab === 'collateral' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
          <div className="font-bold text-base text-ink">Collateral &amp; LTV Row-Locking</div>
          <div className="text-xs text-ink-muted">
            Collateral links are pledged against loans. Hard LTV &amp; charge checks lock the row at disbursement — payout fails closed if unpledged or grounded.
          </div>
        </div>
      )}

      {/* TAB 3: TRANCHES */}
      {activeTab === 'tranches' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
          <div className="font-bold text-base text-ink">Staged Tranche Loans (Sequential Inspections &amp; Drawdowns)</div>
          <div className="text-xs text-ink-muted">
            Staged loans draw down sequentially after passed inspections. Drawdown requires maker-checker approval &amp; step-up verification.
          </div>
        </div>
      )}

      {/* TAB 4: VARIABLE INCOME */}
      {activeTab === 'income' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Variable Income Review Queue</div>
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
                    <div className="text-[10px] text-ink-muted">Months Transcribed: {v.months_count ?? 0}</div>
                    <div className="text-[10px] font-bold text-violet-700 mt-1">{v.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Verification Review &amp; Affordability Sign-off</div>
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
                    Approve &amp; Freeze Affordability Ceiling
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
      )}

      {/* TAB 5: DATA TAPES */}
      {activeTab === 'datatapes' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Refinancer Data Tapes Export</div>
          <div className="text-xs text-ink-muted">Generate loan portfolio data tapes for refinancers (e.g. KMRC).</div>

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
      )}
    </div>
  )
}

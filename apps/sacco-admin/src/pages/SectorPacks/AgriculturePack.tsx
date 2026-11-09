import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'

type PickedMember = { id: string; memberNumber: string; label: string }

function MemberPicker({
  search, setSearch, selected, setSelected, placeholder = 'Search by name or member number',
}: {
  search: string
  setSearch: (v: string) => void
  selected: PickedMember | null
  setSelected: (v: PickedMember | null) => void
  placeholder?: string
}) {
  const { data: results } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder={placeholder}
        value={selected ? '' : search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
        className="w-full p-2 border rounded bg-white"
        disabled={!!selected}
      />
      {selected ? (
        <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1">
          <span className="text-ink font-medium">{selected.label}</span>
          <button type="button" onClick={() => setSelected(null)} className="text-violet-700 font-semibold">Change</button>
        </div>
      ) : search && (results?.results ?? []).length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {(results?.results ?? []).map((m: any) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setSelected({ id: m.id, memberNumber: m.member_number, label: `${m.first_name} ${m.last_name} · ${m.member_number}` })}
              className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded"
            >
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AgriculturePack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'buyers' | 'deliveries' | 'advances' | 'payouts' | 'dealers'>('buyers')

  // Buyer form — ProduceBuyer has no `code` field at all; `buyer_type` is
  // the real required field the backend serializer expects.
  const [buyerName, setBuyerName] = useState('')
  const [buyerType, setBuyerType] = useState<'COOPERATIVE' | 'PROCESSOR'>('COOPERATIVE')

  // Payout run form
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [payoutStart, setPayoutStart] = useState('2026-10-01')
  const [payoutEnd, setPayoutEnd] = useState('2026-10-31')
  const [payoutDest, setPayoutDest] = useState<'FOSA' | 'BOSA' | 'MPESA'>('BOSA')

  // Deliveries tab state
  const [deliveryBuyerId, setDeliveryBuyerId] = useState('')
  const [deliveryMemberSearch, setDeliveryMemberSearch] = useState('')
  const [deliveryMember, setDeliveryMember] = useState<PickedMember | null>(null)
  const [deliveryProduceType, setDeliveryProduceType] = useState('')
  const [newProduceTypeName, setNewProduceTypeName] = useState('')
  const [newProduceTypeUnit, setNewProduceTypeUnit] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('2026-10-01')
  const [deliveryQty, setDeliveryQty] = useState('')
  const [deliveryGrade, setDeliveryGrade] = useState('')
  const [deliveryUnitPrice, setDeliveryUnitPrice] = useState('')
  const [deliveryFilterBuyer, setDeliveryFilterBuyer] = useState('')

  // Advances tab state
  const [advanceMemberSearch, setAdvanceMemberSearch] = useState('')
  const [advanceMember, setAdvanceMember] = useState<PickedMember | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceRail, setAdvanceRail] = useState<'FOSA' | 'BOSA' | 'MPESA'>('BOSA')

  // Agro-dealers tab state
  const [dealerName, setDealerName] = useState('')
  const [dealerRail, setDealerRail] = useState<'BANK' | 'B2C'>('BANK')
  const [dealerBankName, setDealerBankName] = useState('')
  const [dealerAccountNumber, setDealerAccountNumber] = useState('')
  const [dealerPhone, setDealerPhone] = useState('')

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: buyers = [], isLoading: isBuyersLoading } = useQuery({
    queryKey: ['agri-buyers'],
    queryFn: () => api.agriculture.getBuyers(),
  })

  const { data: payoutRuns = [], isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['agri-payout-runs'],
    queryFn: () => api.agriculture.getPayoutRuns(),
  })

  const { data: produceTypes = [] } = useQuery({
    queryKey: ['agri-produce-types'],
    queryFn: () => api.agriculture.getProduceTypes(),
    enabled: activeTab === 'deliveries',
  })

  const { data: deliveries = [], isLoading: isDeliveriesLoading } = useQuery({
    queryKey: ['agri-deliveries', deliveryFilterBuyer],
    queryFn: () => api.agriculture.getDeliveries(deliveryFilterBuyer ? { buyer: deliveryFilterBuyer } : undefined),
    enabled: activeTab === 'deliveries',
  })

  const { data: advanceLimit } = useQuery({
    queryKey: ['agri-advance-limit', advanceMember?.id],
    queryFn: () => api.agriculture.getAdvanceLimit(advanceMember!.id),
    enabled: activeTab === 'advances' && !!advanceMember,
  })

  const { data: advances = [], isLoading: isAdvancesLoading } = useQuery({
    queryKey: ['agri-advances', advanceMember?.id],
    queryFn: () => api.agriculture.getAdvances(),
    enabled: activeTab === 'advances',
  })

  const { data: dealers = [], isLoading: isDealersLoading } = useQuery({
    queryKey: ['agri-dealers'],
    queryFn: () => api.agriculture.getAgroDealers(),
    enabled: activeTab === 'dealers',
  })

  // Mutations
  const createBuyerMutation = useMutation({
    mutationFn: (data: { name: string; buyer_type: 'COOPERATIVE' | 'PROCESSOR' }) => api.agriculture.createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agri-buyers'] })
      setBuyerName('')
      setMsg('Produce buyer registered.')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  const createProduceTypeMutation = useMutation({
    mutationFn: (data: { name: string; unit: string }) => api.agriculture.createProduceType(data),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['agri-produce-types'] })
      setNewProduceTypeName('')
      setNewProduceTypeUnit('')
      setDeliveryProduceType(created?.name ?? '')
      setMsg('Produce type added.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to add produce type.'),
  })

  const logDeliveryMutation = useMutation({
    mutationFn: () =>
      api.agriculture.importDeliveriesJson(deliveryBuyerId, [
        {
          member_number: deliveryMember!.memberNumber,
          date: deliveryDate,
          produce_type: deliveryProduceType,
          quantity: Number(deliveryQty),
          grade: deliveryGrade || undefined,
          unit_price: Number(deliveryUnitPrice),
        },
      ]),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['agri-deliveries'] })
      if (result?.created > 0) {
        setDeliveryQty('')
        setDeliveryGrade('')
        setDeliveryUnitPrice('')
        setMsg('Delivery logged.')
      } else {
        setMsg(result?.errors?.[0]?.detail || 'Delivery could not be logged — check the member number and produce type.')
      }
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to log delivery.'),
  })

  const requestAdvanceMutation = useMutation({
    mutationFn: () =>
      api.agriculture.requestAdvance({ membership: advanceMember!.id, amount: Number(advanceAmount), rail: advanceRail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agri-advances'] })
      queryClient.invalidateQueries({ queryKey: ['agri-advance-limit', advanceMember?.id] })
      setAdvanceAmount('')
      setMsg('Advance disbursed against expected produce value.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to disburse advance — it may exceed this member\'s limit.'),
  })

  const createDealerMutation = useMutation({
    mutationFn: () =>
      api.agriculture.createAgroDealer({
        name: dealerName,
        default_rail: dealerRail,
        bank_name: dealerBankName || undefined,
        bank_account_number: dealerAccountNumber || undefined,
        phone_number: dealerPhone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agri-dealers'] })
      setDealerName('')
      setDealerBankName('')
      setDealerAccountNumber('')
      setDealerPhone('')
      setMsg('Agro-dealer registered. In-kind input loans can now disburse straight to them.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register agro-dealer.'),
  })

  const createPayoutRunMutation = useMutation({
    mutationFn: (data: { buyer: string; period_start: string; period_end: string; destination: 'FOSA' | 'BOSA' | 'MPESA' }) =>
      api.agriculture.createPayoutRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agri-payout-runs'] })
      setMsg('Produce payout run created in DRAFT status.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to create payout run.'),
  })

  const approvePayoutRunMutation = useMutation({
    mutationFn: (id: string) => api.agriculture.approvePayoutRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agri-payout-runs'] })
      setMsg('Produce payout run approved (pairwise approver ≠ creator checked).')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Approval failed.'),
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Agriculture Sector Pack
            <InfoTip text="Tools built for farming SACCOs: track what each buyer owes a farmer, give loans timed to the harvest, and finance farm inputs through trusted dealers." label="About the Agriculture Sector Pack" />
          </div>
          <div className="text-xs text-ink-muted">
            Produce buyers, delivery tracking, crop advances, net payout runs, buyer arrears shielding &amp; agro-dealer input loans.
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('buyers')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'buyers'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Produce Buyers ({buyers.length})
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'deliveries'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Deliveries Log
        </button>
        <button
          onClick={() => setActiveTab('advances')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'advances'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Crop Advances
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'payouts'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Payout Runs
        </button>
        <button
          onClick={() => setActiveTab('dealers')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'dealers'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Agro-Dealers
        </button>
      </div>

      {/* TAB 1: BUYERS */}
      {activeTab === 'buyers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Register Produce Buyer</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!buyerName) return
                createBuyerMutation.mutate({ name: buyerName, buyer_type: buyerType })
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Buyer Name</label>
                <input
                  type="text"
                  placeholder="e.g. KTDA / Brookside / New KCC"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Buyer Type</label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as 'COOPERATIVE' | 'PROCESSOR')}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="COOPERATIVE">Cooperative</option>
                  <option value="PROCESSOR">Processor</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createBuyerMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Buyer
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Registered Buyers</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Buyer Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isBuyersLoading ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">Loading buyers...</td></tr>
                  ) : buyers.length === 0 ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">No buyers registered.</td></tr>
                  ) : (
                    buyers.map((b: any) => (
                      <tr key={b.id}>
                        <td className="py-2 px-3 font-mono font-bold text-violet-700">{b.code}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{b.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DELIVERIES */}
      {activeTab === 'deliveries' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Log a Delivery
              <InfoTip text="One row per collection: which member delivered, how much, and at what price. This is what the next payout run pays the member for, net of any advances they've drawn." label="What a delivery is" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!deliveryBuyerId || !deliveryMember || !deliveryProduceType || !deliveryQty || !deliveryUnitPrice) return
                logDeliveryMutation.mutate()
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Buyer</label>
                <select value={deliveryBuyerId} onChange={(e) => setDeliveryBuyerId(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                  <option value="">Select buyer...</option>
                  {buyers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Member</label>
                <MemberPicker search={deliveryMemberSearch} setSearch={setDeliveryMemberSearch} selected={deliveryMember} setSelected={setDeliveryMember} />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Produce Type</label>
                <select value={deliveryProduceType} onChange={(e) => setDeliveryProduceType(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                  <option value="">Select produce type...</option>
                  {produceTypes.map((pt: any) => <option key={pt.id} value={pt.name}>{pt.name} ({pt.unit})</option>)}
                </select>
                <div className="flex gap-1.5 mt-1.5">
                  <input
                    type="text"
                    placeholder="New type e.g. Tea leaf"
                    value={newProduceTypeName}
                    onChange={(e) => setNewProduceTypeName(e.target.value)}
                    className="flex-1 p-1.5 border rounded bg-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Unit e.g. kg"
                    value={newProduceTypeUnit}
                    onChange={(e) => setNewProduceTypeUnit(e.target.value)}
                    className="w-20 p-1.5 border rounded bg-white text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => newProduceTypeName && newProduceTypeUnit && createProduceTypeMutation.mutate({ name: newProduceTypeName, unit: newProduceTypeUnit })}
                    disabled={!newProduceTypeName || !newProduceTypeUnit || createProduceTypeMutation.isPending}
                    className="px-2 bg-surface-2 border border-ink-faint rounded text-[11px] font-semibold"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Delivery Date</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full p-2 border rounded bg-white" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-ink-muted mb-1 block">Quantity</label>
                  <input type="number" step="0.01" value={deliveryQty} onChange={(e) => setDeliveryQty(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Unit Price (KES)</label>
                  <input type="number" step="0.01" value={deliveryUnitPrice} onChange={(e) => setDeliveryUnitPrice(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Grade (Optional)</label>
                <input type="text" placeholder="e.g. AA" value={deliveryGrade} onChange={(e) => setDeliveryGrade(e.target.value)} className="w-full p-2 border rounded bg-white" />
              </div>

              <button
                type="submit"
                disabled={logDeliveryMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Log Delivery
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-base text-ink">Delivery Log</div>
              <select value={deliveryFilterBuyer} onChange={(e) => setDeliveryFilterBuyer(e.target.value)} className="p-1.5 border rounded bg-white text-[11px]">
                <option value="">All buyers</option>
                {buyers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Buyer</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Gross Value</th>
                    <th className="py-2 px-3">Paid Out?</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isDeliveriesLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading deliveries...</td></tr>
                  ) : deliveries.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No deliveries logged yet.</td></tr>
                  ) : (
                    deliveries.map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-2 px-3 text-ink-muted">{d.date}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{buyers.find((b: any) => b.id === d.buyer)?.name ?? '—'}</td>
                        <td className="py-2 px-3">{Number(d.quantity ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 font-bold">KES {Number(d.gross_value ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          {d.payout_line ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-mint-50 text-mint-700 border border-mint-200">Paid</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">Pending payout</span>
                          )}
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

      {/* TAB 3: ADVANCES */}
      {activeTab === 'advances' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Crop Advance
              <InfoTip text="An instant cash advance against a member's trailing produce value — not a fixed-instalment loan. It's recovered automatically out of their next payout run(s) until cleared." label="What a crop advance is" />
            </div>

            <div>
              <label className="text-ink-muted mb-1 block">Member</label>
              <MemberPicker search={advanceMemberSearch} setSearch={setAdvanceMemberSearch} selected={advanceMember} setSelected={setAdvanceMember} />
            </div>

            {advanceMember && (
              <div className="bg-surface-2 rounded p-2.5 space-y-1 border border-ink-faint">
                <div className="flex justify-between"><span className="text-ink-muted">Trailing delivery value</span><span className="font-semibold">KES {Number(advanceLimit?.trailing_delivery_value ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Limit ({advanceLimit?.limit_percent ?? 0}%)</span><span className="font-semibold">KES {Number(advanceLimit?.limit ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Already drawn</span><span className="font-semibold">KES {Number(advanceLimit?.already_drawn ?? 0).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-1 mt-1"><span className="text-ink font-bold">Available</span><span className="font-bold text-mint-700">KES {Number(advanceLimit?.available ?? 0).toLocaleString()}</span></div>
              </div>
            )}

            <div>
              <label className="text-ink-muted mb-1 block">Amount (KES)</label>
              <input type="number" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="w-full p-2 border rounded bg-white" required />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Disbursement Rail</label>
              <select value={advanceRail} onChange={(e) => setAdvanceRail(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                <option value="BOSA">BOSA Savings Account</option>
                <option value="FOSA">FOSA Account (DT-SACCO Only)</option>
                <option value="MPESA">Direct M-Pesa B2C (DT-SACCO Only)</option>
              </select>
            </div>
            <button
              onClick={() => advanceMember && advanceAmount && requestAdvanceMutation.mutate()}
              disabled={!advanceMember || !advanceAmount || requestAdvanceMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Disburse Advance
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Active &amp; Past Advances</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Member</th>
                    <th className="py-2 px-3">Principal</th>
                    <th className="py-2 px-3">Outstanding</th>
                    <th className="py-2 px-3">Rail</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isAdvancesLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading advances...</td></tr>
                  ) : advances.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No crop advances disbursed yet.</td></tr>
                  ) : (
                    advances.map((a: any) => (
                      <tr key={a.id}>
                        <td className="py-2 px-3 font-mono text-ink-soft">{String(a.membership).slice(0, 8)}…</td>
                        <td className="py-2 px-3 font-bold">KES {Number(a.principal ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3">KES {Number(a.outstanding_balance ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-violet-700 font-semibold">{a.disbursement_rail}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            a.status === 'ACTIVE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            a.status === 'CLEARED' ? 'bg-mint-50 text-mint-700 border-mint-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>{a.status}</span>
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

      {/* TAB 4: PAYOUT RUNS */}
      {activeTab === 'payouts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink">Create Produce Payout Run</div>
            <div>
              <label className="text-ink-muted mb-1 block">Buyer</label>
              <select
                value={selectedBuyer}
                onChange={(e) => setSelectedBuyer(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Select Buyer...</option>
                {buyers.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-ink-muted block mb-1">Start Date</label>
                <input
                  type="date"
                  value={payoutStart}
                  onChange={(e) => setPayoutStart(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-ink-muted block mb-1">End Date</label>
                <input
                  type="date"
                  value={payoutEnd}
                  onChange={(e) => setPayoutEnd(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Payout Rail Destination</label>
              <select
                value={payoutDest}
                onChange={(e) => setPayoutDest(e.target.value as any)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="BOSA">BOSA Savings Account</option>
                <option value="FOSA">FOSA Account (DT-SACCO Only)</option>
                <option value="MPESA">Direct M-Pesa B2C (DT-SACCO Only)</option>
              </select>
            </div>
            <button
              onClick={() => {
                if (!selectedBuyer) return
                createPayoutRunMutation.mutate({
                  buyer: selectedBuyer,
                  period_start: payoutStart,
                  period_end: payoutEnd,
                  destination: payoutDest,
                })
              }}
              disabled={!selectedBuyer || createPayoutRunMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Generate Net Payout Run
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Produce Payout Runs</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Destination</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isPayoutsLoading ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading payout runs...</td></tr>
                  ) : payoutRuns.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No payout runs generated.</td></tr>
                  ) : (
                    payoutRuns.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-bold">{p.period_start} to {p.period_end}</td>
                        <td className="py-2 px-3 font-semibold text-violet-700">{p.destination}</td>
                        <td className="py-2 px-3 font-bold">{p.status}</td>
                        <td className="py-2 px-3 text-right">
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => approvePayoutRunMutation.mutate(p.id)}
                              className="px-2 py-1 bg-mint-600 text-white rounded font-bold text-[10px]"
                            >
                              Approve Run
                            </button>
                          )}
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

      {/* TAB 5: AGRO-DEALERS */}
      {activeTab === 'dealers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Register Agro-Dealer
              <InfoTip text="An input supplier (seed, feed, fertilizer) that an in-kind loan can pay directly instead of the member — set up here, then chosen as the disbursement destination when that loan is disbursed." label="What an agro-dealer is" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!dealerName) return
                createDealerMutation.mutate()
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Dealer Name</label>
                <input type="text" placeholder="e.g. Elgon Kenya Agrovet" value={dealerName} onChange={(e) => setDealerName(e.target.value)} className="w-full p-2 border rounded bg-white" required />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Default Disbursement Rail</label>
                <select value={dealerRail} onChange={(e) => setDealerRail(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                  <option value="BANK">Bank transfer (manual)</option>
                  <option value="B2C">M-Pesa B2C</option>
                </select>
              </div>
              {dealerRail === 'BANK' ? (
                <>
                  <div>
                    <label className="text-ink-muted mb-1 block">Bank Name</label>
                    <input type="text" placeholder="e.g. Equity Bank" value={dealerBankName} onChange={(e) => setDealerBankName(e.target.value)} className="w-full p-2 border rounded bg-white" />
                  </div>
                  <div>
                    <label className="text-ink-muted mb-1 block">Bank Account Number</label>
                    <input type="text" value={dealerAccountNumber} onChange={(e) => setDealerAccountNumber(e.target.value)} className="w-full p-2 border rounded bg-white" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-ink-muted mb-1 block">M-Pesa Phone / Till Number</label>
                  <input type="text" placeholder="e.g. 254712345678" value={dealerPhone} onChange={(e) => setDealerPhone(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
              )}
              <button
                type="submit"
                disabled={createDealerMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Dealer
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Registered Agro-Dealers</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Rail</th>
                    <th className="py-2 px-3">Bank / Phone</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isDealersLoading ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading agro-dealers...</td></tr>
                  ) : dealers.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No agro-dealers registered.</td></tr>
                  ) : (
                    dealers.map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-2 px-3 font-semibold text-ink">{d.name}</td>
                        <td className="py-2 px-3 text-violet-700 font-semibold">{d.default_rail === 'BANK' ? 'Bank transfer' : 'M-Pesa B2C'}</td>
                        <td className="py-2 px-3 text-ink-muted">{d.default_rail === 'BANK' ? `${d.bank_name || '—'} ${d.bank_account_number || ''}` : d.phone_number || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${d.is_active ? 'bg-mint-50 text-mint-700 border-mint-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {d.is_active ? 'Active' : 'Inactive'}
                          </span>
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
    </div>
  )
}

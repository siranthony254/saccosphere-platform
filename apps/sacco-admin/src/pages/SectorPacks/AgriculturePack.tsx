import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

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

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: buyers = [], isLoading: isBuyersLoading } = useQuery({
    queryKey: ['agri-buyers'],
    queryFn: () => api.agriculture.getBuyers(),
  })

  // NOTE: the Deliveries, Advances and Agro-dealers tabs are registered
  // below but have no body yet — a dedicated follow-up pass, not part of
  // this correctness fix. Their queries aren't fetched until that's built,
  // to avoid paying for unused network calls on every page load.

  const { data: payoutRuns = [], isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['agri-payout-runs'],
    queryFn: () => api.agriculture.getPayoutRuns(),
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
          <div className="text-xl font-bold text-ink">Agriculture Sector Pack</div>
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
    </div>
  )
}

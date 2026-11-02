import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'

export function TransportPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'vehicles' | 'crew' | 'levy' | 'compliance'>('vehicles')

  // Vehicle form — VehicleRegisterSerializer requires an owning membership,
  // not just the plate/type/value.
  const [plate, setPlate] = useState('')
  const [vehicleType, setVehicleType] = useState<'PSV' | 'BODA' | 'OTHER'>('PSV')
  const [acqValue, setAcqValue] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerMembershipId, setOwnerMembershipId] = useState('')
  const { data: ownerResults } = useMembers({ search: ownerSearch || undefined })
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [groundReason, setGroundReason] = useState('')

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: vehicles = [], isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: () => api.transport.getVehicles(),
  })

  const { data: complianceData } = useQuery({
    queryKey: ['transport-compliance-calendar'],
    queryFn: () => api.transport.getComplianceCalendar(),
  })

  // Mutations
  const registerVehicleMutation = useMutation({
    mutationFn: (data: { membership: string; plate: string; vehicle_type: 'PSV' | 'BODA' | 'OTHER'; acquisition_value: number }) =>
      api.transport.registerVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-vehicles'] })
      setPlate('')
      setAcqValue('')
      setOwnerSearch('')
      setOwnerMembershipId('')
      setMsg('Vehicle registered in asset & transport register.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register this vehicle.'),
  })

  const groundVehicleMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) => api.transport.groundVehicle(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-vehicles'] })
      setSelectedVehicle(null)
      setGroundReason('')
      setMsg('Vehicle operational status set to GROUNDED. Collateral payout & new pledges blocked.')
      setTimeout(() => setMsg(null), 4000)
    },
    // The collateral engine can refuse this (CollateralError) — surface it
    // rather than failing silently.
    onError: (err: any) => setMsg(err?.message || 'Failed to ground this vehicle.'),
  })

  const reinstateVehicleMutation = useMutation({
    mutationFn: (id: string) => api.transport.reinstateVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-vehicles'] })
      setSelectedVehicle(null)
      setMsg('Vehicle operational status REINSTATED to ACTIVE.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to reinstate this vehicle.'),
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink">Transport Sector Pack</div>
          <div className="text-xs text-ink-muted">
            PSV &amp; Boda fleet register, grounding collateral blocks, 5-document compliance reminders, crew assignments &amp; daily plate paybill levy collection.
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
          onClick={() => setActiveTab('vehicles')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'vehicles'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Fleet Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'compliance'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Compliance Calendar &amp; Reminders
        </button>
      </div>

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink">Register Fleet Vehicle</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!plate || !acqValue || !ownerMembershipId) return
                registerVehicleMutation.mutate({
                  membership: ownerMembershipId,
                  plate,
                  vehicle_type: vehicleType,
                  acquisition_value: Number(acqValue),
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Owning member</label>
                <input
                  type="text"
                  placeholder="Search by email or member number"
                  value={ownerMembershipId ? '' : ownerSearch}
                  onChange={(e) => { setOwnerSearch(e.target.value); setOwnerMembershipId('') }}
                  className="w-full p-2 border rounded bg-white"
                  disabled={!!ownerMembershipId}
                />
                {ownerMembershipId ? (
                  <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1">
                    <span className="text-ink font-medium">Selected</span>
                    <button type="button" onClick={() => setOwnerMembershipId('')} className="text-violet-700 font-semibold">Change</button>
                  </div>
                ) : ownerSearch && (ownerResults?.results ?? []).length > 0 ? (
                  <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                    {(ownerResults?.results ?? []).map((m: any) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => { setOwnerMembershipId(m.id); setOwnerSearch(`${m.first_name} ${m.last_name}`) }}
                        className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded"
                      >
                        {m.first_name} {m.last_name} · {m.member_number}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Number Plate</label>
                <input
                  type="text"
                  placeholder="e.g. KDA 123A"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full p-2 border rounded font-mono font-bold bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="PSV">PSV (Matatu / Bus / Shuttle)</option>
                  <option value="BODA">BODA (Motorcycle)</option>
                  <option value="OTHER">OTHER (Commercial / Truck)</option>
                </select>
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Acquisition Value (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500000"
                  value={acqValue}
                  onChange={(e) => setAcqValue(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={registerVehicleMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Vehicle
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Vehicle Fleet &amp; Grounding Controls</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Plate</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Value</th>
                    <th className="py-2 px-3">Operational Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isVehiclesLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading fleet...</td></tr>
                  ) : vehicles.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No fleet vehicles registered.</td></tr>
                  ) : (
                    vehicles.map((v: any) => (
                      <tr key={v.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{v.registration_number || v.identifier}</td>
                        <td className="py-2.5 px-3 uppercase">{v.vehicle_type || 'PSV'}</td>
                        <td className="py-2.5 px-3 font-bold">KES {Number(v.acquisition_value ?? 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              v.operational_status === 'GROUNDED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-mint-50 text-mint-700 border border-mint-200'
                            }`}
                          >
                            {v.operational_status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedVehicle(v)}
                            className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedVehicle && (
              <div className="border-t pt-3 mt-3 space-y-3 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">Ground / Reinstate {selectedVehicle.registration_number || selectedVehicle.identifier}</div>
                {selectedVehicle.operational_status === 'GROUNDED' ? (
                  <button
                    onClick={() => reinstateVehicleMutation.mutate(selectedVehicle.id)}
                    disabled={reinstateVehicleMutation.isPending}
                    className="px-3 py-1.5 bg-mint-600 text-white font-bold text-xs rounded cursor-pointer"
                  >
                    Reinstate to Active Roadworthiness
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Grounding reason (e.g. Expired speed governor certificate)..."
                      value={groundReason}
                      onChange={(e) => setGroundReason(e.target.value)}
                      className="w-full p-2 border rounded bg-white text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!groundReason) return
                        groundVehicleMutation.mutate({ id: selectedVehicle.id, reason: groundReason })
                      }}
                      disabled={!groundReason || groundVehicleMutation.isPending}
                      className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded cursor-pointer"
                    >
                      Ground Vehicle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm text-xs">
          <div className="font-bold text-base text-ink">Fleet Compliance Calendar &amp; NTSA Minimums</div>
          <div className="p-3 bg-surface-2 rounded border font-mono">
            {JSON.stringify(complianceData ?? { message: 'All 5 compliance document types (Road Service, Inspection, PSV, Insurance, Speed Governor) actively monitored.' }, null, 2)}
          </div>
        </div>
      )}
    </div>
  )
}

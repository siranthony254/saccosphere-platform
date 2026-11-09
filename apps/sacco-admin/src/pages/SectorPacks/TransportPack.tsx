import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'
import { useSacco } from '../../hooks/useSacco'
import { ModuleGate } from '../../components/ui/ModuleGate'
import { InfoTip } from '@saccosphere/ui'

const CREW_MANAGEMENT_MODULE = 'transport.crew_management'
const LEVY_COLLECTION_MODULE = 'transport.levy_collection'

export function TransportPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'vehicles' | 'crew' | 'levy' | 'compliance'>('vehicles')
  const { data: sacco } = useSacco()

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

  // Crew form state
  const [crewFullName, setCrewFullName] = useState('')
  const [crewIdNumber, setCrewIdNumber] = useState('')
  const [crewRole, setCrewRole] = useState<'DRIVER' | 'CONDUCTOR'>('DRIVER')
  const [crewLicenceNumber, setCrewLicenceNumber] = useState('')
  const [crewLicenceExpiry, setCrewLicenceExpiry] = useState('')
  const [crewPsvBadgeExpiry, setCrewPsvBadgeExpiry] = useState('')
  const [assignVehicleId, setAssignVehicleId] = useState('')
  const [assignCrewId, setAssignCrewId] = useState('')
  const [assignRole, setAssignRole] = useState<'DRIVER' | 'CONDUCTOR'>('DRIVER')

  // Levy form state
  const [levySavingsTypeId, setLevySavingsTypeId] = useState('')
  const [reportStart, setReportStart] = useState('2026-10-01')
  const [reportEnd, setReportEnd] = useState('2026-10-31')

  // Queries
  const { data: vehicles = [], isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['transport-vehicles'],
    queryFn: () => api.transport.getVehicles(),
  })

  const { data: complianceData } = useQuery({
    queryKey: ['transport-compliance-calendar'],
    queryFn: () => api.transport.getComplianceCalendar(),
  })

  const { data: crew = [], isLoading: isCrewLoading } = useQuery({
    queryKey: ['transport-crew'],
    queryFn: () => api.transport.getCrew(),
    enabled: activeTab === 'crew',
  })

  const { data: savingsTypes = [] } = useQuery({
    queryKey: ['savings-types', sacco?.id],
    queryFn: () => api.saccoAdmin.getSavingsTypes(sacco!.id),
    enabled: activeTab === 'levy' && !!sacco?.id,
    staleTime: 300_000,
  })

  const { data: levyReport, isLoading: isLevyReportLoading } = useQuery({
    queryKey: ['transport-levy-report', reportStart, reportEnd],
    queryFn: () => api.transport.getDailyLevyReport({ start_date: reportStart, end_date: reportEnd }),
    enabled: activeTab === 'levy',
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

  const registerCrewMutation = useMutation({
    mutationFn: (data: {
      full_name: string
      id_number: string
      role: 'DRIVER' | 'CONDUCTOR'
      driving_licence_number?: string
      driving_licence_expiry?: string
      psv_badge_expiry?: string
    }) => api.transport.registerCrew(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-crew'] })
      setCrewFullName('')
      setCrewIdNumber('')
      setCrewLicenceNumber('')
      setCrewLicenceExpiry('')
      setCrewPsvBadgeExpiry('')
      setMsg('Crew member registered.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register this crew member.'),
  })

  const assignCrewMutation = useMutation({
    mutationFn: () =>
      api.transport.assignCrew(assignVehicleId, { crew_member: assignCrewId, role: assignRole }),
    onSuccess: () => {
      setAssignVehicleId('')
      setAssignCrewId('')
      setMsg('Crew member assigned to vehicle.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to assign this crew member — they may already be assigned to another vehicle in that role.'),
  })

  const setLevyProductMutation = useMutation({
    mutationFn: () => api.transport.setLevyProduct({ savings_type: levySavingsTypeId }),
    onSuccess: () => setMsg('Levy product configured. Vehicles can now open their daily-levy savings account.'),
    onError: (err: any) => setMsg(err?.message || 'Failed to configure the levy product — the savings type must allow multiple accounts.'),
    onSettled: () => setTimeout(() => setMsg(null), 5000),
  })

  const openLevyAccountMutation = useMutation({
    mutationFn: (vehicleId: string) => api.transport.openLevyAccount(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-vehicles'] })
      setMsg('Levy savings account opened for this vehicle.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to open a levy account — configure the levy product first.'),
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Transport Sector Pack
            <InfoTip text="Tools built for matatu and boda SACCOs: register vehicles, assign drivers/conductors, and collect a daily route levy straight from a paybill." label="About the Transport Sector Pack" />
          </div>
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
          onClick={() => setActiveTab('crew')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'crew'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Crew &amp; Assignments
        </button>
        <button
          onClick={() => setActiveTab('levy')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'levy'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Daily Levy Collection
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
                        <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{v.plate}</td>
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
                <div className="font-bold text-ink">Ground / Reinstate {selectedVehicle.plate}</div>
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

      {/* TAB: CREW */}
      {activeTab === 'crew' && (
        <ModuleGate module={CREW_MANAGEMENT_MODULE} moduleName="Crew management">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
              <div className="font-bold text-base text-ink flex items-center gap-1.5">
                Register Crew Member
                <InfoTip text="Drivers and conductors — employees, not necessarily SACCO members. Licence and PSV badge expiry dates feed the same compliance tracking as vehicle documents." label="About crew records" />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!crewFullName || !crewIdNumber) return
                  registerCrewMutation.mutate({
                    full_name: crewFullName,
                    id_number: crewIdNumber,
                    role: crewRole,
                    driving_licence_number: crewLicenceNumber || undefined,
                    driving_licence_expiry: crewLicenceExpiry || undefined,
                    psv_badge_expiry: crewPsvBadgeExpiry || undefined,
                  })
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-ink-muted mb-1 block">Full Name</label>
                  <input type="text" value={crewFullName} onChange={(e) => setCrewFullName(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">National ID Number</label>
                  <input type="text" value={crewIdNumber} onChange={(e) => setCrewIdNumber(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Role</label>
                  <select value={crewRole} onChange={(e) => setCrewRole(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                    <option value="DRIVER">Driver</option>
                    <option value="CONDUCTOR">Conductor</option>
                  </select>
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Driving Licence Number (Optional)</label>
                  <input type="text" value={crewLicenceNumber} onChange={(e) => setCrewLicenceNumber(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Licence Expiry (Optional)</label>
                  <input type="date" value={crewLicenceExpiry} onChange={(e) => setCrewLicenceExpiry(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
                {crewRole === 'DRIVER' && (
                  <div>
                    <label className="text-ink-muted mb-1 block">PSV Badge Expiry (Optional)</label>
                    <input type="date" value={crewPsvBadgeExpiry} onChange={(e) => setCrewPsvBadgeExpiry(e.target.value)} className="w-full p-2 border rounded bg-white" />
                  </div>
                )}
                <button type="submit" disabled={registerCrewMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                  Register Crew Member
                </button>
              </form>

              <div className="border-t pt-3 space-y-2">
                <div className="font-bold text-ink">Assign to Vehicle</div>
                <select value={assignVehicleId} onChange={(e) => setAssignVehicleId(e.target.value)} className="w-full p-2 border rounded bg-white">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate}</option>)}
                </select>
                <select value={assignCrewId} onChange={(e) => setAssignCrewId(e.target.value)} className="w-full p-2 border rounded bg-white">
                  <option value="">Select crew member...</option>
                  {crew.map((c: any) => <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>)}
                </select>
                <select value={assignRole} onChange={(e) => setAssignRole(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                  <option value="DRIVER">As Driver</option>
                  <option value="CONDUCTOR">As Conductor</option>
                </select>
                <button
                  onClick={() => assignVehicleId && assignCrewId && assignCrewMutation.mutate()}
                  disabled={!assignVehicleId || !assignCrewId || assignCrewMutation.isPending}
                  className="w-full py-2 bg-surface-2 border border-ink-faint text-ink font-bold rounded cursor-pointer"
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
              <div className="font-bold text-base text-ink mb-3">Registered Crew</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted bg-surface-2">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">ID Number</th>
                      <th className="py-2 px-3">Licence Expiry</th>
                      <th className="py-2 px-3">PSV Badge Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isCrewLoading ? (
                      <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading crew...</td></tr>
                    ) : crew.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No crew registered.</td></tr>
                    ) : (
                      crew.map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2 px-3 font-semibold text-ink">{c.full_name}</td>
                          <td className="py-2 px-3 text-violet-700 font-semibold">{c.role}</td>
                          <td className="py-2 px-3 font-mono">{c.id_number}</td>
                          <td className="py-2 px-3 text-ink-muted">{c.driving_licence_expiry || '—'}</td>
                          <td className="py-2 px-3 text-ink-muted">{c.psv_badge_expiry || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ModuleGate>
      )}

      {/* TAB: LEVY */}
      {activeTab === 'levy' && (
        <ModuleGate module={LEVY_COLLECTION_MODULE} moduleName="Levy collection">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
              <div className="font-bold text-base text-ink flex items-center gap-1.5">
                Levy Product &amp; Accounts
                <InfoTip text="One savings type collects every vehicle's daily route levy, paid straight from the vehicle's own paybill/plate alias. Set it once, then open each vehicle's own levy account below." label="How daily levy collection works" />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Levy Savings Type</label>
                <select value={levySavingsTypeId} onChange={(e) => setLevySavingsTypeId(e.target.value)} className="w-full p-2 border rounded bg-white">
                  <option value="">Select savings type...</option>
                  {savingsTypes.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
                <div className="text-ink-faint mt-1">Must allow multiple accounts per member (one levy saving per vehicle, same owner).</div>
              </div>
              <button
                onClick={() => levySavingsTypeId && setLevyProductMutation.mutate()}
                disabled={!levySavingsTypeId || setLevyProductMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Set Levy Product
              </button>

              <div className="border-t pt-3">
                <div className="font-bold text-ink mb-2">Per-Vehicle Levy Accounts</div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {vehicles.length === 0 ? (
                    <div className="text-ink-muted">No vehicles registered yet.</div>
                  ) : (
                    vehicles.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between bg-surface-2 rounded px-2 py-1.5">
                        <span className="font-mono font-semibold text-ink">{v.plate}</span>
                        {v.levy_saving_id ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-mint-50 text-mint-700 border border-mint-200">Active</span>
                        ) : (
                          <button
                            onClick={() => openLevyAccountMutation.mutate(v.id)}
                            disabled={openLevyAccountMutation.isPending}
                            className="px-2 py-0.5 bg-violet-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Open Account
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="font-bold text-base text-ink">Daily Collection Report</div>
                <div className="flex items-end gap-2">
                  <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className="p-1.5 border rounded bg-white text-[11px]" />
                  <span className="text-ink-muted">to</span>
                  <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className="p-1.5 border rounded bg-white text-[11px]" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted bg-surface-2">
                      <th className="py-2 px-3">Plate</th>
                      <th className="py-2 px-3">Route</th>
                      <th className="py-2 px-3 text-right">Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLevyReportLoading ? (
                      <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading report...</td></tr>
                    ) : (levyReport?.by_vehicle ?? []).length === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No levy collections in this period.</td></tr>
                    ) : (
                      levyReport.by_vehicle.map((row: any) => (
                        <tr key={row.vehicle_id}>
                          <td className="py-2 px-3 font-mono font-semibold text-ink">{row.plate}</td>
                          <td className="py-2 px-3 text-ink-muted">{row.route || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-right font-bold">KES {Number(row.total ?? 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {levyReport?.by_route && Object.keys(levyReport.by_route).length > 0 && (
                <div className="border-t pt-2">
                  <div className="font-bold text-ink mb-1.5">By Route</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(levyReport.by_route).map(([route, total]: [string, any]) => (
                      <div key={route} className="bg-surface-2 rounded px-2 py-1">
                        <span className="text-ink-muted">{route}:</span> <span className="font-bold text-ink">KES {Number(total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModuleGate>
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

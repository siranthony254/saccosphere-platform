import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'

export function HealthcarePack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'facilities' | 'fasttrack' | 'emergencybosa'>('facilities')

  // Facility form
  const [facName, setFacName] = useState('')
  const [facCode, setFacCode] = useState('')

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: facilities = [], isLoading: isFacLoading } = useQuery({
    queryKey: ['health-facilities'],
    queryFn: () => api.healthcare.getFacilities(),
  })

  const { data: fastTrackLogs = [], isLoading: isFastTrackLoading } = useQuery({
    queryKey: ['health-fasttrack'],
    queryFn: () => api.healthcare.getFastTrackDisbursements(),
  })

  const { data: emergencyReleases = [], isLoading: isEmergencyLoading } = useQuery({
    queryKey: ['health-emergency-bosa'],
    queryFn: () => api.healthcare.getEmergencyBosaReleases(),
  })

  // Mutations
  const registerFacilityMutation = useMutation({
    mutationFn: (data: any) => api.healthcare.registerFacility(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-facilities'] })
      setFacName('')
      setFacCode('')
      setMsg('Healthcare facility registered.')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  const reportBoardMutation = useMutation({
    mutationFn: (id: string) => api.healthcare.reportToBoardEmergencyBosaRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-emergency-bosa'] })
      setMsg('Emergency BOSA release marked as reported to the board.')
      setTimeout(() => setMsg(null), 4000)
    },
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Healthcare Sector Pack
            <InfoTip text="Tools built for health-worker SACCOs: fast-track emergency loans, training/CPD financing paid directly to the provider, and equipment loans." label="About the Healthcare Sector Pack" />
          </div>
          <div className="text-xs text-ink-muted">
            Hospital/Clinic registry, fast-track emergency loan SLA monitoring, CPD training provider direct disbursements &amp; Emergency BOSA release exceptions.
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
          onClick={() => setActiveTab('facilities')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'facilities'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Healthcare Facilities ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('fasttrack')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'fasttrack'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Fast-Track SLA Monitor
        </button>
        <button
          onClick={() => setActiveTab('emergencybosa')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'emergencybosa'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Emergency BOSA Releases
        </button>
      </div>

      {/* TAB 1: FACILITIES */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink">Register Facility</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!facName || !facCode) return
                registerFacilityMutation.mutate({ name: facName, code: facCode })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kenyatta National Hospital / Aga Khan"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Facility Code</label>
                <input
                  type="text"
                  placeholder="e.g. KNH-001"
                  value={facCode}
                  onChange={(e) => setFacCode(e.target.value)}
                  className="w-full p-2 border rounded bg-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={registerFacilityMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Facility
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Registered Facilities</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isFacLoading ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">Loading facilities...</td></tr>
                  ) : facilities.length === 0 ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">No facilities registered.</td></tr>
                  ) : (
                    facilities.map((f: any) => (
                      <tr key={f.id}>
                        <td className="py-2 px-3 font-mono font-bold text-violet-700">{f.code}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{f.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAST-TRACK SLA */}
      {activeTab === 'fasttrack' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3">
          <div className="font-bold text-base text-ink">Fast-Track Emergency Loan SLA Disburse Logs</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">Loan ID</th>
                  <th className="py-2 px-3">Requested At</th>
                  <th className="py-2 px-3">Hours to Disburse</th>
                  <th className="py-2 px-3">Met Same-Day SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isFastTrackLoading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading SLA logs...</td></tr>
                ) : fastTrackLogs.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No fast-track disbursements logged.</td></tr>
                ) : (
                  fastTrackLogs.map((l: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-bold text-violet-700">{l.loan_id}</td>
                      <td className="py-2 px-3 text-ink-muted">{l.requested_at ? new Date(l.requested_at).toLocaleString() : '—'}</td>
                      <td className="py-2 px-3 font-bold">{l.hours_to_disburse ?? 0} Hours</td>
                      <td className="py-2 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${l.met_sla ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'}`}>
                          {l.met_sla ? 'MET SLA' : 'MISSED SLA'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY BOSA */}
      {activeTab === 'emergencybosa' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3">
          <div className="font-bold text-base text-ink">Emergency BOSA Deposit Release Exceptions Queue</div>
          <div className="text-ink-muted mb-2">
            BOSA deposits are non-withdrawable platform-wide. Medical/emergency release requests require maker-checker approval &amp; board reporting.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">Member</th>
                  <th className="py-2 px-3">Amount (KES)</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isEmergencyLoading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading emergency releases...</td></tr>
                ) : emergencyReleases.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No emergency BOSA releases.</td></tr>
                ) : (
                  emergencyReleases.map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-semibold text-ink">{r.member_name || 'Member'}</td>
                      <td className="py-2 px-3 font-bold">KES {Number(r.amount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 font-bold text-violet-700">{r.status}</td>
                      <td className="py-2 px-3 text-right">
                        {r.status === 'RELEASED' && !r.reported_to_board_at && (
                          <button
                            onClick={() => reportBoardMutation.mutate(r.id)}
                            className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded font-bold text-[10px]"
                          >
                            Mark Reported to Board
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
      )}
    </div>
  )
}

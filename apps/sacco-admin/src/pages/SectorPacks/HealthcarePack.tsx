import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'
import { ModuleGate } from '../../components/ui/ModuleGate'
import { StepUpModal } from '../../components/auth/StepUpModal'
import { InfoTip } from '@saccosphere/ui'

const EMERGENCY_LOAN_MODULE = 'healthcare.emergency_loan'
const EQUIPMENT_FINANCING_MODULE = 'healthcare.equipment_financing'
const VARIABLE_INCOME_HEALTH_MODULE = 'healthcare.variable_income_health'

type PickedMember = { id: string; label: string }
type PickedLoan = { id: string; label: string }

function MemberPicker({ selected, setSelected }: { selected: PickedMember | null; setSelected: (v: PickedMember | null) => void }) {
  const [search, setSearch] = useState('')
  const { data: results } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or member number"
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
              onClick={() => setSelected({ id: m.id, label: `${m.first_name} ${m.last_name} · ${m.member_number}` })}
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

function LoanPicker({ selected, setSelected }: { selected: PickedLoan | null; setSelected: (v: PickedLoan | null) => void }) {
  const [search, setSearch] = useState('')
  const { data: loans } = useQuery({
    queryKey: ['health-loan-picker'],
    queryFn: () => api.saccoAdmin.getLoans({ status: 'approved' }),
  })
  const matches = search
    ? (loans?.results ?? []).filter((l: any) => `${l.ref} ${l.loan_product_label} ${l.member_name}`.toLowerCase().includes(search.toLowerCase()))
    : []
  return (
    <div>
      <input
        type="text"
        placeholder="Search by loan reference, product or member"
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
      ) : search && matches.length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {matches.slice(0, 20).map((l: any) => (
            <button
              type="button"
              key={l.id}
              onClick={() => setSelected({ id: l.id, label: `${l.ref} — ${l.member_name}` })}
              className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded"
            >
              {l.ref} — {l.member_name} · KES {Number(l.amount_requested ?? 0).toLocaleString()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function HealthcarePack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'facilities' | 'fasttrack' | 'training' | 'equipment' | 'locum' | 'emergencybosa'>('facilities')

  // Facility form
  const [facName, setFacName] = useState('')
  const [facCode, setFacCode] = useState('')
  const [facType, setFacType] = useState<'HOSPITAL' | 'CLINIC' | 'PHARMACY'>('HOSPITAL')

  // Training provider / CPD form
  const [providerName, setProviderName] = useState('')
  const [providerBankName, setProviderBankName] = useState('')
  const [providerBankAccount, setProviderBankAccount] = useState('')
  const [cpdLoan, setCpdLoan] = useState<PickedLoan | null>(null)
  const [cpdProviderId, setCpdProviderId] = useState('')
  const [cpdCourseName, setCpdCourseName] = useState('')
  const [disburseReference, setDisburseReference] = useState('')

  // Locum income ceiling lookup
  const [locumMember, setLocumMember] = useState<PickedMember | null>(null)

  // Emergency BOSA release form
  const [releaseMember, setReleaseMember] = useState<PickedMember | null>(null)
  const [releaseSavingId, setReleaseSavingId] = useState('')
  const [releaseAmount, setReleaseAmount] = useState('')
  const [releaseDescription, setReleaseDescription] = useState('')
  const [releaseEvidence, setReleaseEvidence] = useState<File | null>(null)
  const [stepUpReleaseId, setStepUpReleaseId] = useState<string | null>(null)
  const [stepUpError, setStepUpError] = useState<string | null>(null)

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

  const { data: trainingProviders = [], isLoading: isProvidersLoading } = useQuery({
    queryKey: ['health-training-providers'],
    queryFn: () => api.healthcare.getTrainingProviders(),
    enabled: activeTab === 'training',
  })

  const { data: cpdTerms } = useQuery({
    queryKey: ['health-cpd-terms', cpdLoan?.id],
    queryFn: () => api.healthcare.getCpdTerms(cpdLoan!.id),
    enabled: !!cpdLoan,
    retry: false,
  })

  const { data: equipmentAssets = [], isLoading: isEquipmentLoading } = useQuery({
    queryKey: ['health-equipment-assets'],
    queryFn: () => api.healthcare.getEquipmentAssets(),
    enabled: activeTab === 'equipment',
  })

  const { data: locumCeiling, isLoading: isLocumLoading, error: locumError } = useQuery({
    queryKey: ['health-locum-ceiling', locumMember?.id],
    queryFn: () => api.healthcare.getLocumIncomeCeiling(locumMember!.id),
    enabled: !!locumMember,
    retry: false,
  })

  const { data: releaseMemberDetail } = useQuery({
    queryKey: ['health-release-member', releaseMember?.id],
    queryFn: () => api.saccoAdmin.getMember(releaseMember!.id),
    enabled: !!releaseMember,
  })

  // Mutations
  const registerFacilityMutation = useMutation({
    mutationFn: () => api.healthcare.registerFacility({ name: facName, code: facCode, facility_type: facType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-facilities'] })
      setFacName('')
      setFacCode('')
      setMsg('Healthcare facility registered.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register this facility.'),
  })

  const registerProviderMutation = useMutation({
    mutationFn: () => api.healthcare.registerTrainingProvider({ name: providerName, bank_name: providerBankName || undefined, bank_account_number: providerBankAccount || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-training-providers'] })
      setProviderName('')
      setProviderBankName('')
      setProviderBankAccount('')
      setMsg('CPD training provider registered.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register this training provider.'),
  })

  const setCpdTermsMutation = useMutation({
    mutationFn: () => api.healthcare.setCpdTerms(cpdLoan!.id, { training_provider: cpdProviderId, course_name: cpdCourseName || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-cpd-terms', cpdLoan?.id] })
      setMsg('CPD loan terms set.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to set CPD terms for this loan.'),
  })

  const disburseToProviderMutation = useMutation({
    mutationFn: () => api.healthcare.disburseToTrainingProvider(cpdLoan!.id, { reference: disburseReference || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-cpd-terms', cpdLoan?.id] })
      setDisburseReference('')
      setMsg('Loan disbursed directly to the training provider.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to disburse to the training provider.'),
  })

  const submitReleaseMutation = useMutation({
    mutationFn: () =>
      api.healthcare.submitEmergencyBosaRelease({
        membership: releaseMember!.id,
        saving: releaseSavingId,
        amount: Number(releaseAmount),
        description: releaseDescription,
        evidence: releaseEvidence!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-emergency-bosa'] })
      setReleaseMember(null)
      setReleaseSavingId('')
      setReleaseAmount('')
      setReleaseDescription('')
      setReleaseEvidence(null)
      setMsg('Emergency BOSA release request submitted.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to submit this release request.'),
  })

  const requestApprovalMutation = useMutation({
    mutationFn: (data: { id: string; code?: string }) => api.healthcare.requestApprovalEmergencyBosaRelease(data.id, data.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-emergency-bosa'] })
      setStepUpReleaseId(null)
      setStepUpError(null)
      setMsg('Approval requested for this release.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any, vars) => {
      if (err?.status === 428) {
        setStepUpReleaseId(vars.id)
        setStepUpError(err?.message || null)
        return
      }
      setMsg(err?.message || 'Failed to request approval for this release.')
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
          onClick={() => setActiveTab('training')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'training'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          CPD Training Providers
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'equipment'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Equipment Assets
        </button>
        <button
          onClick={() => setActiveTab('locum')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'locum'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Locum Income Ceiling
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
                registerFacilityMutation.mutate()
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

              <div>
                <label className="text-ink-muted mb-1 block">Facility Type</label>
                <select value={facType} onChange={(e) => setFacType(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                  <option value="HOSPITAL">Hospital</option>
                  <option value="CLINIC">Clinic</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
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

      {/* TAB: CPD TRAINING PROVIDERS — a different sub-module (healthcare.emergency_loan)
          from the one gating this whole page (healthcare.health_facility_registry). */}
      {activeTab === 'training' && (
        <ModuleGate module={EMERGENCY_LOAN_MODULE} moduleName="Training/CPD financing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
              <div className="font-bold text-base text-ink flex items-center gap-1.5">
                Register Training Provider
                <InfoTip text="A CPD (Continuing Professional Development) course provider a loan can pay directly instead of the member." label="What this is for" />
              </div>
              <input type="text" placeholder="Provider name" value={providerName} onChange={(e) => setProviderName(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <input type="text" placeholder="Bank name (optional)" value={providerBankName} onChange={(e) => setProviderBankName(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <input type="text" placeholder="Bank account number (optional)" value={providerBankAccount} onChange={(e) => setProviderBankAccount(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <button
                onClick={() => providerName && registerProviderMutation.mutate()}
                disabled={!providerName || registerProviderMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Provider
              </button>

              <div className="border-t pt-3 space-y-2">
                <div className="font-bold text-ink">Set CPD Loan Terms</div>
                <LoanPicker selected={cpdLoan} setSelected={setCpdLoan} />
                {cpdLoan && (
                  <>
                    <select value={cpdProviderId} onChange={(e) => setCpdProviderId(e.target.value)} className="w-full p-2 border rounded bg-white">
                      <option value="">Select provider...</option>
                      {trainingProviders.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="text" placeholder="Course name (optional)" value={cpdCourseName} onChange={(e) => setCpdCourseName(e.target.value)} className="w-full p-2 border rounded bg-white" />
                    <button
                      onClick={() => cpdProviderId && setCpdTermsMutation.mutate()}
                      disabled={!cpdProviderId || setCpdTermsMutation.isPending}
                      className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
                    >
                      Set Terms
                    </button>
                    {cpdTerms && (
                      <>
                        <input type="text" placeholder="Reference (optional)" value={disburseReference} onChange={(e) => setDisburseReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
                        <button
                          onClick={() => disburseToProviderMutation.mutate()}
                          disabled={disburseToProviderMutation.isPending}
                          className="w-full py-2 bg-mint-600 text-white font-bold rounded cursor-pointer"
                        >
                          Disburse to Provider
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
              <div className="font-bold text-base text-ink mb-3">Registered Training Providers</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted bg-surface-2">
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Bank</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isProvidersLoading ? (
                      <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading providers...</td></tr>
                    ) : trainingProviders.length === 0 ? (
                      <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No training providers registered.</td></tr>
                    ) : (
                      trainingProviders.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-semibold text-ink">{p.name}</td>
                          <td className="py-2 px-3 text-ink-muted">{p.bank_name || '—'} {p.bank_account_number || ''}</td>
                          <td className="py-2 px-3 font-semibold text-violet-700">{p.is_active ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {cpdLoan && cpdTerms?.disbursements?.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="font-bold text-ink mb-2">Disbursements for {cpdLoan.label}</div>
                  <div className="space-y-1">
                    {cpdTerms.disbursements.map((d: any) => (
                      <div key={d.id} className="flex justify-between bg-surface-2 rounded px-2 py-1">
                        <span>{d.status}</span>
                        <span className="font-mono">{d.reference || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModuleGate>
      )}

      {/* TAB: EQUIPMENT ASSETS — a different sub-module (healthcare.equipment_financing). */}
      {activeTab === 'equipment' && (
        <ModuleGate module={EQUIPMENT_FINANCING_MODULE} moduleName="Equipment financing">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Financed Equipment Assets
              <InfoTip text="Medical/clinical equipment financed through this SACCO's asset register, filtered to this healthcare pack's own view." label="About equipment financing" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Identifier</th>
                    <th className="py-2 px-3">Acquisition Value</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isEquipmentLoading ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading equipment assets...</td></tr>
                  ) : equipmentAssets.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No financed equipment yet. Register one from Lending Primitives' Asset Register with class EQUIPMENT.</td></tr>
                  ) : (
                    equipmentAssets.map((e: any) => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-mono font-bold text-ink">{e.identifier}</td>
                        <td className="py-2 px-3 font-bold">KES {Number(e.acquisition_value ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 font-semibold text-violet-700">{e.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ModuleGate>
      )}

      {/* TAB: LOCUM INCOME CEILING — a different sub-module (healthcare.variable_income_health). */}
      {activeTab === 'locum' && (
        <ModuleGate module={VARIABLE_INCOME_HEALTH_MODULE} moduleName="Locum variable-income assessment">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3 max-w-lg">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Locum Affordability Ceiling
              <InfoTip text="Projects how much a shift/locum-based member can afford to repay, from their approved variable-income verification — the same assessment P25's income-verification review queue produces." label="What this shows" />
            </div>
            <MemberPicker selected={locumMember} setSelected={setLocumMember} />
            {locumMember && (
              isLocumLoading ? (
                <div className="text-ink-muted">Loading assessment...</div>
              ) : locumError ? (
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  {(locumError as any)?.message || 'This member has no approved income verification yet.'}
                </div>
              ) : locumCeiling ? (
                <div className="bg-surface-2 rounded p-3 space-y-1.5 border">
                  {Object.entries(locumCeiling).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-ink-muted">{key.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-ink">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </ModuleGate>
      )}

      {/* TAB 2: FAST-TRACK SLA — same healthcare.emergency_loan module as Emergency BOSA. */}
      {activeTab === 'fasttrack' && (
        <ModuleGate module={EMERGENCY_LOAN_MODULE} moduleName="Fast-track emergency loans">
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
        </ModuleGate>
      )}

      {/* TAB 3: EMERGENCY BOSA — same healthcare.emergency_loan module as Fast-Track SLA. */}
      {activeTab === 'emergencybosa' && (
        <ModuleGate module={EMERGENCY_LOAN_MODULE} moduleName="Emergency BOSA release">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Submit Release Request
              <InfoTip text="BOSA deposits are non-withdrawable platform-wide — this is the one exception, for a verified medical emergency, and it still needs a second admin's approval before anything moves." label="Why this needs approval" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Member</label>
              <MemberPicker selected={releaseMember} setSelected={(v) => { setReleaseMember(v); setReleaseSavingId('') }} />
            </div>
            {releaseMember && (
              <>
                <div>
                  <label className="text-ink-muted mb-1 block">Savings Account</label>
                  <select value={releaseSavingId} onChange={(e) => setReleaseSavingId(e.target.value)} className="w-full p-2 border rounded bg-white">
                    <option value="">Select account...</option>
                    {(releaseMemberDetail?.savings_breakdown ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.savings_type} — KES {Number(s.amount ?? 0).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <input type="number" placeholder="Amount (KES)" value={releaseAmount} onChange={(e) => setReleaseAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
                <textarea rows={2} placeholder="Description (e.g. hospital admission for emergency surgery)" value={releaseDescription} onChange={(e) => setReleaseDescription(e.target.value)} className="w-full p-2 border rounded bg-white" />
                <div>
                  <label className="text-ink-muted mb-1 block">Evidence (admission letter / doctor's note)</label>
                  <input type="file" onChange={(e) => setReleaseEvidence(e.target.files?.[0] ?? null)} className="w-full text-[11px]" />
                </div>
                <button
                  onClick={() => releaseSavingId && releaseAmount && releaseDescription && releaseEvidence && submitReleaseMutation.mutate()}
                  disabled={!releaseSavingId || !releaseAmount || !releaseDescription || !releaseEvidence || submitReleaseMutation.isPending}
                  className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
                >
                  Submit Request
                </button>
              </>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Emergency BOSA Deposit Release Exceptions Queue</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Description</th>
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
                        <td className="py-2 px-3 font-semibold text-ink">{r.description}</td>
                        <td className="py-2 px-3 font-bold">KES {Number(r.amount ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 font-bold text-violet-700">{r.status}</td>
                        <td className="py-2 px-3 text-right">
                          {r.status === 'SUBMITTED' && (
                            <button
                              onClick={() => requestApprovalMutation.mutate({ id: r.id })}
                              disabled={requestApprovalMutation.isPending}
                              className="px-2 py-1 bg-blue-600 text-white rounded font-bold text-[10px]"
                            >
                              Request Approval
                            </button>
                          )}
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
        </div>

        <StepUpModal
          isOpen={!!stepUpReleaseId}
          title="Authorize Emergency BOSA Release"
          description="Releasing a locked BOSA deposit requires second-factor staff authorization."
          error={stepUpError}
          onClose={() => { setStepUpReleaseId(null); setStepUpError(null) }}
          onSubmitCode={(code) => stepUpReleaseId && requestApprovalMutation.mutate({ id: stepUpReleaseId, code })}
        />
        </ModuleGate>
      )}
    </div>
  )
}

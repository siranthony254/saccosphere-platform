import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'
import { ModuleGate } from '../../components/ui/ModuleGate'

// The page itself is route-gated on government.gov_payroll_checkoff (see
// router.tsx) - these two tabs are independently overridable P24
// sub-modules (government/views.py), so they need their own gate.
const DUTY_STATION_TRACKING_MODULE = 'government.duty_station_tracking'
const PENSION_ADVANCE_MODULE = 'government.pension_advance'

function MemberPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const { data } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder="Search by email or member number"
        value={value ? '' : search}
        onChange={(e) => { setSearch(e.target.value); onChange('') }}
        className="w-full p-2 border rounded bg-white"
        disabled={!!value}
      />
      {value ? (
        <div className="mt-1 flex items-center justify-between bg-surface-2 rounded px-2 py-1">
          <span className="text-ink font-medium">Member selected</span>
          <button type="button" onClick={() => onChange('')} className="text-violet-700 font-semibold">Change</button>
        </div>
      ) : search && (data?.results ?? []).length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {(data?.results ?? []).map((m: any) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onChange(m.id)}
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

export function GovernmentPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'employers' | 'duty-stations' | 'pensions'>('employers')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 4500) }

  // Employers
  const [empName, setEmpName] = useState('')
  const [empCode, setEmpCode] = useState('')
  const [empLevel, setEmpLevel] = useState<'NATIONAL' | 'COUNTY' | 'AGENCY' | 'PARASTATAL' | 'OTHER'>('NATIONAL')
  const [empPayroll, setEmpPayroll] = useState<'IPPD' | 'GPRS' | 'COUNTY' | 'OTHER'>('OTHER')

  const { data: employers = [] } = useQuery({
    queryKey: ['government-employers'],
    queryFn: () => api.government.getEmployers(),
  })

  const createEmployerMutation = useMutation({
    mutationFn: () => api.government.createEmployer({ name: empName, code: empCode, level: empLevel, payroll_system: empPayroll }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['government-employers'] })
      setEmpName(''); setEmpCode('')
      notify('Employer registered. Manage its payroll file and payments on the Payroll Check-off page.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to register this employer.'),
  })

  // Duty stations
  const [dutyMembershipId, setDutyMembershipId] = useState('')
  const [station, setStation] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  const { data: dutyData, isLoading: isDutyLoading } = useQuery({
    queryKey: ['government-duty-stations', dutyMembershipId],
    queryFn: () => api.government.getDutyStations(dutyMembershipId),
    enabled: !!dutyMembershipId,
  })

  const { data: kycRefreshDue = [] } = useQuery({
    queryKey: ['government-kyc-refresh-due'],
    queryFn: () => api.government.getKycRefreshDue(),
  })

  const addDutyStationMutation = useMutation({
    mutationFn: () => api.government.addDutyStation(dutyMembershipId, { station, department: department || undefined, job_title: jobTitle || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['government-duty-stations', dutyMembershipId] })
      queryClient.invalidateQueries({ queryKey: ['government-kyc-refresh-due'] })
      setStation(''); setDepartment(''); setJobTitle('')
      notify('Transfer recorded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this transfer.'),
  })

  // Pension records
  const [pensionMembershipId, setPensionMembershipId] = useState('')
  const [retirementDate, setRetirementDate] = useState('')
  const [document, setDocument] = useState<File | null>(null)
  const [rejectReasonByRecord, setRejectReasonByRecord] = useState<Record<string, string>>({})

  const { data: pensionRecords = [], isLoading: isPensionLoading } = useQuery({
    queryKey: ['government-pension-records', pensionMembershipId],
    queryFn: () => api.government.getPensionRecords(pensionMembershipId),
    enabled: !!pensionMembershipId,
  })

  const submitPensionMutation = useMutation({
    mutationFn: () => api.government.submitPensionRecord(pensionMembershipId, { retirement_date: retirementDate, document: document! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['government-pension-records', pensionMembershipId] })
      setRetirementDate(''); setDocument(null)
      notify('Evidence submitted — waiting for an officer to verify it.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to submit this pension record.'),
  })

  const verifyPensionMutation = useMutation({
    mutationFn: (id: string) => api.government.verifyPensionRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['government-pension-records', pensionMembershipId] })
      notify('Pension record verified.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to verify this pension record.'),
  })

  const rejectPensionMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) => api.government.rejectPensionRecord(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['government-pension-records', pensionMembershipId] })
      notify('Pension record rejected.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to reject this pension record.'),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Government Sector Pack"
        subtitle="Government-employer registration, transfer tracking, and retirement advance review."
        info="Checking a member against politically-exposed-persons watchlists happens automatically in the background — any hit shows up as a case on the AML & Fraud page, not here. There's nothing to turn on or configure for it."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium">
        {([
          ['employers', `Employers (${employers.length})`],
          ['duty-stations', `Duty Stations & KYC Refresh (${kycRefreshDue.length} flagged)`],
          ['pensions', 'Pension / Retirement Advance'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'employers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Register Government Employer</div>
            <form onSubmit={(e) => { e.preventDefault(); if (!empName || !empCode) return; createEmployerMutation.mutate() }} className="space-y-3">
              <div>
                <label className="text-ink-muted mb-1 block">Employer name</label>
                <input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} className="w-full p-2 border rounded bg-white" required />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Employer code</label>
                <input type="text" value={empCode} onChange={(e) => setEmpCode(e.target.value)} className="w-full p-2 border rounded bg-white font-mono" required />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Level</label>
                <select value={empLevel} onChange={(e) => setEmpLevel(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                  <option value="NATIONAL">NATIONAL</option>
                  <option value="COUNTY">COUNTY</option>
                  <option value="AGENCY">AGENCY</option>
                  <option value="PARASTATAL">PARASTATAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Payroll system</label>
                <select value={empPayroll} onChange={(e) => setEmpPayroll(e.target.value as any)} className="w-full p-2 border rounded bg-white">
                  <option value="IPPD">IPPD</option>
                  <option value="GPRS">GPRS</option>
                  <option value="COUNTY">COUNTY</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <div className="text-ink-muted mt-1">A known payroll system auto-applies an informed-best-effort column mapping, not validated against a real pilot file.</div>
              </div>
              <button type="submit" disabled={createEmployerMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                Register Employer
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Registered Employers</div>
            <div className="text-ink-muted mb-2">Payroll file import/export and remittance schedules are managed on the existing Payroll Check-off screen — not here.</div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Level</th>
                  <th className="py-2 px-3">Payroll system</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employers.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No government employers registered.</td></tr>
                ) : employers.map((e: any) => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-3 font-medium text-ink">{e.name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{e.code}</td>
                    <td className="py-2.5 px-3">{e.level}</td>
                    <td className="py-2.5 px-3">{e.payroll_system}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'duty-stations' && (
        <ModuleGate module={DUTY_STATION_TRACKING_MODULE} moduleName="Duty-station tracking">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Record Duty-Station Transfer</div>
            <MemberPicker value={dutyMembershipId} onChange={setDutyMembershipId} />
            {dutyMembershipId && (
              <form onSubmit={(e) => { e.preventDefault(); if (!station) return; addDutyStationMutation.mutate() }} className="space-y-3">
                <div>
                  <label className="text-ink-muted mb-1 block">Station</label>
                  <input type="text" value={station} onChange={(e) => setStation(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Department (optional)</label>
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Job title (optional)</label>
                  <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full p-2 border rounded bg-white" />
                </div>
                <button type="submit" disabled={addDutyStationMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                  Record Transfer
                </button>
                <div className="text-ink-muted">Append-only — this is always a new row, never an edit of a prior one.</div>
              </form>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-4">
            {dutyMembershipId ? (
              <div>
                <div className="font-bold text-base text-ink mb-2">
                  Transfer Timeline {dutyData?.kyc_refresh_due && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">KYC REFRESH DUE</span>}
                </div>
                <div className="text-ink-muted mb-2">Visibility-only — never blocks anything. Does not refuse a transfer or any other action.</div>
                {isDutyLoading ? (
                  <div className="text-ink-muted py-4 text-center">Loading...</div>
                ) : (dutyData?.records ?? []).length === 0 ? (
                  <div className="text-ink-muted py-4 text-center">No duty-station transfers recorded for this member.</div>
                ) : (
                  <div className="space-y-2">
                    {(dutyData?.records ?? []).map((r: any) => (
                      <div key={r.id} className="border border-[#e5ede9] rounded p-2.5">
                        <div className="font-bold text-ink">{r.station}</div>
                        <div className="text-ink-muted">{r.department || '—'} · {r.job_title || '—'} · effective {r.effective_date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-ink-muted py-4 text-center">Select a member to view or record a duty-station transfer.</div>
            )}

            <div className="border-t pt-3">
              <div className="font-bold text-ink mb-2">Everyone Currently Flagged (capped at 500)</div>
              {kycRefreshDue.length === 0 ? (
                <div className="text-ink-muted">No members currently flagged for a KYC refresh.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-ink-muted bg-surface-2">
                      <th className="py-2 px-3">Member #</th>
                      <th className="py-2 px-3">Station</th>
                      <th className="py-2 px-3">Effective date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {kycRefreshDue.map((r: any) => (
                      <tr key={r.membership_id}>
                        <td className="py-2 px-3">{r.member_number}</td>
                        <td className="py-2 px-3">{r.station}</td>
                        <td className="py-2 px-3">{r.effective_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        </ModuleGate>
      )}

      {activeTab === 'pensions' && (
        <ModuleGate module={PENSION_ADVANCE_MODULE} moduleName="Pension advance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Submit Pension/Retirement Evidence</div>
            <MemberPicker value={pensionMembershipId} onChange={setPensionMembershipId} />
            {pensionMembershipId && (
              <form onSubmit={(e) => { e.preventDefault(); if (!retirementDate || !document) return; submitPensionMutation.mutate() }} className="space-y-3">
                <div>
                  <label className="text-ink-muted mb-1 block">Retirement date</label>
                  <input type="date" value={retirementDate} onChange={(e) => setRetirementDate(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Supporting document</label>
                  <input type="file" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <button type="submit" disabled={submitPensionMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                  Submit Evidence
                </button>
                <div className="text-ink-muted flex items-start gap-1.5">
                  <span>Any admin can verify or reject this on their own — it doesn't need a second approver.</span>
                  <InfoTip text="If a submission is rejected, the member can submit again — the old one stays in the list rather than being overwritten, so there's a full history." label="About resubmission" />
                </div>
              </form>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-2">Pension Records</div>
            <div className="text-ink-muted mb-3">
              The actual loan-level effect is two separate gates, not this screen: approval requires a VERIFIED record and term ≤ months-to-retirement; payout additionally requires a registered Nominee, re-checked at disbursement time. There is no dry-run/preview endpoint.
            </div>
            {!pensionMembershipId ? (
              <div className="text-ink-muted py-4 text-center">Select a member to view their pension records.</div>
            ) : isPensionLoading ? (
              <div className="text-ink-muted py-4 text-center">Loading...</div>
            ) : pensionRecords.length === 0 ? (
              <div className="text-ink-muted py-4 text-center">No pension records submitted for this member.</div>
            ) : (
              <div className="space-y-2">
                {pensionRecords.map((r: any) => (
                  <div key={r.id} className="border border-[#e5ede9] rounded p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-ink">Retirement date: {r.retirement_date}</div>
                        {r.rejection_reason && <div className="text-red-700">Rejected: {r.rejection_reason}</div>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'VERIFIED' ? 'bg-mint-50 text-mint-700 border border-mint-200' : r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => verifyPensionMutation.mutate(r.id)} className="px-2 py-1 bg-mint-600 text-white font-bold text-[10px] rounded cursor-pointer">Verify</button>
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectReasonByRecord[r.id] ?? ''}
                          onChange={(e) => setRejectReasonByRecord((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          className="flex-1 p-1.5 border rounded bg-white text-[10px]"
                        />
                        <button
                          onClick={() => { const reason = rejectReasonByRecord[r.id]; if (reason) rejectPensionMutation.mutate({ id: r.id, reason }) }}
                          disabled={!rejectReasonByRecord[r.id]}
                          className="px-2 py-1 bg-red-600 text-white font-bold text-[10px] rounded cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </ModuleGate>
      )}
    </div>
  )
}

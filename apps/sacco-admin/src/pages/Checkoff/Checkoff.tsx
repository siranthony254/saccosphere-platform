import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'
import {
  useCheckoffEmployers,
  useCreateCheckoffEmployer,
  useUpdateCheckoffEmployer,
  useMemberEmployments,
  useCreateMemberEmployment,
  useUpdateMemberEmployment,
  useCheckoffMandates,
  useCreateCheckoffMandate,
  useEmployerSchedules,
  useCheckoffSchedule,
  useGenerateCheckoffSchedule,
  useLockCheckoffSchedule,
  useImportCheckoffRemittance,
  useRemittanceImport,
  useRemittanceImportLines,
  useCheckoffVariances,
  useResolveCheckoffVariance,
  useRemittanceTimelinessDashboard,
  useArrearsAgeingDashboard,
} from '../../hooks/useCheckoff'

const formatCurrency = (val: number) => `KES ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const inputCls = 'w-full p-2 border border-[#e5ede9] rounded-lg text-xs bg-white'

function EmployerSelector({ employers, value, onChange }: { employers: any[]; value: string | null; onChange: (id: string) => void }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputCls} max-w-xs`}>
      <option value="">Select an employer…</option>
      {employers.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}
    </select>
  )
}

function EmployersTab() {
  const { data: employers = [], isLoading } = useCheckoffEmployers()
  const create = useCreateCheckoffEmployer()
  const update = useUpdateCheckoffEmployer()

  const [form, setForm] = useState({
    name: '', code: '', contact_name: '', contact_phone: '', contact_email: '',
    bank_name: '', bank_account_number: '', payday_day_of_month: '28', remittance_deadline_days: '10',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const evidencePack = useMutation({
    mutationFn: ({ employerId, fmt }: { employerId: string; fmt: 'csv' | 'pdf' }) =>
      api.saccoAdmin.downloadCheckoffEvidencePack(employerId, { file_format: fmt }),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
    onError: () => toast.error('Could not generate the evidence pack.'),
  })

  const handleCreate = () => {
    setFormError(null)
    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Name and code are required.')
      return
    }
    create.mutate(
      {
        name: form.name.trim(),
        code: form.code.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim(),
        bank_name: form.bank_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
        payday_day_of_month: Number(form.payday_day_of_month || 28),
        remittance_deadline_days: Number(form.remittance_deadline_days || 10),
      },
      {
        onSuccess: () => setForm({ name: '', code: '', contact_name: '', contact_phone: '', contact_email: '', bank_name: '', bank_account_number: '', payday_day_of_month: '28', remittance_deadline_days: '10' }),
        onError: (err: any) => setFormError(err?.message || 'Failed to create employer.'),
      }
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
        <div className="font-bold text-sm text-ink">Add employer</div>
        {formError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{formError}</div>}
        <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className={inputCls} placeholder="Code (unique per SACCO)" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
        <input className={inputCls} placeholder="Contact name" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
        <input className={inputCls} placeholder="Contact phone" value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
        <input className={inputCls} placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} />
        <input className={inputCls} placeholder="Bank name" value={form.bank_name} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} />
        <input className={inputCls} placeholder="Bank account number" value={form.bank_account_number} onChange={(e) => setForm((p) => ({ ...p, bank_account_number: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Payday (day of month)</label>
            <input type="number" min={1} max={31} className={inputCls} value={form.payday_day_of_month} onChange={(e) => setForm((p) => ({ ...p, payday_day_of_month: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] text-ink-muted block mb-1">Remittance deadline (days)</label>
            <input type="number" min={1} className={inputCls} value={form.remittance_deadline_days} onChange={(e) => setForm((p) => ({ ...p, remittance_deadline_days: e.target.value }))} />
          </div>
        </div>
        <button onClick={handleCreate} disabled={create.isPending} className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50">
          {create.isPending ? 'Saving…' : 'Add employer'}
        </button>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-2 shadow-sm md:col-span-2">
        <div className="font-bold text-sm text-ink mb-2">Employers</div>
        {isLoading ? (
          <div className="text-xs text-ink-muted py-4">Loading employers…</div>
        ) : employers.length === 0 ? (
          <div className="text-xs text-ink-muted py-4">No employers configured yet.</div>
        ) : (
          <div className="space-y-2">
            {employers.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                <div>
                  <div className="font-semibold text-ink">{e.name} <span className="text-ink-faint font-mono">({e.code})</span></div>
                  <div className="text-ink-muted">{e.contact_name} · {e.contact_phone} · Payday {e.payday_day_of_month} · Remit within {e.remittance_deadline_days}d</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update.mutate({ id: e.id, data: { active: !e.active } })}
                    className="px-2 py-1 rounded border border-ink-faint bg-white text-[10px] font-semibold cursor-pointer hover:bg-surface-1"
                  >
                    {e.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => evidencePack.mutate({ employerId: e.id, fmt: 'csv' })}
                    disabled={evidencePack.isPending}
                    className="px-2 py-1 rounded border border-ink-faint bg-white text-[10px] font-semibold cursor-pointer hover:bg-surface-1 disabled:opacity-50"
                  >
                    Evidence pack (CSV)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmploymentsTab({ employers }: { employers: any[] }) {
  const [employerId, setEmployerId] = useState<string | null>(null)
  const { data: employments = [], isLoading } = useMemberEmployments(employerId)
  const createEmployment = useCreateMemberEmployment(employerId)
  const updateEmployment = useUpdateMemberEmployment(employerId)

  const [memberSearch, setMemberSearch] = useState('')
  const { data: memberResults } = useMembers({ search: memberSearch || undefined })
  const [payrollNumber, setPayrollNumber] = useState('')
  const [activeFrom, setActiveFrom] = useState('')
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [activeEmploymentId, setActiveEmploymentId] = useState<string | null>(null)
  const { data: mandates = [] } = useCheckoffMandates(activeEmploymentId)
  const createMandate = useCreateCheckoffMandate(activeEmploymentId)
  const [mandateType, setMandateType] = useState<'DEPOSIT' | 'SHARES' | 'WELFARE' | 'OTHER'>('DEPOSIT')
  const [mandateAmount, setMandateAmount] = useState('')
  const [mandateFrom, setMandateFrom] = useState('')

  return (
    <div className="space-y-4">
      <EmployerSelector employers={employers} value={employerId} onChange={setEmployerId} />
      {!employerId ? (
        <div className="text-xs text-ink-muted">Pick an employer to manage its member employments.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-2 shadow-sm md:col-span-1">
            <div className="font-bold text-sm text-ink">Enroll a member</div>
            {formError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{formError}</div>}
            <input className={inputCls} placeholder="Search member by email/number" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {(memberResults?.results ?? []).map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMembershipId(m.id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] cursor-pointer ${selectedMembershipId === m.id ? 'bg-violet-50 border border-violet-200' : 'bg-surface-2'}`}
                >
                  {m.first_name} {m.last_name} · {m.member_number}
                </button>
              ))}
            </div>
            <input className={inputCls} placeholder="Payroll number" value={payrollNumber} onChange={(e) => setPayrollNumber(e.target.value)} />
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Active from</label>
              <input type="date" className={inputCls} value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} />
            </div>
            <button
              onClick={() => {
                setFormError(null)
                if (!selectedMembershipId || !payrollNumber.trim() || !activeFrom) {
                  setFormError('Select a member, payroll number and active-from date.')
                  return
                }
                createEmployment.mutate(
                  { membership: selectedMembershipId, payroll_number: payrollNumber.trim(), active_from: activeFrom },
                  {
                    onSuccess: () => { setPayrollNumber(''); setActiveFrom(''); setSelectedMembershipId(null); setMemberSearch('') },
                    onError: (err: any) => setFormError(err?.message || 'Failed to enroll this member.'),
                  }
                )
              }}
              disabled={createEmployment.isPending}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {createEmployment.isPending ? 'Saving…' : 'Enroll'}
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-2 shadow-sm md:col-span-2">
            <div className="font-bold text-sm text-ink mb-2">Member employments</div>
            {isLoading ? (
              <div className="text-xs text-ink-muted py-4">Loading…</div>
            ) : employments.length === 0 ? (
              <div className="text-xs text-ink-muted py-4">No members enrolled with this employer yet.</div>
            ) : (
              <div className="space-y-1.5">
                {employments.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                    <div>
                      <span className="font-mono text-ink-faint">{emp.payroll_number}</span>
                      <span className="ml-2 font-semibold text-ink">{emp.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveEmploymentId(emp.id)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${activeEmploymentId === emp.id ? 'bg-violet-600 text-white' : 'border border-ink-faint bg-white hover:bg-surface-1'}`}
                      >
                        Mandates
                      </button>
                      {emp.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateEmployment.mutate({ id: emp.id, data: { status: 'ENDED', active_to: new Date().toISOString().slice(0, 10) } })}
                          className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-[10px] font-semibold cursor-pointer hover:bg-red-100"
                        >
                          End
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeEmploymentId && (
              <div className="border-t border-[#e5ede9] pt-3 mt-2 space-y-2">
                <div className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Mandates</div>
                {mandates.length === 0 ? (
                  <div className="text-[11px] text-ink-muted">No deduction mandates set — loan instalments need none; set deposit/shares/welfare here.</div>
                ) : (
                  mandates.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-2.5 py-1.5 bg-surface-2 rounded text-[11px]">
                      <span className="font-semibold text-ink">{m.item_type}</span>
                      <span className="text-ink-muted">{formatCurrency(m.amount)}</span>
                      <span className={m.active ? 'text-mint-700' : 'text-ink-faint'}>{m.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))
                )}
                <div className="flex gap-2 items-end pt-2">
                  <select value={mandateType} onChange={(e) => setMandateType(e.target.value as any)} className="p-2 border border-[#e5ede9] rounded text-[11px] bg-white">
                    <option value="DEPOSIT">Deposit</option>
                    <option value="SHARES">Shares</option>
                    <option value="WELFARE">Welfare</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input type="number" placeholder="Amount" value={mandateAmount} onChange={(e) => setMandateAmount(e.target.value)} className="w-24 p-2 border border-[#e5ede9] rounded text-[11px] bg-white" />
                  <input type="date" value={mandateFrom} onChange={(e) => setMandateFrom(e.target.value)} className="p-2 border border-[#e5ede9] rounded text-[11px] bg-white" />
                  <button
                    onClick={() => {
                      if (!mandateAmount || !mandateFrom) return
                      createMandate.mutate(
                        { item_type: mandateType, amount: Number(mandateAmount), effective_from: mandateFrom },
                        { onSuccess: () => { setMandateAmount(''); setMandateFrom('') } }
                      )
                    }}
                    disabled={createMandate.isPending}
                    className="px-3 py-2 rounded bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SchedulesTab({ employers }: { employers: any[] }) {
  const [employerId, setEmployerId] = useState<string | null>(null)
  const { data: schedules = [], isLoading } = useEmployerSchedules(employerId)
  const generate = useGenerateCheckoffSchedule(employerId)
  const lock = useLockCheckoffSchedule(employerId)
  const [period, setPeriod] = useState('')
  const [genError, setGenError] = useState<string | null>(null)

  const [viewScheduleId, setViewScheduleId] = useState<string | null>(null)
  const { data: viewSchedule } = useCheckoffSchedule(viewScheduleId)

  const exportSchedule = useMutation({
    mutationFn: ({ scheduleId, fmt }: { scheduleId: string; fmt: 'csv' | 'xlsx' }) =>
      api.saccoAdmin.downloadCheckoffScheduleExport(scheduleId, fmt),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
    onError: () => toast.error('Could not export this schedule.'),
  })

  return (
    <div className="space-y-4">
      <EmployerSelector employers={employers} value={employerId} onChange={setEmployerId} />
      {!employerId ? (
        <div className="text-xs text-ink-muted">Pick an employer to generate or review its deduction schedules.</div>
      ) : (
        <>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 flex items-end gap-2 shadow-sm">
            <div>
              <label className="text-[10px] text-ink-muted block mb-1">Period (YYYY-MM)</label>
              <input placeholder="2026-10" value={period} onChange={(e) => setPeriod(e.target.value)} className={`${inputCls} w-32`} />
            </div>
            <button
              onClick={() => {
                setGenError(null)
                if (!/^\d{4}-\d{2}$/.test(period)) { setGenError('Enter a period as YYYY-MM.'); return }
                generate.mutate(period, { onError: (err: any) => setGenError(err?.message || 'Failed to generate schedule.') })
              }}
              disabled={generate.isPending}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {generate.isPending ? 'Generating…' : 'Generate schedule'}
            </button>
            {genError && <span className="text-[11px] text-red-600">{genError}</span>}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-2 shadow-sm">
            <div className="font-bold text-sm text-ink mb-2">Schedules</div>
            {isLoading ? (
              <div className="text-xs text-ink-muted py-4">Loading…</div>
            ) : schedules.length === 0 ? (
              <div className="text-xs text-ink-muted py-4">No schedules generated yet.</div>
            ) : (
              <div className="space-y-1.5">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                    <div>
                      <span className="font-semibold text-ink">{s.period}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-1 text-ink-soft">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewScheduleId(s.id)} className="px-2 py-1 rounded border border-ink-faint bg-white text-[10px] font-semibold cursor-pointer hover:bg-surface-1">View</button>
                      <button onClick={() => exportSchedule.mutate({ scheduleId: s.id, fmt: 'csv' })} className="px-2 py-1 rounded border border-ink-faint bg-white text-[10px] font-semibold cursor-pointer hover:bg-surface-1">Export CSV</button>
                      {s.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            if (!window.confirm('Locking is one-way — a correction after this needs a brand-new schedule. Continue?')) return
                            lock.mutate(s.id)
                          }}
                          disabled={lock.isPending}
                          className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-semibold cursor-pointer hover:bg-amber-100 disabled:opacity-50"
                        >
                          Lock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {viewSchedule && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-3 border border-[#e5ede9] max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
                  <div className="font-bold text-base text-ink">{viewSchedule.period} · {viewSchedule.status}</div>
                  <button onClick={() => setViewScheduleId(null)} className="text-ink-muted text-lg font-bold">&times;</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2">Amount</th>
                        <th className="py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ede9]">
                      {viewSchedule.lines.map((l: { id: string; item_type: string; amount: number; status: string }) => (
                        <tr key={l.id}>
                          <td className="py-1.5 px-2">{l.item_type}</td>
                          <td className="py-1.5 px-2">{formatCurrency(l.amount)}</td>
                          <td className="py-1.5 px-2">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RemittancesTab({ employers }: { employers: any[] }) {
  const [employerId, setEmployerId] = useState<string | null>(null)
  const importRemittance = useImportCheckoffRemittance(employerId)
  const [period, setPeriod] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [lastJobId, setLastJobId] = useState<string | null>(null)

  const { data: job } = useRemittanceImport(lastJobId)
  const { data: lines = [] } = useRemittanceImportLines(job?.status === 'COMPLETED' ? lastJobId : null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !employerId) return
    setImportError(null)
    importRemittance.mutate(
      { file, period: period || undefined, bankReference: bankReference || undefined },
      {
        onSuccess: (res) => setLastJobId(res.job_id),
        onError: (err: any) => setImportError(err?.message || 'Failed to import this remittance file.'),
      }
    )
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <EmployerSelector employers={employers} value={employerId} onChange={(id) => { setEmployerId(id); setLastJobId(null) }} />
      {!employerId ? (
        <div className="text-xs text-ink-muted">Pick an employer to import what it actually remitted.</div>
      ) : (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
          <div className="text-[11px] text-ink-faint bg-surface-2 p-2.5 rounded-lg">
            There's no endpoint to browse past remittance imports for an employer — only the one you just
            uploaded shows below. Keep the job ID if you need to find it again later.
          </div>
          {importError && <div className="p-2 bg-red-50 text-red-700 text-xs rounded font-semibold">{importError}</div>}
          <div className="flex gap-2">
            <input placeholder="Period (optional)" value={period} onChange={(e) => setPeriod(e.target.value)} className={inputCls} />
            <input placeholder="Bank reference (optional)" value={bankReference} onChange={(e) => setBankReference(e.target.value)} className={inputCls} />
          </div>
          <label className="inline-block px-4 py-2 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer">
            {importRemittance.isPending ? 'Uploading…' : 'Upload remittance file'}
            <input type="file" onChange={handleFile} className="hidden" disabled={importRemittance.isPending} />
          </label>

          {job && (
            <div className="border-t border-[#e5ede9] pt-3 space-y-2">
              <div className="text-xs font-semibold text-ink">
                Job {job.id.slice(0, 8)} · <span className="text-violet-700">{job.status}</span>
              </div>
              <div className="text-[11px] text-ink-muted">
                {job.processed_rows}/{job.total_rows} rows processed · {job.matched_rows} matched · {job.variance_rows} variances
              </div>
              {job.errors.length > 0 && (
                <div className="text-[11px] text-red-700">{job.errors.join('; ')}</div>
              )}
              {lines.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                        <th className="py-1.5 px-2">Amount</th>
                        <th className="py-1.5 px-2">Match method</th>
                        <th className="py-1.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5ede9]">
                      {lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-1 px-2">{formatCurrency(l.amount)}</td>
                          <td className="py-1 px-2">{l.match_method}</td>
                          <td className="py-1 px-2">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VariancesTab() {
  const [reasonCode, setReasonCode] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data: variances = [], isLoading } = useCheckoffVariances({ reason_code: reasonCode || undefined, status: statusFilter || undefined })
  const resolve = useResolveCheckoffVariance()
  const [resolveModal, setResolveModal] = useState<{ id: string } | null>(null)
  const [notes, setNotes] = useState('')
  const [resolveStatus, setResolveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  return (
    <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
      <div className="flex gap-2">
        <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="px-3 py-1.5 border border-ink-faint rounded-lg text-xs bg-white">
          <option value="">All reasons</option>
          {['UNDER_DEDUCTED', 'OVER_DEDUCTED', 'NOT_ON_PAYROLL', 'LEFT_EMPLOYMENT', 'UNKNOWN_MEMBER', 'NOT_REMITTED'].map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-ink-faint rounded-lg text-xs bg-white">
          <option value="">All statuses</option>
          {['OPEN', 'PENDING_APPROVAL', 'RESOLVED', 'REJECTED'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      {resolveStatus && (
        <div className={`p-2.5 rounded-lg text-xs font-semibold ${resolveStatus.type === 'success' ? 'bg-mint-50 text-mint-700' : 'bg-red-50 text-red-700'}`}>{resolveStatus.message}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#e5ede9] text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-2">
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Created</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5ede9]">
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center text-ink-muted text-sm">Loading variances…</td></tr>
            ) : variances.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-ink-muted text-sm">No variances at this filter.</td></tr>
            ) : (
              variances.map((v) => (
                <tr key={v.id} className="hover:bg-surface-1">
                  <td className="py-2.5 px-3 text-xs font-semibold text-ink">{v.reason_code.replace(/_/g, ' ')}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-2 text-ink-soft">{v.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-ink-muted">{v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {v.status === 'OPEN' && (
                      <button onClick={() => { setResolveModal({ id: v.id }); setNotes(''); setResolveStatus(null) }} className="px-2.5 py-1 rounded border border-ink-faint bg-white hover:bg-surface-2 text-ink text-[11px] font-semibold cursor-pointer">
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl space-y-3 border border-[#e5ede9]">
            <div className="font-bold text-base text-ink">Resolve variance</div>
            <p className="text-[11px] text-ink-muted">
              Some resolutions move money/GL and are maker-checker gated — you may get an immediate result or a
              queued-for-approval one.
            </p>
            <textarea rows={3} placeholder="Resolution notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white" />
            <div className="flex gap-2">
              <button onClick={() => setResolveModal(null)} className="flex-1 py-2 border border-ink-faint rounded text-xs text-ink-muted font-semibold cursor-pointer">Cancel</button>
              <button
                onClick={() => {
                  resolve.mutate(
                    { id: resolveModal.id, data: { notes: notes.trim() || undefined } },
                    {
                      onSuccess: () => {
                        setResolveModal(null)
                        setResolveStatus({ type: 'success', message: 'Variance resolved.' })
                      },
                      onError: (err: any) => setResolveStatus({ type: 'error', message: err?.message || 'Failed to resolve.' }),
                    }
                  )
                }}
                disabled={resolve.isPending}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {resolve.isPending ? 'Resolving…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardsTab() {
  const { data: timeliness = [], isLoading: tLoading } = useRemittanceTimelinessDashboard()
  const { data: arrears, isLoading: aLoading } = useArrearsAgeingDashboard()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
        <div className="font-bold text-sm text-ink mb-3">Remittance timeliness</div>
        {tLoading ? (
          <div className="text-xs text-ink-muted py-4">Loading…</div>
        ) : timeliness.length === 0 ? (
          <div className="text-xs text-ink-muted py-4">No remitted lines yet.</div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                <th className="py-2 px-2">Employer</th>
                <th className="py-2 px-2">On time</th>
                <th className="py-2 px-2">Late</th>
                <th className="py-2 px-2">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ede9]">
              {timeliness.map((row) => (
                <tr key={row.employer_id}>
                  <td className="py-1.5 px-2 font-semibold text-ink">{row.employer_name}</td>
                  <td className="py-1.5 px-2 text-mint-700">{row.on_time}</td>
                  <td className="py-1.5 px-2 text-red-700">{row.late}</td>
                  <td className="py-1.5 px-2">{row.on_time_rate != null ? `${(row.on_time_rate * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
        <div className="font-bold text-sm text-ink mb-3">Arrears ageing</div>
        {aLoading ? (
          <div className="text-xs text-ink-muted py-4">Loading…</div>
        ) : !arrears ? (
          <div className="text-xs text-ink-muted py-4">No data.</div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {Object.entries(arrears.totals).map(([band, amount]) => (
                <div key={band} className="p-2 bg-surface-2 rounded text-center">
                  <div className="text-[10px] text-ink-muted">{band}d</div>
                  <div className="text-xs font-bold text-ink">{formatCurrency(Number(amount))}</div>
                </div>
              ))}
            </div>
            {arrears.by_employer.length > 0 && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-2">Employer</th>
                    <th className="py-2 px-2">90+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {arrears.by_employer.map((row: any) => (
                    <tr key={row.employer_id}>
                      <td className="py-1.5 px-2 font-semibold text-ink">{row.employer_name}</td>
                      <td className="py-1.5 px-2 text-red-700">{formatCurrency(Number(row['90+'] ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function Checkoff() {
  const [tab, setTab] = useState<'employers' | 'employments' | 'schedules' | 'remittances' | 'variances' | 'dashboards'>('employers')
  const { data: employers = [] } = useCheckoffEmployers()

  const TABS: Array<{ key: typeof tab; label: string }> = [
    { key: 'employers', label: 'Employers' },
    { key: 'employments', label: 'Employments & mandates' },
    { key: 'schedules', label: 'Schedules' },
    { key: 'remittances', label: 'Remittances' },
    { key: 'variances', label: 'Variances' },
    { key: 'dashboards', label: 'Dashboards' },
  ]

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-xl font-bold text-ink">Employer payroll check-off</div>
        <div className="text-xs text-ink-muted">
          Admin/payroll-officer only — there is no member-facing "see my own deductions" screen in this
          feature yet, by design of the backend as it stands today.
        </div>
      </div>

      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2.5 px-1 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${tab === t.key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'employers' && <EmployersTab />}
      {tab === 'employments' && <EmploymentsTab employers={employers} />}
      {tab === 'schedules' && <SchedulesTab employers={employers} />}
      {tab === 'remittances' && <RemittancesTab employers={employers} />}
      {tab === 'variances' && <VariancesTab />}
      {tab === 'dashboards' && <DashboardsTab />}
    </div>
  )
}

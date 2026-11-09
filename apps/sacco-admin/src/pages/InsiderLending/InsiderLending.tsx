import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'

type PickedMember = { id: string; label: string }

function MemberPicker({ selected, setSelected, placeholder = 'Search by name or member number' }: { selected: PickedMember | null; setSelected: (v: PickedMember | null) => void; placeholder?: string }) {
  const [search, setSearch] = useState('')
  const { data: results } = useMembers({ search: search || undefined })
  return (
    <div>
      <input
        type="text"
        placeholder={placeholder}
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
      ) : search && (results?.results ?? []).length > 0 ? (
        <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
          {(results?.results ?? []).map((m: any) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setSelected({ id: m.id, label: `${m.first_name} ${m.last_name} · ${m.member_number}` })}
              className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded text-xs"
            >
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  BOARD: 'Board member',
  STAFF: 'Staff',
  RELATIVE: 'Relative of a board member or staff',
}

export function InsiderLending() {
  const [activeTab, setActiveTab] = useState<'declarations' | 'payslips' | 'report'>('declarations')

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Insider Lending"
        subtitle="Board/staff/relative loan declarations, payslip-based affordability inputs, and the insider loan report"
        info="A loan to a board member, staff, or their relative needs extra scrutiny — declare them here so every money decision that depends on it (appraisal routing, approval) catches it, even for a loan they already have."
      />

      <div className="flex gap-2 border-b border-[#e5ede9]">
        {(['declarations', 'payslips', 'report'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer ${activeTab === tab ? 'border-b-2 border-violet-600 text-violet-700' : 'text-ink-muted'}`}
          >
            {tab === 'declarations' ? 'Insider Declarations' : tab === 'payslips' ? 'Payslip Inputs' : 'Insider Loan Report'}
          </button>
        ))}
      </div>

      {activeTab === 'declarations' && <DeclarationsTab />}
      {activeTab === 'payslips' && <PayslipsTab />}
      {activeTab === 'report' && <ReportTab />}
    </div>
  )
}

function DeclarationsTab() {
  const queryClient = useQueryClient()
  const [member, setMember] = useState<PickedMember | null>(null)
  const [category, setCategory] = useState<'BOARD' | 'STAFF' | 'RELATIVE'>('BOARD')
  const [relatedMember, setRelatedMember] = useState<PickedMember | null>(null)
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['insider-declarations'],
    queryFn: () => api.insiderLending.getDeclarations(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.insiderLending.createDeclaration({
        membership: member!.id,
        category,
        related_membership: category === 'RELATIVE' ? relatedMember?.id : undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insider-declarations'] })
      setMember(null)
      setRelatedMember(null)
      setNotes('')
      setMsg('Insider declaration filed.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to file this declaration.'),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
      {msg && <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <Card title="Declare an Insider" className="md:col-span-1">
        <div className="space-y-3">
          <div>
            <label className="text-ink-muted mb-1 block">Member</label>
            <MemberPicker selected={member} setSelected={setMember} />
          </div>
          <div>
            <label className="text-ink-muted mb-1 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full p-2 border border-ink-faint rounded bg-white">
              <option value="BOARD">Board member</option>
              <option value="STAFF">Staff</option>
              <option value="RELATIVE">Relative of a board member or staff</option>
            </select>
          </div>
          {category === 'RELATIVE' && (
            <div>
              <label className="text-ink-muted mb-1 block flex items-center gap-1.5">
                Related To
                <InfoTip text="The board member or staff this person is related to." label="Why this is needed" />
              </label>
              <MemberPicker selected={relatedMember} setSelected={setRelatedMember} placeholder="Search for the board/staff member" />
            </div>
          )}
          <div>
            <label className="text-ink-muted mb-1 block">Notes (Optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
          </div>
          <button
            onClick={() => member && createMutation.mutate()}
            disabled={!member || createMutation.isPending}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
          >
            File Declaration
          </button>
        </div>
      </Card>

      <Card title="Declared Insiders" className="md:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-ink-muted bg-surface-2">
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Notes</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Declared</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading declarations...</td></tr>
              ) : declarations.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No insiders declared yet.</td></tr>
              ) : (
                declarations.map((d: any) => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 font-semibold text-ink">{CATEGORY_LABELS[d.category] ?? d.category}</td>
                    <td className="py-2 px-3 text-ink-muted">{d.notes || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${d.is_active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-surface-2 text-ink-muted border-ink-faint'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-ink-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const PAYSLIP_FIELDS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: 'basic_salary', label: 'Basic Salary', required: true },
  { key: 'gross_pay', label: 'Gross Pay', required: true },
  { key: 'paye', label: 'PAYE' },
  { key: 'nssf', label: 'NSSF' },
  { key: 'shif', label: 'SHIF' },
  { key: 'housing_levy', label: 'Housing Levy' },
  { key: 'existing_loan_deductions', label: 'Existing Loan Deductions (any lender)' },
  { key: 'fosa_sweeps', label: 'FOSA Sweeps' },
  { key: 'other_deductions', label: 'Other Deductions' },
]

function PayslipsTab() {
  const queryClient = useQueryClient()
  const [member, setMember] = useState<PickedMember | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payslip-inputs'],
    queryFn: () => api.insiderLending.getPayslipInputs(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.insiderLending.createPayslipInput({
        membership: member!.id,
        basic_salary: Number(values.basic_salary || 0),
        gross_pay: Number(values.gross_pay || 0),
        paye: values.paye ? Number(values.paye) : undefined,
        nssf: values.nssf ? Number(values.nssf) : undefined,
        shif: values.shif ? Number(values.shif) : undefined,
        housing_levy: values.housing_levy ? Number(values.housing_levy) : undefined,
        existing_loan_deductions: values.existing_loan_deductions ? Number(values.existing_loan_deductions) : undefined,
        fosa_sweeps: values.fosa_sweeps ? Number(values.fosa_sweeps) : undefined,
        other_deductions: values.other_deductions ? Number(values.other_deductions) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslip-inputs'] })
      setMember(null)
      setValues({})
      setMsg('Payslip input recorded — this becomes the member\'s current one-third-rule basis.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to record this payslip input.'),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
      {msg && <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <Card title="Enter Payslip Lines" className="md:col-span-1">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-ink-muted">For the one-third-rule affordability check</span>
            <InfoTip text="Employment Act s.19(3): total payroll deductions (for any lender) can't exceed one-third of gross pay. This is the raw payslip figures backing that check for this member's next loan appraisal." label="What this is for" />
          </div>
          <div>
            <label className="text-ink-muted mb-1 block">Member</label>
            <MemberPicker selected={member} setSelected={setMember} />
          </div>
          {PAYSLIP_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-ink-muted mb-1 block">{f.label}{f.required ? ' *' : ''}</label>
              <input
                type="number"
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full p-2 border border-ink-faint rounded bg-white"
              />
            </div>
          ))}
          <button
            onClick={() => member && values.basic_salary && values.gross_pay && createMutation.mutate()}
            disabled={!member || !values.basic_salary || !values.gross_pay || createMutation.isPending}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
          >
            Record Payslip Input
          </button>
        </div>
      </Card>

      <Card title="Payslip Inputs on File" className="md:col-span-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-ink-muted bg-surface-2">
                <th className="py-2 px-3">Gross Pay</th>
                <th className="py-2 px-3">Total Deductions</th>
                <th className="py-2 px-3">Source</th>
                <th className="py-2 px-3">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading payslip inputs...</td></tr>
              ) : payslips.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No payslip inputs recorded yet.</td></tr>
              ) : (
                payslips.map((p: any) => {
                  const totalDeductions = ['paye', 'nssf', 'shif', 'housing_levy', 'existing_loan_deductions', 'fosa_sweeps', 'other_deductions']
                    .reduce((sum, k) => sum + Number(p[k] ?? 0), 0)
                  return (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-bold">KES {Number(p.gross_pay ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3">KES {totalDeductions.toLocaleString()}</td>
                      <td className="py-2 px-3 text-ink-muted">{p.source === 'MEMBER_SUBMITTED' ? 'Member submitted' : 'Officer entered'}</td>
                      <td className="py-2 px-3 text-ink-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ReportTab() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['insider-loan-report'],
    queryFn: () => api.insiderLending.getLoanReport(),
  })

  return (
    <Card title="Loans With an Active Insider Declaration">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
              <th className="py-2 px-3">Member</th>
              <th className="py-2 px-3">Loan Product</th>
              <th className="py-2 px-3 text-right">Amount</th>
              <th className="py-2 px-3">Insider Category</th>
              <th className="py-2 px-3">Appraisal</th>
              <th className="py-2 px-3">Insider Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5ede9]">
            {isLoading ? (
              <tr><td colSpan={6} className="py-6 text-center text-ink-muted">Loading report...</td></tr>
            ) : loans.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-ink-muted">No loans with an active insider declaration.</td></tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.loan_id} className="hover:bg-surface-1">
                  <td className="py-2.5 px-3 font-semibold text-ink">{loan.member_name}<div className="text-ink-faint text-[10px]">{loan.member_number}</div></td>
                  <td className="py-2.5 px-3 text-ink-muted">{loan.loan_type_name ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">KES {Number(loan.amount ?? 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-ink-muted">{loan.insider_categories.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')}</td>
                  <td className="py-2.5 px-3">
                    {loan.appraisal_recommendation ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${loan.appraisal_recommendation === 'APPROVE' ? 'bg-mint-50 text-mint-700 border-mint-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {loan.appraisal_recommendation}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-ink-muted">{loan.insider_approval_status ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

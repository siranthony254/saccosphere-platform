import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'
import { useSacco } from '../../hooks/useSacco'
import { ModuleGate } from '../../components/ui/ModuleGate'
import { InfoTip } from '@saccosphere/ui'

const TERM_FEE_LOANS_MODULE = 'education.term_fee_loans'
const BURSARY_FUND_MODULE = 'education.bursary_fund'
const DEVICE_FINANCING_MODULE = 'education.device_financing'

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
    queryKey: ['edu-loan-picker'],
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

export function EducationPack() {
  const queryClient = useQueryClient()
  const { data: sacco } = useSacco()
  const [activeTab, setActiveTab] = useState<'institutions' | 'terms' | 'fee-loans' | 'bursary' | 'devices' | 'parents'>('institutions')

  // Institution form
  const [instName, setInstName] = useState('')
  const [instCode, setInstCode] = useState('')
  const [instType, setInstType] = useState<'SCHOOL' | 'COLLEGE' | 'UNIVERSITY'>('SCHOOL')

  // Academic term form
  const [termInstitutionId, setTermInstitutionId] = useState('')
  const [termYear, setTermYear] = useState(new Date().getFullYear())
  const [termNumber, setTermNumber] = useState(1)
  const [termOpens, setTermOpens] = useState('')
  const [termCloses, setTermCloses] = useState('')

  // Fee-loan terms form
  const [feeLoan, setFeeLoan] = useState<PickedLoan | null>(null)
  const [feeInstitutionId, setFeeInstitutionId] = useState('')
  const [feeAcademicTermIds, setFeeAcademicTermIds] = useState<string[]>([])
  const [feeBilledPerTerm, setFeeBilledPerTerm] = useState(false)
  const [disburseAcademicTermId, setDisburseAcademicTermId] = useState('')
  const [disburseReference, setDisburseReference] = useState('')

  // Bursary fund config / review state
  const [maxHouseholdIncome, setMaxHouseholdIncome] = useState('')
  const [minDependentsInSchool, setMinDependentsInSchool] = useState('')
  const [contributeAmount, setContributeAmount] = useState('')
  const [contributeReference, setContributeReference] = useState('')
  const [selectedBursaryApp, setSelectedBursaryApp] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewAwardAmount, setReviewAwardAmount] = useState('')

  // Parents' association form
  const [groupName, setGroupName] = useState('')
  const [groupOwner, setGroupOwner] = useState<PickedMember | null>(null)
  const [groupSavingsTypeId, setGroupSavingsTypeId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupMember, setGroupMember] = useState<PickedMember | null>(null)

  const [msg, setMsg] = useState<string | null>(null)

  // Queries
  const { data: institutions = [], isLoading: isInstLoading } = useQuery({
    queryKey: ['edu-institutions'],
    queryFn: () => api.education.getInstitutions(),
  })

  const { data: academicTerms = [], isLoading: isTermsLoading } = useQuery({
    queryKey: ['edu-academic-terms'],
    queryFn: () => api.education.getAcademicTerms(),
    enabled: activeTab === 'terms' || activeTab === 'fee-loans',
  })

  const { data: feeTerms } = useQuery({
    queryKey: ['edu-fee-terms', feeLoan?.id],
    queryFn: () => api.education.getTermFeeTerms(feeLoan!.id),
    enabled: !!feeLoan,
    retry: false,
  })

  const { data: bursaryConfig } = useQuery({
    queryKey: ['edu-bursary-config'],
    queryFn: () => api.education.getBursaryFundConfig(),
    enabled: activeTab === 'bursary',
  })

  const { data: bursaryApps = [], isLoading: isBursaryLoading } = useQuery({
    queryKey: ['edu-bursary-apps'],
    queryFn: () => api.education.getBursaryApplications(),
    enabled: activeTab === 'bursary',
  })

  const { data: deviceAssets = [], isLoading: isDevicesLoading } = useQuery({
    queryKey: ['edu-device-assets'],
    queryFn: () => api.education.getDeviceAssets(),
    enabled: activeTab === 'devices',
  })

  const { data: paGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['edu-pa-groups'],
    queryFn: () => api.education.getParentsAssociationGroups(),
    enabled: activeTab === 'parents',
  })

  const { data: savingsTypes = [] } = useQuery({
    queryKey: ['savings-types', sacco?.id],
    queryFn: () => api.saccoAdmin.getSavingsTypes(sacco!.id),
    enabled: activeTab === 'parents' && !!sacco?.id,
    staleTime: 300_000,
  })

  // Mutations
  const registerInstMutation = useMutation({
    mutationFn: (data: { name: string; code: string; institution_type: 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY' }) => api.education.registerInstitution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-institutions'] })
      setInstName('')
      setInstCode('')
      setMsg('Educational institution registered (check-off subtype).')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to register this institution.'),
  })

  const createTermMutation = useMutation({
    mutationFn: () =>
      api.education.createAcademicTerm({
        institution: termInstitutionId || undefined,
        year: termYear,
        term_number: termNumber,
        opens: termOpens,
        closes: termCloses,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-academic-terms'] })
      setTermOpens('')
      setTermCloses('')
      setMsg('Academic term added to the calendar.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to add this academic term.'),
  })

  const setFeeTermsMutation = useMutation({
    mutationFn: () =>
      api.education.setTermFeeTerms(feeLoan!.id, {
        institution: feeInstitutionId,
        academic_terms: feeAcademicTermIds,
        billed_per_term: feeBilledPerTerm,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-fee-terms', feeLoan?.id] })
      setMsg('School-fees terms set for this loan.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to set school-fees terms — this can only be done before the loan is approved.'),
  })

  const disburseMutation = useMutation({
    mutationFn: () => api.education.disburseToInstitution(feeLoan!.id, { academic_term: disburseAcademicTermId || undefined, reference: disburseReference || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-fee-terms', feeLoan?.id] })
      setDisburseReference('')
      setMsg('Fees disbursed directly to the institution.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to disburse to the institution.'),
  })

  const updateBursaryConfigMutation = useMutation({
    mutationFn: () =>
      api.education.updateBursaryFundConfig({
        eligibility_criteria: {
          ...(maxHouseholdIncome ? { max_household_income_monthly: Number(maxHouseholdIncome) } : {}),
          ...(minDependentsInSchool ? { min_dependents_in_school: Number(minDependentsInSchool) } : {}),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-bursary-config'] })
      setMsg('Bursary means-test criteria updated.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to update bursary fund criteria.'),
  })

  const contributeMutation = useMutation({
    mutationFn: () => api.education.contributeToBursaryFund({ amount: Number(contributeAmount), reference: contributeReference || undefined }),
    onSuccess: () => {
      setContributeAmount('')
      setContributeReference('')
      setMsg('Contribution recorded to the ring-fenced bursary fund.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to record this contribution.'),
  })

  const reviewBursaryMutation = useMutation({
    mutationFn: () =>
      api.education.reviewBursaryApplication(selectedBursaryApp.id, {
        notes: reviewNotes || undefined,
        award_amount: reviewAwardAmount ? Number(reviewAwardAmount) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-bursary-apps'] })
      setMsg('Application reviewed and means-tested.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to review this application.'),
  })

  const awardBursaryMutation = useMutation({
    mutationFn: () => api.education.awardBursaryApplication(selectedBursaryApp.id, { award_amount: reviewAwardAmount ? Number(reviewAwardAmount) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-bursary-apps'] })
      setSelectedBursaryApp(null)
      setMsg('Award requested — sent for committee sign-off.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to request this award.'),
  })

  const createGroupMutation = useMutation({
    mutationFn: () => api.education.createParentsAssociationGroup({ name: groupName, owner_membership: groupOwner!.id, savings_type: groupSavingsTypeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edu-pa-groups'] })
      setGroupName('')
      setGroupOwner(null)
      setGroupSavingsTypeId('')
      setMsg('Parents\' association group created with its own joint savings sub-account.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to create this group.'),
  })

  const addGroupMemberMutation = useMutation({
    mutationFn: () => api.education.addParentsAssociationMember(selectedGroupId, { membership: groupMember!.id }),
    onSuccess: () => {
      setGroupMember(null)
      setMsg('Member added to the group.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to add this member to the group.'),
  })

  return (
    <div className="p-5 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Education Sector Pack
            <InfoTip text="Tools built for teacher and school SACCOs: school/college registration, fee loans paid straight to the institution, a bursary fund, and device financing." label="About the Education Sector Pack" />
          </div>
          <div className="text-xs text-ink-muted">
            School/College registry, term-aligned fee advances disbursed directly to institutions, ring-fenced bursary fund &amp; device financing.
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
          onClick={() => setActiveTab('institutions')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'institutions'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Educational Institutions ({institutions.length})
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'terms'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Academic Terms
        </button>
        <button
          onClick={() => setActiveTab('fee-loans')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'fee-loans'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          School-Fees Advances
        </button>
        <button
          onClick={() => setActiveTab('bursary')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'bursary'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Bursary Fund &amp; Applications
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'devices'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Device Assets
        </button>
        <button
          onClick={() => setActiveTab('parents')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'parents'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Parents&rsquo; Association
        </button>
      </div>

      {/* TAB 1: INSTITUTIONS */}
      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
            <div className="font-bold text-base text-ink">Register Institution</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!instName || !instCode) return
                registerInstMutation.mutate({
                  name: instName,
                  code: instCode,
                  institution_type: instType,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-ink-muted mb-1 block">Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alliance High School / University of Nairobi"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Institution Code</label>
                <input
                  type="text"
                  placeholder="e.g. SCH-0192"
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  className="w-full p-2 border rounded bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-ink-muted mb-1 block">Type</label>
                <select
                  value={instType}
                  onChange={(e) => setInstType(e.target.value as any)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="SCHOOL">School (Primary / Secondary)</option>
                  <option value="COLLEGE">College / TVET</option>
                  <option value="UNIVERSITY">University</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={registerInstMutation.isPending}
                className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
              >
                Register Institution
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
            <div className="font-bold text-base text-ink mb-3">Registered Institutions</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isInstLoading ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading institutions...</td></tr>
                  ) : institutions.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No institutions registered.</td></tr>
                  ) : (
                    institutions.map((i: any) => (
                      <tr key={i.id}>
                        <td className="py-2 px-3 font-mono font-bold text-violet-700">{i.code}</td>
                        <td className="py-2 px-3 font-semibold text-ink">{i.name}</td>
                        <td className="py-2 px-3 font-bold text-ink-muted">{i.institution_type || 'SCHOOL'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACADEMIC TERMS — same education.institution_registry module as this page's own gate. */}
      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Add Academic Term
              <InfoTip text="Drives term-aligned repayment schedules and fee-due reminders for school-fees advances. Leave institution blank for a tenant-wide term that applies to every institution in this SACCO." label="What this is for" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Institution (Optional — blank = tenant-wide)</label>
              <select value={termInstitutionId} onChange={(e) => setTermInstitutionId(e.target.value)} className="w-full p-2 border rounded bg-white">
                <option value="">Tenant-wide</option>
                {institutions.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-ink-muted mb-1 block">Year</label>
                <input type="number" value={termYear} onChange={(e) => setTermYear(Number(e.target.value))} className="w-full p-2 border rounded bg-white" />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Term (1-3)</label>
                <input type="number" min={1} max={3} value={termNumber} onChange={(e) => setTermNumber(Number(e.target.value))} className="w-full p-2 border rounded bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-ink-muted mb-1 block">Opens</label>
                <input type="date" value={termOpens} onChange={(e) => setTermOpens(e.target.value)} className="w-full p-2 border rounded bg-white" required />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Closes</label>
                <input type="date" value={termCloses} onChange={(e) => setTermCloses(e.target.value)} className="w-full p-2 border rounded bg-white" required />
              </div>
            </div>
            <button
              onClick={() => termOpens && termCloses && createTermMutation.mutate()}
              disabled={!termOpens || !termCloses || createTermMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Add Term
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Academic Term Calendar</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Institution</th>
                    <th className="py-2 px-3">Year</th>
                    <th className="py-2 px-3">Term</th>
                    <th className="py-2 px-3">Opens</th>
                    <th className="py-2 px-3">Closes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isTermsLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading calendar...</td></tr>
                  ) : academicTerms.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No academic terms set yet.</td></tr>
                  ) : (
                    academicTerms.map((t: any) => (
                      <tr key={t.id}>
                        <td className="py-2 px-3 font-semibold text-ink">{institutions.find((i: any) => i.id === t.institution)?.name ?? 'Tenant-wide'}</td>
                        <td className="py-2 px-3">{t.year}</td>
                        <td className="py-2 px-3 font-bold text-violet-700">Term {t.term_number}</td>
                        <td className="py-2 px-3 text-ink-muted">{t.opens}</td>
                        <td className="py-2 px-3 text-ink-muted">{t.closes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SCHOOL-FEES ADVANCES — a different sub-module (education.term_fee_loans). */}
      {activeTab === 'fee-loans' && (
        <ModuleGate module={TERM_FEE_LOANS_MODULE} moduleName="School-fees advances">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
              <div className="font-bold text-base text-ink flex items-center gap-1.5">
                School-Fees Loan Terms
                <InfoTip text="Required before a TERM_ALIGNED school-fees advance can be approved: which institution it pays, and which academic term(s) it funds." label="Why this is required" />
              </div>
              <div>
                <label className="text-ink-muted mb-1 block">Loan</label>
                <LoanPicker selected={feeLoan} setSelected={setFeeLoan} />
              </div>

              {feeLoan && (
                <>
                  <div>
                    <label className="text-ink-muted mb-1 block">Institution</label>
                    <select value={feeInstitutionId} onChange={(e) => setFeeInstitutionId(e.target.value)} className="w-full p-2 border rounded bg-white">
                      <option value="">Select institution...</option>
                      {institutions.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-ink-muted mb-1 block">Academic Term(s) Funded</label>
                    <div className="space-y-1 max-h-28 overflow-y-auto border rounded p-1.5 bg-white">
                      {academicTerms.map((t: any) => (
                        <label key={t.id} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={feeAcademicTermIds.includes(t.id)}
                            onChange={(e) => setFeeAcademicTermIds((prev) => e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id))}
                          />
                          {t.year} Term {t.term_number}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={feeBilledPerTerm} onChange={(e) => setFeeBilledPerTerm(e.target.checked)} />
                    Institution bills per term (release in instalments)
                  </label>
                  <button
                    onClick={() => feeInstitutionId && feeAcademicTermIds.length > 0 && setFeeTermsMutation.mutate()}
                    disabled={!feeInstitutionId || feeAcademicTermIds.length === 0 || setFeeTermsMutation.isPending}
                    className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
                  >
                    Set Terms
                  </button>

                  {feeTerms && (
                    <div className="border-t pt-3 space-y-2">
                      <div className="font-bold text-ink">Disburse to Institution</div>
                      <select value={disburseAcademicTermId} onChange={(e) => setDisburseAcademicTermId(e.target.value)} className="w-full p-2 border rounded bg-white">
                        <option value="">Lump sum (no specific term)</option>
                        {academicTerms.filter((t: any) => (feeTerms.academic_terms ?? []).includes(t.id)).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.year} Term {t.term_number}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Reference (optional)" value={disburseReference} onChange={(e) => setDisburseReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
                      <button
                        onClick={() => disburseMutation.mutate()}
                        disabled={disburseMutation.isPending}
                        className="w-full py-2 bg-mint-600 text-white font-bold rounded cursor-pointer"
                      >
                        Disburse
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
              <div className="font-bold text-base text-ink mb-3">Disbursement Legs</div>
              {!feeLoan ? (
                <div className="text-ink-muted">Select a loan to view its school-fees terms and disbursement history.</div>
              ) : !feeTerms ? (
                <div className="text-ink-muted">No school-fees terms set for this loan yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-ink-muted bg-surface-2">
                        <th className="py-2 px-3">Term</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Disbursed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(feeTerms.disbursements ?? []).length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No disbursements yet.</td></tr>
                      ) : (
                        feeTerms.disbursements.map((d: any) => (
                          <tr key={d.id}>
                            <td className="py-2 px-3">{d.academic_term ? (academicTerms.find((t: any) => t.id === d.academic_term)?.term_number ? `Term ${academicTerms.find((t: any) => t.id === d.academic_term)?.term_number}` : '—') : 'Lump sum'}</td>
                            <td className="py-2 px-3 font-bold">KES {Number(d.amount ?? 0).toLocaleString()}</td>
                            <td className="py-2 px-3 font-semibold text-violet-700">{d.status}</td>
                            <td className="py-2 px-3 text-ink-muted">{d.disbursed_at ? new Date(d.disbursed_at).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ModuleGate>
      )}

      {/* TAB 2: BURSARY — a different sub-module (education.bursary_fund). */}
      {activeTab === 'bursary' && (
        <ModuleGate module={BURSARY_FUND_MODULE} moduleName="Bursary fund">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Means-Test Criteria
              <InfoTip text="An empty criteria set means every application passes the means test automatically — set these once your SACCO's bursary by-laws are finalized." label="How the means test works" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Max Household Income (KES/month)</label>
              <input
                type="number"
                placeholder={bursaryConfig?.eligibility_criteria?.max_household_income_monthly ?? 'Not set'}
                value={maxHouseholdIncome}
                onChange={(e) => setMaxHouseholdIncome(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Min Dependents in School</label>
              <input
                type="number"
                placeholder={bursaryConfig?.eligibility_criteria?.min_dependents_in_school ?? 'Not set'}
                value={minDependentsInSchool}
                onChange={(e) => setMinDependentsInSchool(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
            <button
              onClick={() => updateBursaryConfigMutation.mutate()}
              disabled={updateBursaryConfigMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Save Criteria
            </button>

            <div className="border-t pt-3 space-y-2">
              <div className="font-bold text-ink">Contribute to Fund</div>
              <input type="number" placeholder="Amount (KES)" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <input type="text" placeholder="Reference (optional)" value={contributeReference} onChange={(e) => setContributeReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <button
                onClick={() => contributeAmount && contributeMutation.mutate()}
                disabled={!contributeAmount || contributeMutation.isPending}
                className="w-full py-2 bg-mint-600 text-white font-bold rounded cursor-pointer"
              >
                Record Contribution
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-3">
            <div className="font-bold text-base text-ink">Ring-Fenced Bursary Applications Queue</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Dependant</th>
                    <th className="py-2 px-3">Requested</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isBursaryLoading ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading applications...</td></tr>
                  ) : bursaryApps.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No bursary applications.</td></tr>
                  ) : (
                    bursaryApps.map((b: any) => (
                      <tr key={b.id}>
                        <td className="py-2 px-3 font-semibold text-ink">{b.dependant_name}</td>
                        <td className="py-2 px-3 font-bold">KES {Number(b.requested_amount ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 font-bold text-violet-700">{b.status}</td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => { setSelectedBursaryApp(b); setReviewNotes(b.review_notes ?? ''); setReviewAwardAmount(b.award_amount ? String(b.award_amount) : '') }} className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedBursaryApp && (
              <div className="border-t pt-3 space-y-2 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">Reviewing: {selectedBursaryApp.dependant_name} ({selectedBursaryApp.dependant_relationship})</div>
                <div className="text-ink-muted">Household income: KES {Number(selectedBursaryApp.household_income_monthly ?? 0).toLocaleString()}/month · {selectedBursaryApp.dependents_in_school} dependent(s) in school</div>
                {selectedBursaryApp.eligibility_result && (
                  <div className="text-ink-muted">Means-test result: {JSON.stringify(selectedBursaryApp.eligibility_result)}</div>
                )}
                <textarea rows={2} placeholder="Review notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="w-full p-2 border rounded bg-white" />
                <input type="number" placeholder="Award amount (KES)" value={reviewAwardAmount} onChange={(e) => setReviewAwardAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
                <div className="flex gap-2">
                  <button onClick={() => reviewBursaryMutation.mutate()} disabled={reviewBursaryMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded">
                    Save Review
                  </button>
                  <button onClick={() => awardBursaryMutation.mutate()} disabled={awardBursaryMutation.isPending} className="flex-1 py-2 bg-mint-600 text-white font-bold rounded">
                    Request Award
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </ModuleGate>
      )}

      {/* TAB: DEVICE ASSETS — a different sub-module (education.device_financing). */}
      {activeTab === 'devices' && (
        <ModuleGate module={DEVICE_FINANCING_MODULE} moduleName="Device financing">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm text-xs space-y-3">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Financed Device Assets
              <InfoTip text="Devices (laptops/tablets) financed through this SACCO's asset register, filtered to this education pack's own view." label="About device financing" />
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
                  {isDevicesLoading ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">Loading device assets...</td></tr>
                  ) : deviceAssets.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No financed devices yet. Register one from Lending Primitives' Asset Register with class DEVICE.</td></tr>
                  ) : (
                    deviceAssets.map((d: any) => (
                      <tr key={d.id}>
                        <td className="py-2 px-3 font-mono font-bold text-ink">{d.identifier}</td>
                        <td className="py-2 px-3 font-bold">KES {Number(d.acquisition_value ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 font-semibold text-violet-700">{d.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ModuleGate>
      )}

      {/* TAB: PARENTS' ASSOCIATION — same education.institution_registry module as this page's own gate. */}
      {activeTab === 'parents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Create Group
              <InfoTip text="A parents' association gets its own joint savings sub-account, owned by one member on behalf of the group." label="What this creates" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Group Name</label>
              <input type="text" placeholder="e.g. Form 2B Parents" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Owner Member</label>
              <MemberPicker selected={groupOwner} setSelected={setGroupOwner} />
            </div>
            <div>
              <label className="text-ink-muted mb-1 block">Savings Type for the Joint Account</label>
              <select value={groupSavingsTypeId} onChange={(e) => setGroupSavingsTypeId(e.target.value)} className="w-full p-2 border rounded bg-white">
                <option value="">Select savings type...</option>
                {savingsTypes.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => groupName && groupOwner && groupSavingsTypeId && createGroupMutation.mutate()}
              disabled={!groupName || !groupOwner || !groupSavingsTypeId || createGroupMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Create Group
            </button>

            <div className="border-t pt-3 space-y-2">
              <div className="font-bold text-ink">Add Member to Group</div>
              <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full p-2 border rounded bg-white">
                <option value="">Select group...</option>
                {paGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <MemberPicker selected={groupMember} setSelected={setGroupMember} />
              <button
                onClick={() => selectedGroupId && groupMember && addGroupMemberMutation.mutate()}
                disabled={!selectedGroupId || !groupMember || addGroupMemberMutation.isPending}
                className="w-full py-2 bg-mint-600 text-white font-bold rounded cursor-pointer"
              >
                Add Member
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Parents&rsquo; Association Groups</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-ink-muted bg-surface-2">
                    <th className="py-2 px-3">Group</th>
                    <th className="py-2 px-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isGroupsLoading ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">Loading groups...</td></tr>
                  ) : paGroups.length === 0 ? (
                    <tr><td colSpan={2} className="py-4 text-center text-ink-muted">No groups created yet.</td></tr>
                  ) : (
                    paGroups.map((g: any) => (
                      <tr key={g.id}>
                        <td className="py-2 px-3 font-semibold text-ink">{g.name}</td>
                        <td className="py-2 px-3 text-ink-muted">{new Date(g.created_at).toLocaleDateString()}</td>
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

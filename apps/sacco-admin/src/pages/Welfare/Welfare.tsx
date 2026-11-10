import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'

const CLAIM_STATUS_LABELS: Record<string, string> = {
  DOCUMENTS_PENDING: 'Needs documents',
  UNDER_REVIEW: 'Being reviewed',
  PENDING_APPROVAL: 'Awaiting committee approval',
  APPROVED: 'Approved',
  PAID: 'Paid',
}
const humanizeClaimStatus = (status: string) => CLAIM_STATUS_LABELS[status] ?? status
const CLAIM_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'violet'> = {
  DOCUMENTS_PENDING: 'warning',
  UNDER_REVIEW: 'violet',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  PAID: 'success',
}

function MemberPicker({ value, onChange, label }: { value: string; onChange: (id: string) => void; label?: string }) {
  const [search, setSearch] = useState('')
  const { data } = useMembers({ search: search || undefined })
  return (
    <div>
      {label && <label className="text-ink-muted mb-1 block">{label}</label>}
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
            <button type="button" key={m.id} onClick={() => onChange(m.id)} className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded">
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const RELATIONSHIPS = ['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER'] as const
const DOCUMENT_TYPES = ['DEATH_CERTIFICATE', 'MEDICAL_REPORT', 'ID_COPY', 'HARDSHIP_EVIDENCE', 'OTHER'] as const

export function Welfare() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'claims' | 'config' | 'contributions' | 'schedule' | 'solvency' | 'insurers'>('claims')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 5000) }

  const { data: config } = useQuery({ queryKey: ['welfare-config'], queryFn: () => api.welfare.getConfig() })
  const isInsurerBacked = config?.mode === 'INSURER_BACKED'

  // Config
  const [mode, setMode] = useState<'DISCRETIONARY' | 'INSURER_BACKED'>('DISCRETIONARY')
  const [isLendable, setIsLendable] = useState(false)
  const [lawReference, setLawReference] = useState('')
  const [mandatoryAmount, setMandatoryAmount] = useState('')

  const updateConfigMutation = useMutation({
    mutationFn: () => api.welfare.updateConfig({
      mode,
      is_lendable: isLendable,
      lendability_by_law_reference: lawReference || undefined,
      mandatory_contribution_amount: mandatoryAmount ? Number(mandatoryAmount) : null,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['welfare-config'] }); notify('Fund configuration updated.') },
    onError: (err: any) => notify(err?.message || 'Failed to update configuration.'),
  })

  // Contributions
  const [contribMembershipId, setContribMembershipId] = useState('')
  const [contribAmount, setContribAmount] = useState('')
  const [contribReference, setContribReference] = useState('')
  const { data: contributions = [] } = useQuery({ queryKey: ['welfare-contributions'], queryFn: () => api.welfare.getContributions(), enabled: activeTab === 'contributions' })

  const recordContributionMutation = useMutation({
    mutationFn: () => api.welfare.recordContribution({ membership: contribMembershipId || undefined, amount: Number(contribAmount), reference: contribReference || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welfare-contributions'] })
      setContribMembershipId(''); setContribAmount(''); setContribReference('')
      notify('Transfer recorded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this contribution.'),
  })

  // Benefit schedule
  const [benCategory, setBenCategory] = useState<typeof RELATIONSHIPS[number]>('SELF')
  const [benAmount, setBenAmount] = useState('')
  const [benNotes, setBenNotes] = useState('')
  const { data: benefitSchedule = [] } = useQuery({ queryKey: ['welfare-benefit-schedule'], queryFn: () => api.welfare.getBenefitSchedule(), enabled: activeTab === 'schedule' })

  const createBenefitMutation = useMutation({
    mutationFn: () => api.welfare.createBenefitScheduleItem({ beneficiary_category: benCategory, indicative_amount: Number(benAmount), notes: benNotes || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['welfare-benefit-schedule'] }); setBenAmount(''); setBenNotes(''); notify('Benefit schedule item saved.') },
    onError: (err: any) => notify(err?.message || 'Failed to save this item.'),
  })

  // Claims
  const [claimMembershipId, setClaimMembershipId] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryRelationship, setBeneficiaryRelationship] = useState<typeof RELATIONSHIPS[number]>('SELF')
  const [claimType, setClaimType] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [docType, setDocType] = useState<typeof DOCUMENT_TYPES[number]>('DEATH_CERTIFICATE')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [approvedAmount, setApprovedAmount] = useState('')
  const [insurerStatusText, setInsurerStatusText] = useState('')
  const [insurerReference, setInsurerReference] = useState('')

  const { data: claims = [] } = useQuery({ queryKey: ['welfare-claims'], queryFn: () => api.welfare.getClaims() })
  const { data: claimDetail } = useQuery({ queryKey: ['welfare-claim-detail', selectedClaimId], queryFn: () => api.welfare.getClaim(selectedClaimId!), enabled: !!selectedClaimId })

  const createClaimMutation = useMutation({
    mutationFn: () => api.welfare.createClaim({ membership: claimMembershipId, beneficiary_name: beneficiaryName, beneficiary_relationship: beneficiaryRelationship, claim_type: claimType, requested_amount: Number(requestedAmount) }),
    onSuccess: (claim: any) => {
      queryClient.invalidateQueries({ queryKey: ['welfare-claims'] })
      setBeneficiaryName(''); setClaimType(''); setRequestedAmount('')
      setSelectedClaimId(claim.id)
      notify('Claim filed. Attach and verify at least one document next to move it forward.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to file this claim.'),
  })

  const uploadDocMutation = useMutation({
    mutationFn: () => api.welfare.uploadClaimDocument(selectedClaimId!, docType, docFile!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['welfare-claim-detail', selectedClaimId] }); setDocFile(null); notify('Document uploaded.') },
    onError: (err: any) => notify(err?.message || 'Failed to upload this document.'),
  })

  const verifyDocMutation = useMutation({
    mutationFn: (docId: string) => api.welfare.verifyClaimDocument(selectedClaimId!, docId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['welfare-claim-detail', selectedClaimId] }); notify('Document verified.') },
    onError: (err: any) => notify(err?.message || 'Failed to verify this document.'),
  })

  const submitForApprovalMutation = useMutation({
    mutationFn: () => api.welfare.submitClaimForApproval(selectedClaimId!, approvedAmount ? Number(approvedAmount) : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welfare-claim-detail', selectedClaimId] })
      queryClient.invalidateQueries({ queryKey: ['welfare-claims'] })
      notify('Sent to the committee for approval — needs sign-off from 2 admins.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to submit for approval — at least one verified document is required first.'),
  })

  const setInsurerStatusMutation = useMutation({
    mutationFn: () => api.welfare.setClaimInsurerStatus(selectedClaimId!, { status: insurerStatusText, reference: insurerReference || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welfare-claim-detail', selectedClaimId] })
      setInsurerStatusText(''); setInsurerReference('')
      notify('Status recorded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this status.'),
  })

  // Solvency
  const [solvencyAsOf, setSolvencyAsOf] = useState('')
  const [solvencyWindow, setSolvencyWindow] = useState('12')
  const { data: solvency } = useQuery({
    queryKey: ['welfare-solvency', solvencyAsOf, solvencyWindow],
    queryFn: () => api.welfare.getSolvencyReport({ as_of: solvencyAsOf || undefined, window_months: Number(solvencyWindow) || 12 }),
    enabled: activeTab === 'solvency',
  })

  // Partner insurers / remittances
  const [insurerName, setInsurerName] = useState('')
  const [iraLicense, setIraLicense] = useState('')
  const [remitAmount, setRemitAmount] = useState('')
  const [remitReference, setRemitReference] = useState('')
  const { data: partnerInsurers = [] } = useQuery({ queryKey: ['welfare-partner-insurers'], queryFn: () => api.welfare.getPartnerInsurers(), enabled: activeTab === 'insurers' })

  const createInsurerMutation = useMutation({
    mutationFn: () => api.welfare.createPartnerInsurer({ name: insurerName, ira_license_number: iraLicense }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['welfare-partner-insurers'] }); setInsurerName(''); setIraLicense(''); notify('Partner insurer registered.') },
    onError: (err: any) => notify(err?.message || 'Failed to register this insurer.'),
  })

  const createRemittanceMutation = useMutation({
    mutationFn: () => api.welfare.createPremiumRemittance({ amount: Number(remitAmount), reference: remitReference || undefined }),
    onSuccess: () => { setRemitAmount(''); setRemitReference(''); notify('Remittance recorded.') },
    onError: (err: any) => notify(err?.message || 'Failed to record this remittance.'),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Welfare Fund"
        subtitle="A fund members pay into that helps with hardship — bereavement, medical bills — decided case by case."
        info={
          config?.mode === 'DISCRETIONARY'
            ? "A member never files their own claim — an admin always does it on their behalf. This fund is set to \"case-by-case\" mode, so this screen deliberately avoids words like insurance, premium or cover — a benefit here is never a guaranteed payout, only a discretionary one the committee decides."
            : "A member never files their own claim — an admin always does it on their behalf. This fund is backed by a licensed insurer: the insurer carries the real risk and pays the member directly, and this screen only mirrors that status."
        }
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium flex-wrap">
        {([
          ['claims', `Claims (${claims.length})`],
          ['config', 'Fund Configuration'],
          ['contributions', 'Contributions'],
          ['schedule', 'Benefit Schedule'],
          ['solvency', 'Solvency'],
          ['insurers', 'Partner Insurers & Remittances'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm max-w-xl">
          <div className="font-bold text-base text-ink">Fund Configuration</div>
          <div>
            <label className="text-ink-muted mb-1 block">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="w-full p-2 border rounded bg-white">
              <option value="DISCRETIONARY">Case-by-case (no insurer)</option>
              <option value="INSURER_BACKED">Backed by a partner insurer</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isLendable} onChange={(e) => setIsLendable(e.target.checked)} />
            <span>Fund balance is lendable</span>
          </label>
          {isLendable && (
            <input type="text" placeholder="By-law reference (required when lendable)" value={lawReference} onChange={(e) => setLawReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
          )}
          <div>
            <label className="text-ink-muted mb-1 block">Mandatory contribution amount (blank = purely voluntary)</label>
            <input type="number" value={mandatoryAmount} onChange={(e) => setMandatoryAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
          </div>
          {config && <div className="text-ink-muted">Current: mode {config.mode}, lendable {config.is_lendable ? 'YES' : 'NO'}, mandatory contribution {config.mandatory_contribution_amount ?? 'voluntary'}.</div>}
          <button onClick={() => updateConfigMutation.mutate()} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Save Configuration</button>
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Record Manual Transfer</div>
            <MemberPicker value={contribMembershipId} onChange={setContribMembershipId} label="Member (leave blank for a SACCO-level top-up)" />
            <input type="number" placeholder="Amount" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="text" placeholder="Reference (optional)" value={contribReference} onChange={(e) => setContribReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button onClick={() => contribAmount && recordContributionMutation.mutate()} disabled={!contribAmount} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Record Transfer</button>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-2">Contributions (capped at 500)</div>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Source</th><th className="py-2 px-3">Amount</th><th className="py-2 px-3">Reference</th></tr></thead>
              <tbody className="divide-y">
                {contributions.length === 0 ? <tr><td colSpan={3} className="py-4 text-center text-ink-muted">No contributions yet.</td></tr> : contributions.map((c: any) => (
                  <tr key={c.id}><td className="py-2 px-3">{c.source}</td><td className="py-2 px-3 font-bold">KES {Number(c.amount ?? 0).toLocaleString()}</td><td className="py-2 px-3">{c.reference || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Add Benefit Schedule Item</div>
            <select value={benCategory} onChange={(e) => setBenCategory(e.target.value as any)} className="w-full p-2 border rounded bg-white">
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="number" placeholder="Indicative amount" value={benAmount} onChange={(e) => setBenAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="text" placeholder="Notes (optional)" value={benNotes} onChange={(e) => setBenNotes(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button onClick={() => benAmount && createBenefitMutation.mutate()} disabled={!benAmount} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Save</button>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="space-y-2">
              {benefitSchedule.length === 0 ? <div className="text-ink-muted py-4 text-center">No benefit schedule items set.</div> : benefitSchedule.map((b: any) => (
                <div key={b.id} className="border border-[#e5ede9] rounded p-2.5">
                  <div className="font-bold text-ink">{b.beneficiary_category} — KES {Number(b.indicative_amount ?? 0).toLocaleString()}</div>
                  {b.notes && <div className="text-ink-muted">{b.notes}</div>}
                  <div className="mt-1 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold">{b.disclaimer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">File a Claim</div>
            <MemberPicker value={claimMembershipId} onChange={setClaimMembershipId} />
            <input type="text" placeholder="Beneficiary name" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <select value={beneficiaryRelationship} onChange={(e) => setBeneficiaryRelationship(e.target.value as any)} className="w-full p-2 border rounded bg-white">
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input type="text" placeholder="Claim type (e.g. Death, Medical, Hardship)" value={claimType} onChange={(e) => setClaimType(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="number" placeholder="Requested amount" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button
              onClick={() => claimMembershipId && beneficiaryName && claimType && requestedAmount && createClaimMutation.mutate()}
              disabled={!claimMembershipId || !beneficiaryName || !claimType || !requestedAmount}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              File Claim
            </button>

            <div className="border-t pt-3 space-y-1">
              <div className="font-bold text-ink mb-1">Claims</div>
              {claims.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedClaimId(c.id)} className={`w-full text-left px-2 py-1.5 rounded ${selectedClaimId === c.id ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-surface-2 hover:bg-surface-1'}`}>
                  {c.beneficiary_name} · {c.claim_type} · {humanizeClaimStatus(c.status)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            {!claimDetail ? <div className="text-ink-muted py-4 text-center">Select a claim to review.</div> : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-ink">{claimDetail.beneficiary_name} ({claimDetail.beneficiary_relationship}) — {claimDetail.claim_type}</div>
                  <Badge variant={CLAIM_STATUS_VARIANT[claimDetail.status] ?? 'warning'}>{humanizeClaimStatus(claimDetail.status)}</Badge>
                </div>
                <div className="text-ink-muted">Requested KES {claimDetail.requested_amount} · Approved {claimDetail.approved_amount ?? '—'}</div>
                {claimDetail.status === 'PENDING_APPROVAL' && (
                  <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded flex items-start gap-1.5">
                    <span>Still waiting on the committee.</span>
                    <InfoTip text="If this never moves, check the Maker-Checker page — a rejection there won't update this claim's status on its own; you have to look at the approval request directly." label="Why this might be stuck" />
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  <div className="font-semibold text-ink">Documents</div>
                  {(claimDetail.documents ?? []).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between px-2 py-1.5 bg-surface-2 rounded">
                      <span>{d.document_type} · {d.file_name}</span>
                      {d.is_verified ? <span className="text-mint-700 font-bold">VERIFIED</span> : <button onClick={() => verifyDocMutation.mutate(d.id)} className="px-2 py-1 bg-mint-600 text-white font-bold text-[10px] rounded cursor-pointer">Verify</button>}
                    </div>
                  ))}
                  {(claimDetail.status === 'DOCUMENTS_PENDING' || claimDetail.status === 'UNDER_REVIEW') && (
                    <div className="flex gap-2">
                      <select value={docType} onChange={(e) => setDocType(e.target.value as any)} className="p-2 border rounded bg-white">
                        {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="flex-1 p-1.5 border rounded bg-white" />
                      <button onClick={() => uploadDocMutation.mutate()} disabled={!docFile} className="px-3 py-1.5 bg-violet-600 text-white font-bold rounded cursor-pointer">Upload</button>
                    </div>
                  )}
                </div>

                {!isInsurerBacked && claimDetail.status === 'UNDER_REVIEW' && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      Submit for Committee Approval
                      <InfoTip text="This always needs sign-off from 2 separate admins on the Maker-Checker page before it pays out — that can't be lowered or skipped." label="Why 2 approvals" />
                    </div>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Approved amount (optional — defaults to requested)" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                      <button onClick={() => submitForApprovalMutation.mutate()} className="px-3 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Submit</button>
                    </div>
                  </div>
                )}

                {isInsurerBacked && (
                  <div className="border-t pt-3 space-y-2">
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      Record Insurer Status
                      <InfoTip text="The insurer pays the member directly — recording a status here is just a note for your own records, it never moves money itself. Type PAID once the insurer has paid out." label="About Insurer Status" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Status (e.g. PAID)" value={insurerStatusText} onChange={(e) => setInsurerStatusText(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                      <input type="text" placeholder="Reference (optional)" value={insurerReference} onChange={(e) => setInsurerReference(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                      <button onClick={() => insurerStatusText && setInsurerStatusMutation.mutate()} disabled={!insurerStatusText} className="px-3 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Save</button>
                    </div>
                  </div>
                )}

                {claimDetail.payout && (
                  <div className="border-t pt-3">
                    <div className="font-semibold text-ink">Payout</div>
                    <div className="text-ink-muted flex items-center gap-1.5">
                      KES {claimDetail.payout.amount} · {claimDetail.payout.status}
                      {claimDetail.payout.status === 'PAYOUT_INITIATED' && (
                        <InfoTip text="This started but hasn't been confirmed by M-Pesa yet. If it's been a while, the payment probably timed out and needs a manual check — it won't resolve itself." label="Payout stuck?" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'solvency' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="font-bold text-base text-ink flex-1">Solvency Report</div>
            <input type="date" value={solvencyAsOf} onChange={(e) => setSolvencyAsOf(e.target.value)} className="p-2 border rounded bg-white" />
            <input type="number" placeholder="Window (months)" value={solvencyWindow} onChange={(e) => setSolvencyWindow(e.target.value)} className="w-28 p-2 border rounded bg-white" />
          </div>
          {solvency && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ['Fund balance', `KES ${Number(solvency.fund_balance ?? 0).toLocaleString()}`],
                ['Contributions total', `KES ${Number(solvency.contributions_total ?? 0).toLocaleString()}`],
                ['Claims paid total', `KES ${Number(solvency.claims_paid_total ?? 0).toLocaleString()}`],
                ['Average monthly claims', `KES ${Number(solvency.average_monthly_claims ?? 0).toLocaleString()}`],
                ['Claims ratio %', solvency.claims_ratio_pct !== null ? `${solvency.claims_ratio_pct}%` : '—'],
                ['Months of cover', solvency.months_of_cover ?? '—'],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-surface-2 rounded p-3"><div className="text-ink-muted">{label}</div><div className="font-bold text-ink">{String(value)}</div></div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'insurers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Partner Insurer</div>
            <input type="text" placeholder="Name" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="text" placeholder="IRA license number" value={iraLicense} onChange={(e) => setIraLicense(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button onClick={() => insurerName && iraLicense && createInsurerMutation.mutate()} disabled={!insurerName || !iraLicense} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Register</button>
            <div className="space-y-1 pt-2">
              {partnerInsurers.map((i: any) => <div key={i.id} className="px-2 py-1.5 bg-surface-2 rounded">{i.name} · IRA {i.ira_license_number}</div>)}
            </div>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink flex items-center gap-1.5">
              Record Premium Remittance
              <InfoTip text="This is a record of a real bank transfer you made to the insurer — it doesn't send money itself, there's no M-Pesa/phone payment here." label="About Premium Remittance" />
            </div>
            <input type="number" placeholder="Amount" value={remitAmount} onChange={(e) => setRemitAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="text" placeholder="Reference (optional)" value={remitReference} onChange={(e) => setRemitReference(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button onClick={() => remitAmount && createRemittanceMutation.mutate()} disabled={!remitAmount} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Record Remittance</button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'

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
            <button type="button" key={m.id} onClick={() => onChange(m.id)} className="w-full text-left px-2 py-1 bg-surface-2 hover:bg-surface-1 rounded">
              {m.first_name} {m.last_name} · {m.member_number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TechnologyPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'ceiling' | 'remote-employer' | 'devices'>('remote-employer')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 4500) }

  // Gig-income ceiling widget
  const [ceilingMembershipId, setCeilingMembershipId] = useState('')
  const { data: ceiling, isError: ceilingError, error: ceilingErrorObj } = useQuery({
    queryKey: ['technology-ceiling', ceilingMembershipId],
    queryFn: () => api.technology.getVariableIncomeCeiling(ceilingMembershipId),
    enabled: !!ceilingMembershipId,
    retry: false,
  })

  // Remote-employer verification queue
  const [remoteMembershipId, setRemoteMembershipId] = useState('')
  const [employerName, setEmployerName] = useState('')
  const [employerCountry, setEmployerCountry] = useState('')
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null)
  const [docKind, setDocKind] = useState<'EMPLOYMENT_CONTRACT' | 'PAY_EVIDENCE' | 'EMPLOYER_ID_OR_REGISTRATION' | 'OTHER'>('EMPLOYMENT_CONTRACT')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const { data: verifications = [], isLoading: isVerificationsLoading } = useQuery({
    queryKey: ['technology-remote-employer-verifications', remoteMembershipId],
    queryFn: () => api.technology.getRemoteEmployerVerifications(remoteMembershipId),
    enabled: !!remoteMembershipId,
  })

  const createVerificationMutation = useMutation({
    mutationFn: () => api.technology.createRemoteEmployerVerification(remoteMembershipId, { employer_name: employerName, employer_country: employerCountry }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-remote-employer-verifications', remoteMembershipId] })
      setEmployerName(''); setEmployerCountry('')
      notify('Verification opened.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to open this verification.'),
  })

  const uploadDocMutation = useMutation({
    mutationFn: () => api.technology.uploadRemoteEmployerVerificationDocument(selectedVerification.id, docKind, docFile!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-remote-employer-verifications', remoteMembershipId] })
      setDocFile(null)
      notify('Document uploaded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to upload this document.'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.technology.approveRemoteEmployerVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-remote-employer-verifications', remoteMembershipId] })
      setSelectedVerification(null)
      notify('Approved. Any of this member\'s open loans will be re-checked shortly.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to approve — whoever submitted this or uploaded its evidence can\'t also sign it off.'),
  })

  const rejectMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => api.technology.rejectRemoteEmployerVerification(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technology-remote-employer-verifications', remoteMembershipId] })
      setSelectedVerification(null); setRejectNotes('')
      notify('Verification rejected.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to reject this verification.'),
  })

  // Device assets (read-only)
  const { data: deviceAssets = [] } = useQuery({
    queryKey: ['technology-device-assets'],
    queryFn: () => api.technology.getDeviceAssets(),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Technology Sector Pack"
        subtitle="Verify a remote/foreign employer, preview a gig-income affordability ceiling, and see financed devices."
        info="This is a smaller pack by design — there's no self-service login for gig workers themselves; everything here is done by an admin on a member's behalf."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium">
        {([
          ['remote-employer', 'Remote/Foreign Employer Verification'],
          ['ceiling', 'Gig-Income Ceiling Preview'],
          ['devices', `Device Assets (${deviceAssets.length})`],
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

      {activeTab === 'remote-employer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Open a Verification</div>
            <MemberPicker value={remoteMembershipId} onChange={(id) => { setRemoteMembershipId(id); setSelectedVerification(null) }} />
            {remoteMembershipId && (
              <form onSubmit={(e) => { e.preventDefault(); if (!employerName || !employerCountry) return; createVerificationMutation.mutate() }} className="space-y-3">
                <div>
                  <label className="text-ink-muted mb-1 block">Employer name</label>
                  <input type="text" value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <div>
                  <label className="text-ink-muted mb-1 block">Employer country</label>
                  <input type="text" value={employerCountry} onChange={(e) => setEmployerCountry(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                </div>
                <button type="submit" disabled={createVerificationMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">
                  Open Verification
                </button>
                <div className="text-ink-muted">Only one verification can be pending at a time for this member.</div>
              </form>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-3">Verifications</div>
            {!remoteMembershipId ? (
              <div className="text-ink-muted py-4 text-center">Select a member to view their remote-employer verifications.</div>
            ) : isVerificationsLoading ? (
              <div className="text-ink-muted py-4 text-center">Loading...</div>
            ) : verifications.length === 0 ? (
              <div className="text-ink-muted py-4 text-center">No remote-employer verifications for this member.</div>
            ) : (
              <div className="space-y-2">
                {verifications.map((v: any) => (
                  <div key={v.id} className="border border-[#e5ede9] rounded p-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-ink">{v.employer_name} ({v.employer_country})</div>
                        {v.review_notes && <div className="text-ink-muted">{v.review_notes}</div>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'APPROVED' ? 'bg-mint-50 text-mint-700 border border-mint-200' : v.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {v.status === 'PENDING' ? 'Awaiting review' : v.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    {v.status === 'PENDING' && (
                      <button onClick={() => setSelectedVerification(v)} className="mt-2 px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">
                        Review
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedVerification && (
              <div className="border-t pt-3 mt-3 space-y-3 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">Review: {selectedVerification.employer_name}</div>

                <div className="space-y-2">
                  <div className="font-semibold text-ink">Upload evidence</div>
                  <div className="flex gap-2">
                    <select value={docKind} onChange={(e) => setDocKind(e.target.value as any)} className="p-2 border rounded bg-white flex-1">
                      <option value="EMPLOYMENT_CONTRACT">Employment contract</option>
                      <option value="PAY_EVIDENCE">Pay evidence</option>
                      <option value="EMPLOYER_ID_OR_REGISTRATION">Employer ID/registration</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="p-1.5 border rounded bg-white flex-1" />
                    <button onClick={() => uploadDocMutation.mutate()} disabled={!docFile || uploadDocMutation.isPending} className="px-3 py-1.5 bg-violet-600 text-white font-bold rounded cursor-pointer">
                      Upload
                    </button>
                  </div>
                </div>

                <div className="text-ink-muted flex items-start gap-1.5">
                  <span>Approving needs at least one document attached.</span>
                  <InfoTip text="Whoever opened this request, or uploaded any of its documents, can't be the one to approve or reject it — someone else has to review it." label="Why you might be blocked" />
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => approveMutation.mutate(selectedVerification.id)} disabled={approveMutation.isPending} className="px-3 py-1.5 bg-mint-600 text-white font-bold rounded cursor-pointer">
                    Approve
                  </button>
                  <input
                    type="text"
                    placeholder="Rejection notes (required)..."
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="flex-1 p-1.5 border rounded bg-white"
                  />
                  <button
                    onClick={() => { if (rejectNotes) rejectMutation.mutate({ id: selectedVerification.id, notes: rejectNotes }) }}
                    disabled={!rejectNotes || rejectMutation.isPending}
                    className="px-3 py-1.5 bg-red-600 text-white font-bold rounded cursor-pointer"
                  >
                    Reject
                  </button>
                  <button onClick={() => setSelectedVerification(null)} className="px-3 py-1.5 bg-gray-100 text-ink-muted font-bold rounded cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ceiling' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink flex items-center gap-1.5">
            Gig-Income Affordability Ceiling
            <InfoTip text="This is just a preview of what a member with irregular income could afford to repay — it doesn't submit or change anything. Submitting and reviewing income evidence happens on the Lending Primitives page." label="About this ceiling" />
          </div>
          <MemberPicker value={ceilingMembershipId} onChange={setCeilingMembershipId} />
          {ceilingMembershipId && (
            ceilingError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded">
                {(ceilingErrorObj as any)?.status === 404
                  ? 'This member has no approved income check yet — submit one on the Lending Primitives page first.'
                  : (ceilingErrorObj as any)?.message || 'Failed to load this ceiling.'}
              </div>
            ) : ceiling ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Months of history used', ceiling.months_used],
                  ['Enough history to assess?', ceiling.sufficient_history ? 'Yes' : 'No'],
                  ['Average monthly income', ceiling.trailing_mean ?? '—'],
                  ['How much income varies', ceiling.std_dev ?? '—'],
                  ['Volatility (relative to income)', ceiling.coefficient_of_variation ?? '—'],
                  ['Income after adjusting for risk', ceiling.adjusted_income ?? '—'],
                  ['Affordable monthly instalment', ceiling.affordable_instalment],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-surface-2 rounded p-3">
                    <div className="text-ink-muted">{label}</div>
                    <div className="font-bold text-ink">{String(value)}</div>
                  </div>
                ))}
                {(ceiling.reason_codes ?? []).length > 0 && (
                  <div className="col-span-full bg-surface-2 rounded p-3">
                    <div className="text-ink-muted mb-1">Why</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {ceiling.reason_codes.map((rc: string) => (
                        <span key={rc} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">{rc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 shadow-sm">
          <div className="font-bold text-base text-ink mb-1">Financed Devices</div>
          <div className="text-ink-muted mb-3 flex items-start gap-1.5">
            <span>Devices currently financed by this SACCO (up to 500 shown).</span>
            <InfoTip text="To attach a warranty or insurance document to one of these, use the asset-document upload on the Lending Primitives page." label="Uploading documents for a device" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-ink-muted bg-surface-2">
                <th className="py-2 px-3">Identifier</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Acquisition value</th>
                <th className="py-2 px-3">Current value</th>
                <th className="py-2 px-3">Pledged value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deviceAssets.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No active device assets.</td></tr>
              ) : deviceAssets.map((a: any) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{a.identifier}</td>
                  <td className="py-2.5 px-3">{a.description}</td>
                  <td className="py-2.5 px-3 font-bold">KES {Number(a.acquisition_value ?? 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3">KES {Number(a.current_value ?? 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3">KES {Number(a.pledged_value ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

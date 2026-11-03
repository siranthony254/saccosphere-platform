import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { useMembers } from '../../hooks/useMembers'
import { PageHeader } from '../../components/ui/PageHeader'

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

export function FinancePack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'investments' | 'groups' | 'growth' | 'professional'>('investments')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 4500) }

  // Investment products
  const [prodName, setProdName] = useState('')
  const [lockMonths, setLockMonths] = useState('')
  const [prefRate, setPrefRate] = useState('')
  const [penaltyPct, setPenaltyPct] = useState('')

  const { data: products = [] } = useQuery({ queryKey: ['finance-investment-products'], queryFn: () => api.finance.getInvestmentProducts() })

  const createProductMutation = useMutation({
    mutationFn: () => api.finance.createInvestmentProduct({ name: prodName, lock_in_months: Number(lockMonths), preferential_rate: Number(prefRate), early_withdrawal_penalty_percent: Number(penaltyPct) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-investment-products'] })
      setProdName(''); setLockMonths(''); setPrefRate(''); setPenaltyPct('')
      notify('Product saved.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to configure this product.'),
  })

  // Subscriptions
  const [subMembershipId, setSubMembershipId] = useState('')
  const [subProductId, setSubProductId] = useState('')
  const [subPrincipal, setSubPrincipal] = useState('')

  const { data: subscriptions = [], isLoading: isSubsLoading } = useQuery({
    queryKey: ['finance-investment-subscriptions', subMembershipId],
    queryFn: () => api.finance.getInvestmentSubscriptions(subMembershipId),
    enabled: !!subMembershipId,
  })

  const createSubMutation = useMutation({
    mutationFn: () => api.finance.createInvestmentSubscription(subMembershipId, { investment_product_id: subProductId, principal_amount: Number(subPrincipal) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-investment-subscriptions', subMembershipId] })
      setSubPrincipal('')
      notify('Member subscribed.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to subscribe this member.'),
  })

  const withdrawSubMutation = useMutation({
    mutationFn: (id: string) => api.finance.withdrawInvestmentSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-investment-subscriptions', subMembershipId] })
      notify('Payout started — come back and confirm it once the money has gone through.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to withdraw this subscription.'),
  })

  const confirmWithdrawSubMutation = useMutation({
    mutationFn: (id: string) => api.finance.confirmWithdrawInvestmentSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-investment-subscriptions', subMembershipId] })
      notify('Withdrawal confirmed and closed.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to confirm this withdrawal.'),
  })

  // Group subaccounts
  const [groupName, setGroupName] = useState('')
  const [signerIds, setSignerIds] = useState<string[]>([])
  const [requiredSignatures, setRequiredSignatures] = useState('1')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const { data: groups = [] } = useQuery({ queryKey: ['finance-group-subaccounts'], queryFn: () => api.finance.getGroupSubaccounts() })
  const { data: groupDetail } = useQuery({
    queryKey: ['finance-group-subaccount-detail', selectedGroupId],
    queryFn: () => api.finance.getGroupSubaccount(selectedGroupId!),
    enabled: !!selectedGroupId,
  })

  const createGroupMutation = useMutation({
    mutationFn: () => api.finance.createGroupSubaccount({ name: groupName, signer_membership_ids: signerIds, required_signatures: Number(requiredSignatures) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-group-subaccounts'] })
      setGroupName(''); setSignerIds([]); setRequiredSignatures('1')
      notify('Group account registered.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to register this group.'),
  })

  const depositGroupMutation = useMutation({
    mutationFn: () => api.finance.depositGroupSubaccount(selectedGroupId!, Number(depositAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-group-subaccount-detail', selectedGroupId] })
      setDepositAmount('')
      notify('Deposit recorded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this deposit.'),
  })

  const withdrawGroupMutation = useMutation({
    mutationFn: () => api.finance.withdrawGroupSubaccount(selectedGroupId!, Number(withdrawAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-group-subaccount-detail', selectedGroupId] })
      setWithdrawAmount('')
      notify('Withdrawal requested — needs sign-off from the group\'s other signers before it pays out.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to request this withdrawal — you need to be a registered signer on this group.'),
  })

  // Growth statement
  const [growthMembershipId, setGrowthMembershipId] = useState('')
  const { data: growthStatement } = useQuery({
    queryKey: ['finance-growth-statement', growthMembershipId],
    queryFn: () => api.finance.getGrowthStatement(growthMembershipId),
    enabled: !!growthMembershipId,
  })

  // Professional verification
  const [profMembershipId, setProfMembershipId] = useState('')
  const [profEmployerName, setProfEmployerName] = useState('')
  const [profInstitution, setProfInstitution] = useState('')
  const [selectedProfVerification, setSelectedProfVerification] = useState<any | null>(null)
  const [profDocFile, setProfDocFile] = useState<File | null>(null)
  const [profRejectReason, setProfRejectReason] = useState('')

  const { data: profVerifications = [], isLoading: isProfLoading } = useQuery({
    queryKey: ['finance-professional-verifications', profMembershipId],
    queryFn: () => api.finance.getProfessionalVerifications(profMembershipId),
    enabled: !!profMembershipId,
  })

  const createProfMutation = useMutation({
    mutationFn: () => api.finance.createProfessionalVerification(profMembershipId, { employer_name: profEmployerName, licensed_institution_name: profInstitution || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-professional-verifications', profMembershipId] })
      setProfEmployerName(''); setProfInstitution('')
      notify('Professional/employer verification submitted.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to submit this verification.'),
  })

  const uploadProfDocMutation = useMutation({
    mutationFn: () => api.finance.uploadProfessionalVerificationDocument(selectedProfVerification.id, profDocFile!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-professional-verifications', profMembershipId] })
      setProfDocFile(null)
      notify('Document uploaded.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to upload this document.'),
  })

  const verifyProfMutation = useMutation({
    mutationFn: (id: string) => api.finance.verifyProfessionalVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-professional-verifications', profMembershipId] })
      setSelectedProfVerification(null)
      notify('Verified.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to verify — whoever submitted this or uploaded its evidence can\'t also sign it off.'),
  })

  const rejectProfMutation = useMutation({
    mutationFn: (data: { id: string; reason: string }) => api.finance.rejectProfessionalVerification(data.id, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-professional-verifications', profMembershipId] })
      setSelectedProfVerification(null); setProfRejectReason('')
      notify('Rejected.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to reject this verification.'),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <PageHeader
        title="Finance Sector Pack"
        subtitle="Fixed-deposit investment products, chama/group joint accounts, and member growth statements."
        info="An admin always does this on the member's behalf — there's no self-service version of these screens for members themselves."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium">
        {([
          ['investments', `Investment Products (${products.length})`],
          ['groups', `Group Sub-accounts (${groups.length})`],
          ['growth', 'Growth Statement'],
          ['professional', 'Professional Verification'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Configure Product</div>
            <form onSubmit={(e) => { e.preventDefault(); if (!prodName || !lockMonths || !prefRate || !penaltyPct) return; createProductMutation.mutate() }} className="space-y-3">
              <div><label className="text-ink-muted mb-1 block">Name</label><input type="text" value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full p-2 border rounded bg-white" required /></div>
              <div><label className="text-ink-muted mb-1 block">Lock-in (months)</label><input type="number" value={lockMonths} onChange={(e) => setLockMonths(e.target.value)} className="w-full p-2 border rounded bg-white" required /></div>
              <div><label className="text-ink-muted mb-1 block">Preferential rate (%)</label><input type="number" value={prefRate} onChange={(e) => setPrefRate(e.target.value)} className="w-full p-2 border rounded bg-white" required /></div>
              <div><label className="text-ink-muted mb-1 block">Early-withdrawal penalty (%)</label><input type="number" value={penaltyPct} onChange={(e) => setPenaltyPct(e.target.value)} className="w-full p-2 border rounded bg-white" required /></div>
              <button type="submit" disabled={createProductMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Create Product</button>
            </form>

            <div className="border-t pt-3 space-y-2">
              <div className="font-bold text-ink">Subscribe a Member</div>
              <MemberPicker value={subMembershipId} onChange={setSubMembershipId} />
              {subMembershipId && (
                <form onSubmit={(e) => { e.preventDefault(); if (!subProductId || !subPrincipal) return; createSubMutation.mutate() }} className="space-y-2">
                  <select value={subProductId} onChange={(e) => setSubProductId(e.target.value)} className="w-full p-2 border rounded bg-white" required>
                    <option value="">Select a product...</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.lock_in_months}mo, {p.preferential_rate}%)</option>)}
                  </select>
                  <input type="number" placeholder="Principal amount" value={subPrincipal} onChange={(e) => setSubPrincipal(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                  <button type="submit" disabled={createSubMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Subscribe</button>
                </form>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-4">
            <div>
              <div className="font-bold text-base text-ink mb-2">Products</div>
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Lock-in</th><th className="py-2 px-3">Rate</th><th className="py-2 px-3">Penalty</th></tr></thead>
                <tbody className="divide-y">
                  {products.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No products configured.</td></tr> : products.map((p: any) => (
                    <tr key={p.id}><td className="py-2 px-3 font-medium text-ink">{p.name}</td><td className="py-2 px-3">{p.lock_in_months}mo</td><td className="py-2 px-3">{p.preferential_rate}%</td><td className="py-2 px-3">{p.early_withdrawal_penalty_percent}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {subMembershipId && (
              <div className="border-t pt-3">
                <div className="font-bold text-ink mb-2">This Member's Subscriptions</div>
                {isSubsLoading ? <div className="text-ink-muted py-2">Loading...</div> : subscriptions.length === 0 ? (
                  <div className="text-ink-muted py-2">No subscriptions yet.</div>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.map((s: any) => (
                      <div key={s.id} className="border border-[#e5ede9] rounded p-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-ink">KES {Number(s.principal_amount ?? 0).toLocaleString?.() ?? s.principal_amount} · locked until {s.locked_until}</div>
                          <div className="text-ink-muted">{s.was_early_withdrawal ? `Early withdrawal — penalty KES ${s.penalty_charged}` : null}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'ACTIVE' ? 'bg-mint-50 text-mint-700 border border-mint-200' : s.status === 'CLOSED' ? 'bg-gray-100 text-ink-muted' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {s.status === 'ACTIVE' ? 'Active' : s.status === 'CLOSED' ? 'Closed' : 'Withdrawal pending'}
                          </span>
                          {s.status === 'ACTIVE' && <button onClick={() => withdrawSubMutation.mutate(s.id)} className="px-2 py-1 bg-red-600 text-white font-bold text-[10px] rounded cursor-pointer">Withdraw (full balance)</button>}
                          {s.status === 'WITHDRAWAL_PENDING' && <button onClick={() => confirmWithdrawSubMutation.mutate(s.id)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Confirm Withdrawal</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Group Sub-account</div>
            <input type="text" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <MemberPicker value="" onChange={(id) => { if (id && !signerIds.includes(id)) setSignerIds((prev) => [...prev, id]) }} label="Add signer" />
            <div className="flex gap-1.5 flex-wrap">
              {signerIds.map((id) => (
                <span key={id} className="px-2 py-0.5 bg-surface-2 rounded text-[10px] font-mono flex items-center gap-1">
                  {id.slice(0, 8)}…
                  <button type="button" onClick={() => setSignerIds((prev) => prev.filter((x) => x !== id))} className="text-red-600 font-bold">×</button>
                </span>
              ))}
            </div>
            <div><label className="text-ink-muted mb-1 block">Required signatures (from OTHER signers, excl. initiator)</label><input type="number" min={1} value={requiredSignatures} onChange={(e) => setRequiredSignatures(e.target.value)} className="w-full p-2 border rounded bg-white" /></div>
            <button
              onClick={() => { if (groupName && signerIds.length >= 2) createGroupMutation.mutate() }}
              disabled={!groupName || signerIds.length < 2 || createGroupMutation.isPending}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Register Group (min 2 signers)
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-2">Groups</div>
            <table className="w-full text-left border-collapse mb-3">
              <thead><tr className="border-b text-ink-muted bg-surface-2"><th className="py-2 px-3">Name</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Required signatures</th><th></th></tr></thead>
              <tbody className="divide-y">
                {groups.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No groups registered.</td></tr> : groups.map((g: any) => (
                  <tr key={g.id}>
                    <td className="py-2 px-3 font-medium text-ink">{g.name}</td>
                    <td className="py-2 px-3">{g.status === 'ACTIVE' ? 'Active' : 'Closed'}</td>
                    <td className="py-2 px-3">{g.required_signatures}</td>
                    <td className="py-2 px-3 text-right"><button onClick={() => setSelectedGroupId(g.id)} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {groupDetail && (
              <div className="border-t pt-3 space-y-3">
                <div className="font-bold text-ink">{groupDetail.name} — Balance: KES {Number(groupDetail.balance ?? 0).toLocaleString()}</div>
                <div className="text-ink-muted">{(groupDetail.members ?? []).length} members · {(groupDetail.members ?? []).filter((m: any) => m.is_signer).length} signers</div>
                <div className="flex gap-2">
                  <input type="number" placeholder="Deposit amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                  <button onClick={() => depositGroupMutation.mutate()} disabled={!depositAmount} className="px-3 py-2 bg-mint-600 text-white font-bold rounded cursor-pointer">Deposit</button>
                </div>
                <div className="flex gap-2">
                  <input type="number" placeholder="Withdrawal amount (needs other signers to approve)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                  <button onClick={() => withdrawGroupMutation.mutate()} disabled={!withdrawAmount} className="px-3 py-2 bg-red-600 text-white font-bold rounded cursor-pointer">Request Withdrawal</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Member Growth Statement</div>
          <MemberPicker value={growthMembershipId} onChange={setGrowthMembershipId} />
          {growthStatement && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['As of', growthStatement.as_of],
                  ['Net contributions', `KES ${growthStatement.net_contributions}`],
                  ['Current balance', `KES ${growthStatement.current_balance}`],
                  ['Growth amount', `KES ${growthStatement.growth_amount}`],
                  ['Growth %', growthStatement.growth_percent !== null ? `${growthStatement.growth_percent}%` : '—'],
                ].map(([label, value]) => (
                  <div key={label as string} className="bg-surface-2 rounded p-3"><div className="text-ink-muted">{label}</div><div className="font-bold text-ink">{String(value)}</div></div>
                ))}
              </div>
              <div className="text-ink-muted">{growthStatement.methodology}</div>
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded font-semibold">{growthStatement.disclaimer}</div>
              {growthStatement.sacco_treasury_context && (
                <div className="text-ink-muted flex items-start gap-1.5">
                  <span>For context, here's how the SACCO's own investments are doing: {JSON.stringify(growthStatement.sacco_treasury_context)}</span>
                  <InfoTip text="This is just background information about the SACCO as a whole — it's not part of this member's own growth figure above." label="About this context" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Submit Verification</div>
            <MemberPicker value={profMembershipId} onChange={(id) => { setProfMembershipId(id); setSelectedProfVerification(null) }} />
            {profMembershipId && (
              <form onSubmit={(e) => { e.preventDefault(); if (!profEmployerName) return; createProfMutation.mutate() }} className="space-y-2">
                <input type="text" placeholder="Employer name" value={profEmployerName} onChange={(e) => setProfEmployerName(e.target.value)} className="w-full p-2 border rounded bg-white" required />
                <input type="text" placeholder="Licensed institution (optional)" value={profInstitution} onChange={(e) => setProfInstitution(e.target.value)} className="w-full p-2 border rounded bg-white" />
                <button type="submit" disabled={createProfMutation.isPending} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Submit</button>
              </form>
            )}
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-2">Verifications</div>
            <div className="text-ink-muted mb-3 flex items-start gap-1.5">
              <span>Supporting evidence only.</span>
              <InfoTip text="This doesn't automatically affect a member's KYC status or loan eligibility — a reviewer may look at it separately, by hand." label="What this is used for" />
            </div>
            {!profMembershipId ? <div className="text-ink-muted py-4 text-center">Select a member.</div> : isProfLoading ? <div className="text-ink-muted py-4 text-center">Loading...</div> : profVerifications.length === 0 ? (
              <div className="text-ink-muted py-4 text-center">No professional verifications for this member.</div>
            ) : (
              <div className="space-y-2">
                {profVerifications.map((v: any) => (
                  <div key={v.id} className="border border-[#e5ede9] rounded p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-ink">{v.employer_name}{v.licensed_institution_name ? ` · ${v.licensed_institution_name}` : ''}</div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'VERIFIED' ? 'bg-mint-50 text-mint-700 border border-mint-200' : v.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {v.status === 'SUBMITTED' ? 'Awaiting review' : v.status === 'VERIFIED' ? 'Verified' : 'Rejected'}
                      </span>
                    </div>
                    {v.status === 'SUBMITTED' && (
                      <button onClick={() => setSelectedProfVerification(v)} className="mt-2 px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Review</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedProfVerification && (
              <div className="border-t pt-3 mt-3 space-y-3 bg-surface-2 p-3 rounded">
                <div className="font-bold text-ink">Review: {selectedProfVerification.employer_name}</div>
                <div className="flex gap-2">
                  <input type="file" onChange={(e) => setProfDocFile(e.target.files?.[0] ?? null)} className="flex-1 p-1.5 border rounded bg-white" />
                  <button onClick={() => uploadProfDocMutation.mutate()} disabled={!profDocFile} className="px-3 py-1.5 bg-violet-600 text-white font-bold rounded cursor-pointer">Upload</button>
                </div>
                <div className="text-ink-muted">Needs a document attached, and someone other than whoever submitted this to sign it off.</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => verifyProfMutation.mutate(selectedProfVerification.id)} className="px-3 py-1.5 bg-mint-600 text-white font-bold rounded cursor-pointer">Verify</button>
                  <input type="text" placeholder="Rejection reason (required)..." value={profRejectReason} onChange={(e) => setProfRejectReason(e.target.value)} className="flex-1 p-1.5 border rounded bg-white" />
                  <button onClick={() => { if (profRejectReason) rejectProfMutation.mutate({ id: selectedProfVerification.id, reason: profRejectReason }) }} disabled={!profRejectReason} className="px-3 py-1.5 bg-red-600 text-white font-bold rounded cursor-pointer">Reject</button>
                  <button onClick={() => setSelectedProfVerification(null)} className="px-3 py-1.5 bg-gray-100 text-ink-muted font-bold rounded cursor-pointer">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

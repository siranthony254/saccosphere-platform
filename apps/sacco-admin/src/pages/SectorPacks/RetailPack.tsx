import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembers } from '../../hooks/useMembers'

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

export function RetailPack() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'agents' | 'market-stall' | 'table-banking' | 'invoices'>('agents')
  const [msg, setMsg] = useState<string | null>(null)
  const notify = (text: string) => { setMsg(text); setTimeout(() => setMsg(null), 4500) }

  // Agents
  const [agentUserId, setAgentUserId] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [collMembershipId, setCollMembershipId] = useState('')
  const [collAmount, setCollAmount] = useState('')
  const [recDate, setRecDate] = useState('')
  const [recAmountBanked, setRecAmountBanked] = useState('')
  const [recBankRef, setRecBankRef] = useState('')
  const [resolveNotesByRec, setResolveNotesByRec] = useState<Record<string, string>>({})

  const { data: agents = [] } = useQuery({ queryKey: ['retail-agents'], queryFn: () => api.retail.getAgents() })
  const { data: collections = [] } = useQuery({
    queryKey: ['retail-collections', selectedAgentId],
    queryFn: () => api.retail.getCollections(selectedAgentId!),
    enabled: !!selectedAgentId,
  })
  const { data: reconciliations = [] } = useQuery({
    queryKey: ['retail-reconciliations', selectedAgentId],
    queryFn: () => api.retail.getReconciliations(selectedAgentId!),
    enabled: !!selectedAgentId,
  })

  const createAgentMutation = useMutation({
    mutationFn: () => api.retail.createAgent({ user: agentUserId, is_active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-agents'] }); setAgentUserId(''); notify('Field agent registered.') },
    onError: (err: any) => notify(err?.message || 'Failed to register this agent.'),
  })

  const recordCollectionMutation = useMutation({
    mutationFn: () => api.retail.recordCollection(selectedAgentId!, { membership: collMembershipId, amount: Number(collAmount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-collections', selectedAgentId] })
      setCollMembershipId(''); setCollAmount('')
      notify('Collection posted immediately to the member\'s BOSA savings.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this collection — the member needs an open BOSA account.'),
  })

  const recordReconciliationMutation = useMutation({
    mutationFn: () => api.retail.recordReconciliation(selectedAgentId!, { business_date: recDate, amount_banked: Number(recAmountBanked), bank_reference: recBankRef || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-reconciliations', selectedAgentId] })
      setRecDate(''); setRecAmountBanked(''); setRecBankRef('')
      notify('End-of-day reconciliation recorded. A mismatch is only ever flagged (BREAK), never auto-corrected.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to record this reconciliation.'),
  })

  const resolveReconciliationMutation = useMutation({
    mutationFn: (data: { id: string; notes: string }) => api.retail.resolveReconciliation(data.id, data.notes),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-reconciliations', selectedAgentId] }); notify('Break resolved — no money moved, only the explanation was recorded.') },
    onError: (err: any) => notify(err?.message || 'Failed to resolve this break.'),
  })

  // Market stall
  const [stallMembershipId, setStallMembershipId] = useState('')
  const [stallMarketName, setStallMarketName] = useState('')
  const [stallCounty, setStallCounty] = useState('')
  const [stallNumber, setStallNumber] = useState('')

  const { data: stall, isError: stallError } = useQuery({
    queryKey: ['retail-market-stall', stallMembershipId],
    queryFn: () => api.retail.getMarketStall(stallMembershipId),
    enabled: !!stallMembershipId,
    retry: false,
  })

  const setStallMutation = useMutation({
    mutationFn: () => api.retail.setMarketStall(stallMembershipId, { market_name: stallMarketName, county: stallCounty || undefined, stall_number: stallNumber || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-market-stall', stallMembershipId] }); notify('Market/stall location saved. Reference data only — never used for collateral or agent-routing.') },
    onError: (err: any) => notify(err?.message || 'Failed to save this location.'),
  })

  // Table banking
  const [tbGroupName, setTbGroupName] = useState('')
  const [tbMemberIds, setTbMemberIds] = useState<string[]>([])
  const [selectedTbGroupId, setSelectedTbGroupId] = useState<string | null>(null)
  const [cycleDate, setCycleDate] = useState('')
  const [attachLoanId, setAttachLoanId] = useState('')
  const [recoveryLoanId, setRecoveryLoanId] = useState('')
  const [recoveryAmount, setRecoveryAmount] = useState('')

  const { data: tbGroups = [] } = useQuery({ queryKey: ['retail-tb-groups'], queryFn: () => api.retail.getTableBankingGroups() })
  const { data: tbGroupDetail } = useQuery({
    queryKey: ['retail-tb-group-detail', selectedTbGroupId],
    queryFn: () => api.retail.getTableBankingGroup(selectedTbGroupId!),
    enabled: !!selectedTbGroupId,
  })
  const { data: rotationCycles = [] } = useQuery({
    queryKey: ['retail-tb-rotation', selectedTbGroupId],
    queryFn: () => api.retail.getRotationCycles(selectedTbGroupId!),
    enabled: !!selectedTbGroupId,
  })

  const createTbGroupMutation = useMutation({
    mutationFn: () => api.retail.createTableBankingGroup({ name: tbGroupName, member_memberships: tbMemberIds }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-tb-groups'] }); setTbGroupName(''); setTbMemberIds([]); notify('Table-banking group registered — at least 2 members required.') },
    onError: (err: any) => notify(err?.message || 'Failed to register this group.'),
  })

  const createCycleMutation = useMutation({
    mutationFn: () => api.retail.createRotationCycle(selectedTbGroupId!, cycleDate),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-tb-rotation', selectedTbGroupId] }); setCycleDate(''); notify('Rotation cycle scheduled.') },
    onError: (err: any) => notify(err?.message || 'Failed to schedule this cycle.'),
  })

  const completeCycleMutation = useMutation({
    mutationFn: (cycleId: string) => api.retail.completeRotationCycle(selectedTbGroupId!, cycleId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-tb-rotation', selectedTbGroupId] }); notify('Cycle marked COMPLETED — schedule tracking only, no payout posting.') },
    onError: (err: any) => notify(err?.message || 'Failed to complete this cycle.'),
  })

  const attachGroupMutation = useMutation({
    mutationFn: () => api.retail.attachGroupToLoan(attachLoanId, selectedTbGroupId!),
    onSuccess: () => { setAttachLoanId(''); notify('Group attached to loan for joint-liability backing.') },
    onError: (err: any) => notify(err?.message || 'Failed to attach this group.'),
  })

  const groupRecoveryMutation = useMutation({
    mutationFn: () => api.retail.requestGroupRecovery(recoveryLoanId, Number(recoveryAmount)),
    onSuccess: () => { setRecoveryLoanId(''); setRecoveryAmount(''); notify('Group recovery requested — fail-closed maker-checker, equal pro-rata across other members.') },
    onError: (err: any) => notify(err?.message || 'Failed — a documented collection-contact attempt on the borrower is required first.'),
  })

  // Supplier invoices
  const [invMembership, setInvMembership] = useState('')
  const [invBuyerName, setInvBuyerName] = useState('')
  const [invNumber, setInvNumber] = useState('')
  const [invAmount, setInvAmount] = useState('')
  const [invDueDate, setInvDueDate] = useState('')
  const [advanceAmountByInvoice, setAdvanceAmountByInvoice] = useState<Record<string, string>>({})
  const [advanceRailByInvoice, setAdvanceRailByInvoice] = useState<Record<string, 'FOSA' | 'BOSA' | 'MPESA'>>({})

  const { data: invoices = [] } = useQuery({ queryKey: ['retail-supplier-invoices'], queryFn: () => api.retail.getSupplierInvoices() })

  const createInvoiceMutation = useMutation({
    mutationFn: () => api.retail.createSupplierInvoice({ membership: invMembership, buyer_name: invBuyerName, invoice_number: invNumber, invoice_amount: Number(invAmount), due_date: invDueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-supplier-invoices'] })
      setInvMembership(''); setInvBuyerName(''); setInvNumber(''); setInvAmount(''); setInvDueDate('')
      notify('Supplier invoice registered. "Verified" is a manual officer sign-off only — no real supplier/buyer integration.')
    },
    onError: (err: any) => notify(err?.message || 'Failed to register this invoice.'),
  })

  const verifyInvoiceMutation = useMutation({
    mutationFn: (id: string) => api.retail.verifySupplierInvoice(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-supplier-invoices'] }); notify('Invoice VERIFIED.') },
    onError: (err: any) => notify(err?.message || 'Failed to verify this invoice.'),
  })

  const advanceInvoiceMutation = useMutation({
    mutationFn: (id: string) => api.retail.advanceSupplierInvoice(id, { advance_amount: Number(advanceAmountByInvoice[id]), rail: advanceRailByInvoice[id] ?? 'FOSA' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['retail-supplier-invoices'] }); notify('Advance disbursed against this invoice.') },
    onError: (err: any) => notify(err?.message || 'Failed to advance against this invoice.'),
  })

  return (
    <div className="p-5 space-y-5 text-xs">
      <div>
        <div className="text-xl font-bold text-ink">Retail Sector Pack</div>
        <div className="text-ink-muted">
          Field-agent daily collection with mandatory end-of-day reconciliation, an optional market/stall registry, table-banking joint-liability circles, and short advances against a manually-verified supplier invoice. There is genuinely no field-agent self-service login — every write here is admin-authenticated, on the agent's/member's behalf.
        </div>
      </div>

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>}

      <div className="flex border-b border-[#e5ede9] gap-4 font-medium flex-wrap">
        {([
          ['agents', `Agent Collections & EOD (${agents.length})`],
          ['market-stall', 'Market/Stall Registry'],
          ['table-banking', `Table Banking (${tbGroups.length})`],
          ['invoices', `Supplier Invoices (${invoices.length})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Field Agent</div>
            <input type="text" placeholder="User ID (UUID)" value={agentUserId} onChange={(e) => setAgentUserId(e.target.value)} className="w-full p-2 border rounded bg-white font-mono" />
            <button onClick={() => agentUserId && createAgentMutation.mutate()} disabled={!agentUserId} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Register Agent</button>

            <div className="border-t pt-3">
              <div className="font-bold text-ink mb-2">Agents</div>
              <div className="space-y-1">
                {agents.length === 0 ? <div className="text-ink-muted">None registered.</div> : agents.map((a: any) => (
                  <button key={a.id} onClick={() => setSelectedAgentId(a.id)} className={`w-full text-left px-2 py-1.5 rounded ${selectedAgentId === a.id ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-surface-2 hover:bg-surface-1'}`}>
                    Agent {String(a.id).slice(0, 8)}… {a.is_active ? '' : '(inactive)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-4">
            {!selectedAgentId ? <div className="text-ink-muted py-4 text-center">Select an agent to record collections / reconciliations.</div> : (
              <>
                <div>
                  <div className="font-bold text-ink mb-2">Record Collection (posts immediately)</div>
                  <MemberPicker value={collMembershipId} onChange={setCollMembershipId} />
                  {collMembershipId && (
                    <div className="flex gap-2 mt-2">
                      <input type="number" placeholder="Amount" value={collAmount} onChange={(e) => setCollAmount(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                      <button onClick={() => recordCollectionMutation.mutate()} disabled={!collAmount} className="px-3 py-2 bg-mint-600 text-white font-bold rounded cursor-pointer">Record</button>
                    </div>
                  )}
                  <div className="mt-2 max-h-28 overflow-y-auto space-y-1">
                    {collections.map((c: any) => (
                      <div key={c.id} className="flex justify-between px-2 py-1 bg-surface-2 rounded"><span>{c.business_date}</span><span className="font-bold">KES {Number(c.amount ?? 0).toLocaleString()}</span></div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="font-bold text-ink mb-2">End-of-Day Reconciliation</div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="date" value={recDate} onChange={(e) => setRecDate(e.target.value)} className="p-2 border rounded bg-white" />
                    <input type="number" placeholder="Amount banked" value={recAmountBanked} onChange={(e) => setRecAmountBanked(e.target.value)} className="p-2 border rounded bg-white" />
                    <input type="text" placeholder="Bank reference (optional)" value={recBankRef} onChange={(e) => setRecBankRef(e.target.value)} className="p-2 border rounded bg-white" />
                  </div>
                  <button onClick={() => recDate && recAmountBanked && recordReconciliationMutation.mutate()} disabled={!recDate || !recAmountBanked} className="w-full mt-2 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Reconcile</button>

                  <div className="mt-3 space-y-2">
                    {reconciliations.map((r: any) => (
                      <div key={r.id} className="border border-[#e5ede9] rounded p-2.5">
                        <div className="flex justify-between">
                          <span>{r.business_date}: collected KES {r.total_collected} vs banked KES {r.amount_banked} (variance {r.variance})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'BALANCED' ? 'bg-mint-50 text-mint-700' : r.status === 'BREAK' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-ink-muted'}`}>{r.status}</span>
                        </div>
                        {r.status === 'BREAK' && (
                          <div className="flex gap-2 mt-1.5">
                            <input
                              type="text"
                              placeholder="Resolution notes (required)..."
                              value={resolveNotesByRec[r.id] ?? ''}
                              onChange={(e) => setResolveNotesByRec((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              className="flex-1 p-1.5 border rounded bg-white"
                            />
                            <button
                              onClick={() => { const notes = resolveNotesByRec[r.id]; if (notes) resolveReconciliationMutation.mutate({ id: r.id, notes }) }}
                              disabled={!resolveNotesByRec[r.id]}
                              className="px-2 py-1 bg-amber-600 text-white font-bold rounded cursor-pointer"
                            >
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'market-stall' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-3 shadow-sm">
          <div className="font-bold text-base text-ink">Market/Stall Registry (reference data only)</div>
          <div className="text-ink-muted">Never used for collateral or agent-routing — there's no assignment algorithm behind it.</div>
          <MemberPicker value={stallMembershipId} onChange={setStallMembershipId} />
          {stallMembershipId && (
            <div className="space-y-2">
              {!stallError && stall && <div className="p-2 bg-surface-2 rounded">Current: {stall.market_name} · {stall.county || '—'} · stall {stall.stall_number || '—'}</div>}
              <input type="text" placeholder="Market name" value={stallMarketName} onChange={(e) => setStallMarketName(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <input type="text" placeholder="County (optional)" value={stallCounty} onChange={(e) => setStallCounty(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <input type="text" placeholder="Stall number (optional)" value={stallNumber} onChange={(e) => setStallNumber(e.target.value)} className="w-full p-2 border rounded bg-white" />
              <button onClick={() => stallMarketName && setStallMutation.mutate()} disabled={!stallMarketName} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Save</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'table-banking' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Group</div>
            <input type="text" placeholder="Group name" value={tbGroupName} onChange={(e) => setTbGroupName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <MemberPicker value="" onChange={(id) => { if (id && !tbMemberIds.includes(id)) setTbMemberIds((prev) => [...prev, id]) }} label="Add member (rotation order = add order)" />
            <div className="flex gap-1.5 flex-wrap">
              {tbMemberIds.map((id, i) => (
                <span key={id} className="px-2 py-0.5 bg-surface-2 rounded text-[10px] font-mono">#{i + 1} {id.slice(0, 8)}…</span>
              ))}
            </div>
            <button onClick={() => tbGroupName && tbMemberIds.length >= 2 && createTbGroupMutation.mutate()} disabled={!tbGroupName || tbMemberIds.length < 2} className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Register (min 2 members)</button>

            <div className="border-t pt-3 space-y-1">
              <div className="font-bold text-ink mb-1">Groups</div>
              {tbGroups.map((g: any) => (
                <button key={g.id} onClick={() => setSelectedTbGroupId(g.id)} className={`w-full text-left px-2 py-1.5 rounded ${selectedTbGroupId === g.id ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-surface-2 hover:bg-surface-1'}`}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 space-y-4">
            {!selectedTbGroupId ? <div className="text-ink-muted py-4 text-center">Select a group.</div> : (
              <>
                <div className="font-bold text-ink">{tbGroupDetail?.name} — {(tbGroupDetail?.members ?? []).length} members</div>

                <div>
                  <div className="font-semibold text-ink mb-1">Rotation (schedule tracking only — no pooled fund, no payout posting)</div>
                  <div className="flex gap-2 mb-2">
                    <input type="date" value={cycleDate} onChange={(e) => setCycleDate(e.target.value)} className="flex-1 p-2 border rounded bg-white" />
                    <button onClick={() => cycleDate && createCycleMutation.mutate()} disabled={!cycleDate} className="px-3 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Schedule Cycle</button>
                  </div>
                  <div className="space-y-1">
                    {rotationCycles.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between px-2 py-1.5 bg-surface-2 rounded">
                        <span>Cycle {c.cycle_number} · {c.scheduled_date}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'COMPLETED' ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'}`}>{c.status}</span>
                          {c.status === 'PENDING' && <button onClick={() => completeCycleMutation.mutate(c.id)} className="px-2 py-1 bg-mint-600 text-white font-bold text-[10px] rounded cursor-pointer">Complete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="font-semibold text-ink mb-1">Attach to Loan (joint-liability backing)</div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Loan ID (UUID)" value={attachLoanId} onChange={(e) => setAttachLoanId(e.target.value)} className="flex-1 p-2 border rounded bg-white font-mono" />
                    <button onClick={() => attachLoanId && attachGroupMutation.mutate()} disabled={!attachLoanId} className="px-3 py-2 bg-violet-600 text-white font-bold rounded cursor-pointer">Attach</button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="font-semibold text-ink mb-1">Group Recovery (equal pro-rata, fail-closed maker-checker)</div>
                  <div className="text-ink-muted mb-1">Requires a documented collection-contact attempt on the borrower first.</div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Loan ID (UUID)" value={recoveryLoanId} onChange={(e) => setRecoveryLoanId(e.target.value)} className="flex-1 p-2 border rounded bg-white font-mono" />
                    <input type="number" placeholder="Requested amount" value={recoveryAmount} onChange={(e) => setRecoveryAmount(e.target.value)} className="w-32 p-2 border rounded bg-white" />
                    <button onClick={() => recoveryLoanId && recoveryAmount && groupRecoveryMutation.mutate()} disabled={!recoveryLoanId || !recoveryAmount} className="px-3 py-2 bg-red-600 text-white font-bold rounded cursor-pointer">Request Recovery</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm">
            <div className="font-bold text-base text-ink">Register Supplier Invoice</div>
            <MemberPicker value={invMembership} onChange={setInvMembership} />
            <input type="text" placeholder="Buyer name" value={invBuyerName} onChange={(e) => setInvBuyerName(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="text" placeholder="Invoice number" value={invNumber} onChange={(e) => setInvNumber(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="number" placeholder="Invoice amount" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="w-full p-2 border rounded bg-white" />
            <button
              onClick={() => invMembership && invBuyerName && invNumber && invAmount && invDueDate && createInvoiceMutation.mutate()}
              disabled={!invMembership || !invBuyerName || !invNumber || !invAmount || !invDueDate}
              className="w-full py-2 bg-violet-600 text-white font-bold rounded cursor-pointer"
            >
              Register Invoice
            </button>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink mb-2">Invoices (capped at 500)</div>
            <div className="space-y-2">
              {invoices.length === 0 ? <div className="text-ink-muted py-4 text-center">No invoices registered.</div> : invoices.map((inv: any) => (
                <div key={inv.id} className="border border-[#e5ede9] rounded p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div><div className="font-bold text-ink">{inv.invoice_number} · {inv.buyer_name}</div><div className="text-ink-muted">KES {Number(inv.invoice_amount ?? 0).toLocaleString()} due {inv.due_date}</div></div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'VERIFIED' ? 'bg-mint-50 text-mint-700' : 'bg-amber-50 text-amber-700'}`}>{inv.status}</span>
                  </div>
                  {inv.status === 'DRAFT' && <button onClick={() => verifyInvoiceMutation.mutate(inv.id)} className="px-2 py-1 bg-mint-600 text-white font-bold text-[10px] rounded cursor-pointer">Verify</button>}
                  {inv.status === 'VERIFIED' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Advance amount"
                        value={advanceAmountByInvoice[inv.id] ?? ''}
                        onChange={(e) => setAdvanceAmountByInvoice((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                        className="flex-1 p-1.5 border rounded bg-white"
                      />
                      <select
                        value={advanceRailByInvoice[inv.id] ?? 'FOSA'}
                        onChange={(e) => setAdvanceRailByInvoice((prev) => ({ ...prev, [inv.id]: e.target.value as any }))}
                        className="p-1.5 border rounded bg-white"
                      >
                        <option value="FOSA">FOSA</option>
                        <option value="BOSA">BOSA</option>
                        <option value="MPESA">MPESA</option>
                      </select>
                      <button onClick={() => advanceInvoiceMutation.mutate(inv.id)} disabled={!advanceAmountByInvoice[inv.id]} className="px-2 py-1 bg-violet-600 text-white font-bold text-[10px] rounded cursor-pointer">Advance</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

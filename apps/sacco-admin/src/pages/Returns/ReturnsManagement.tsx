import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'

export function ReturnsManagement() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'returns' | 'complaints' | 'agency'>('returns')

  // Returns state
  const [selectedRegulator, setSelectedRegulator] = useState<'SASRA' | 'COMMISSIONER' | 'UFAA'>('SASRA')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [manualLines, setManualLines] = useState<Record<string, string>>({})
  const [returnStatusMsg, setReturnStatusMsg] = useState<string | null>(null)

  // Auditor pack state
  const [packPeriodStart, setPackPeriodStart] = useState('2026-01-01')
  const [packPeriodEnd, setPackPeriodEnd] = useState('2026-12-31')

  // Complaints state
  const [newComplaintCategory, setNewComplaintCategory] = useState('SERVICE')
  const [newComplaintDesc, setNewComplaintDesc] = useState('')
  const [newComplainantName, setNewComplainantName] = useState('')
  const [complaintMsg, setComplaintMsg] = useState<string | null>(null)

  // Agency state
  const [agentName, setAgentName] = useState('')
  const [agentLocation, setAgentLocation] = useState('')
  const [agentBank, setAgentBank] = useState('')
  const [agentPhone, setAgentPhone] = useState('')
  const [agentMsg, setAgentMsg] = useState<string | null>(null)

  // Queries
  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['returns-templates', selectedRegulator],
    queryFn: () => api.returns.getTemplates({ regulator: selectedRegulator }),
  })

  const { data: instances = [], isLoading: isInstancesLoading } = useQuery({
    queryKey: ['returns-instances'],
    queryFn: () => api.returns.getInstances(),
  })

  const { data: complaints = [], isLoading: isComplaintsLoading } = useQuery({
    queryKey: ['complaints-list'],
    queryFn: () => api.complaints.list(),
  })

  const { data: agents = [], isLoading: isAgentsLoading } = useQuery({
    queryKey: ['agency-agents'],
    queryFn: () => api.agency.getAgents(),
  })

  // The instances LIST (above) is the summary shape — it carries no
  // `lines`. Only the detail endpoint returns the full per-line breakdown,
  // so the workbench always fetches this separately rather than trusting
  // whatever partial shape a list row or a validate/submit response has.
  const { data: workingInstance, isLoading: isWorkingInstanceLoading } = useQuery({
    queryKey: ['return-instance-detail', selectedInstanceId],
    queryFn: () => api.returns.getInstance(selectedInstanceId!),
    enabled: !!selectedInstanceId,
  })

  const refetchWorkingInstance = () => queryClient.invalidateQueries({ queryKey: ['return-instance-detail', selectedInstanceId] })

  // Mutations
  const createInstanceMutation = useMutation({
    mutationFn: (templateCode: string) =>
      api.returns.createInstance({ template_code: templateCode }),
    onSuccess: (instance) => {
      queryClient.invalidateQueries({ queryKey: ['returns-instances'] })
      setSelectedInstanceId(instance.id)
      setManualLines({})
      setReturnStatusMsg('Created new DRAFT return instance.')
    },
    onError: (err: any) => setReturnStatusMsg(err?.message || 'Failed to create return draft.'),
  })

  const saveManualLinesMutation = useMutation({
    mutationFn: (data: { id: string; lines: Record<string, string> }) =>
      api.returns.updateManualLines(data.id, data.lines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns-instances'] })
      refetchWorkingInstance()
      setReturnStatusMsg('Manual entry lines saved and recomputed.')
    },
    onError: (err: any) => setReturnStatusMsg(err?.message || 'Failed to save manual lines.'),
  })

  // validate/submit responses are action results (e.g. {status,
  // validation_report} or {approval_request_id, status, detail}), not a
  // ReturnInstance — they carry no `id`/`lines`. Always refetch the real
  // detail afterward instead of treating the response as the new working
  // instance.
  const validateMutation = useMutation({
    mutationFn: (id: string) => api.returns.validateInstance(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['returns-instances'] })
      refetchWorkingInstance()
      const findingCount = res?.validation_report?.findings?.length ?? 0
      setReturnStatusMsg(`Validation completed: ${res.status}${findingCount ? ` (${findingCount} finding${findingCount === 1 ? '' : 's'})` : ''}`)
    },
    onError: (err: any) => setReturnStatusMsg(err?.message || 'Validation failed.'),
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.returns.submitInstance(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['returns-instances'] })
      refetchWorkingInstance()
      setReturnStatusMsg(
        res?.approval_request_id
          ? 'Return submitted — queued for maker-checker approval.'
          : `Return submitted — status: ${res?.status ?? 'unknown'}.`
      )
    },
    onError: (err: any) => setReturnStatusMsg(err?.message || 'Submission failed.'),
  })

  const amendMutation = useMutation({
    mutationFn: (id: string) => api.returns.amendInstance(id),
    onSuccess: (amended) => {
      queryClient.invalidateQueries({ queryKey: ['returns-instances'] })
      setSelectedInstanceId(amended.id)
      setManualLines({})
      setReturnStatusMsg('Created a new amendment draft, linked back to the frozen original.')
    },
    onError: (err: any) => setReturnStatusMsg(err?.message || 'Failed to create an amendment.'),
  })

  const createComplaintMutation = useMutation({
    mutationFn: (data: { category: string; description: string; complainant_name?: string }) =>
      api.complaints.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints-list'] })
      setNewComplaintDesc('')
      setNewComplainantName('')
      setComplaintMsg('Complaint logged successfully.')
      setTimeout(() => setComplaintMsg(null), 4000)
    },
    onError: (err: any) => setComplaintMsg(err?.message || 'Failed to log complaint.'),
  })

  const escalateComplaintMutation = useMutation({
    mutationFn: (id: string) => api.complaints.escalate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints-list'] })
    },
    onError: (err: any) => {
      // 409 means it's already escalated (e.g. another admin got there first,
      // or this client's cached is_escalated was stale) — surface it rather
      // than failing silently.
      setComplaintMsg(err?.status === 409 ? 'This complaint was already escalated.' : err?.message || 'Failed to escalate this complaint.')
      setTimeout(() => setComplaintMsg(null), 4000)
    },
  })

  const createAgentMutation = useMutation({
    mutationFn: (data: { agent_name: string; location: string; bank_partner: string; phone_number: string }) =>
      api.agency.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-agents'] })
      setAgentName('')
      setAgentLocation('')
      setAgentBank('')
      setAgentPhone('')
      setAgentMsg('Agent registered in DRAFT status.')
      setTimeout(() => setAgentMsg(null), 4000)
    },
    onError: (err: any) => setAgentMsg(err?.message || 'Failed to register agent.'),
  })

  const handleExport = async (instanceId: string, format: 'json' | 'xlsx' | 'pdf') => {
    try {
      const data = await api.returns.exportInstance(instanceId, format)
      if (format === 'json') {
        const jsonStr = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `return_${instanceId}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const url = URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = `return_${instanceId}.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      alert('Export failed: ' + (err?.message || 'Error downloading return file.'))
    }
  }

  const handleAuditorPack = async () => {
    try {
      const blob = await api.returns.getAuditorPack({ period_start: packPeriodStart, period_end: packPeriodEnd })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sasra_auditor_pack_${packPeriodStart}_${packPeriodEnd}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Failed to download auditor pack: ' + (err?.message || 'Error occurred.'))
    }
  }

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            Regulatory Returns, Complaints &amp; Agency Banking
            <InfoTip text="The official reports this SACCO must file with the regulator (SASRA) on a schedule, member complaints that have been escalated, and agency-banking activity." label="About Regulatory Returns & Complaints" />
          </div>
          <div className="text-xs text-ink-muted">
            SASRA, Commissioner &amp; UFAA statutory returns engine, complaints desk with SLA tracking, and agency banking setup.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'returns'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Statutory Returns Engine (SASRA / UFAA)
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'complaints'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Complaints Desk &amp; SLA Tracking
        </button>
        <button
          onClick={() => setActiveTab('agency')}
          className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'agency'
              ? 'border-violet-600 text-violet-700 font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Agency Banking Management
        </button>
      </div>

      {/* TAB 1: RETURNS */}
      {activeTab === 'returns' && (
        <div className="space-y-5">
          {returnStatusMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
              {returnStatusMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Templates & Generation */}
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
              <div className="font-bold text-base text-ink">Generate Return Instance</div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Regulator Filter</label>
                <select
                  value={selectedRegulator}
                  onChange={(e) => setSelectedRegulator(e.target.value as any)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                >
                  <option value="SASRA">SASRA</option>
                  <option value="COMMISSIONER">Commissioner for Co-operatives</option>
                  <option value="UFAA">UFAA (Unclaimed Financial Assets Authority)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-ink">Available Templates</div>
                {isTemplatesLoading ? (
                  <div className="text-xs text-ink-muted">Loading templates...</div>
                ) : templates.length === 0 ? (
                  <div className="text-xs text-ink-muted">No templates available for this regulator.</div>
                ) : (
                  templates.map((tpl: any) => (
                    <div
                      key={tpl.code || tpl.id}
                      className="p-3 bg-surface-2 border border-ink-faint rounded-lg space-y-1"
                    >
                      <div className="font-bold text-xs text-ink">{tpl.name || tpl.code}</div>
                      <div className="text-[10px] text-ink-muted">{tpl.description || `Cadence: ${tpl.cadence}`}</div>
                      <button
                        onClick={() => createInstanceMutation.mutate(tpl.code)}
                        disabled={createInstanceMutation.isPending}
                        className="mt-2 w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Generate Draft Instance
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Auditor Pack Export Card */}
              <div className="border-t border-[#e5ede9] pt-4 space-y-2">
                <div className="font-bold text-xs text-ink">Download SASRA Auditor Pack</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-ink-muted block">From</label>
                    <input
                      type="date"
                      value={packPeriodStart}
                      onChange={(e) => setPackPeriodStart(e.target.value)}
                      className="w-full p-1.5 border border-ink-faint rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-ink-muted block">To</label>
                    <input
                      type="date"
                      value={packPeriodEnd}
                      onChange={(e) => setPackPeriodEnd(e.target.value)}
                      className="w-full p-1.5 border border-ink-faint rounded text-xs bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAuditorPack}
                  className="w-full py-1.5 bg-mint-600 hover:bg-mint-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Download Auditor Pack (.xlsx)
                </button>
              </div>
            </div>

            {/* Generated Instances Queue */}
            <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
              <div className="font-bold text-base text-ink">Return Instances &amp; Filing Queue</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                      <th className="py-2 px-3">Template</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Version</th>
                      <th className="py-2 px-3">Created At</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5ede9]">
                    {isInstancesLoading ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-ink-muted">Loading return instances...</td>
                      </tr>
                    ) : instances.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-ink-muted">No return instances generated yet.</td>
                      </tr>
                    ) : (
                      instances.map((inst: any) => (
                        <tr key={inst.id} className="hover:bg-surface-1">
                          <td className="py-2.5 px-3 font-semibold text-ink">{inst.template_code || inst.template_name || 'Return'}</td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                              {inst.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">v{inst.version_number ?? 1}</td>
                          <td className="py-2.5 px-3 text-ink-muted">{inst.created_at ? new Date(inst.created_at).toLocaleDateString() : '—'}</td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <button
                              onClick={() => {
                                // The list row has no `lines` — only the
                                // detail endpoint does. setSelectedInstanceId
                                // triggers the workingInstance query below;
                                // manualLines gets seeded once that resolves
                                // (see the effect-free seed in the workbench
                                // render, which reads workingInstance.lines).
                                setSelectedInstanceId(inst.id)
                                setManualLines({})
                              }}
                              className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Inspect / Fill
                            </button>
                            <button
                              onClick={() => handleExport(inst.id, 'xlsx')}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-ink text-[10px] font-semibold rounded cursor-pointer"
                            >
                              XLSX
                            </button>
                            <button
                              onClick={() => handleExport(inst.id, 'pdf')}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-ink text-[10px] font-semibold rounded cursor-pointer"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Selected Instance Work Bench */}
              {selectedInstanceId && (
                <div className="border-t border-[#e5ede9] pt-4 space-y-3 bg-surface-2 p-4 rounded-xl">
                  {isWorkingInstanceLoading || !workingInstance ? (
                    <div className="text-xs text-ink-muted">Loading instance detail...</div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-ink">
                            Working Instance: {workingInstance.template_code} (Status: {workingInstance.status})
                          </div>
                          <div className="text-[11px] text-ink-muted">Fill manual entry lines below. Computed lines recompute automatically on save.</div>
                        </div>
                        <div className="flex gap-2">
                          {workingInstance.status === 'DRAFT' && (
                            <button
                              onClick={() => validateMutation.mutate(workingInstance.id)}
                              disabled={validateMutation.isPending}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Validate
                            </button>
                          )}
                          {/* Submit requires VALIDATED exactly — the backend
                              rejects a DRAFT instance outright (409). */}
                          {workingInstance.status === 'VALIDATED' && (
                            <button
                              onClick={() => submitMutation.mutate(workingInstance.id)}
                              disabled={submitMutation.isPending}
                              className="px-3 py-1.5 bg-mint-600 hover:bg-mint-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Submit for Approval
                            </button>
                          )}
                          {/* FROZEN is permanently locked — amend/ is the
                              only forward path, never a direct edit. */}
                          {workingInstance.status === 'FROZEN' && (
                            <button
                              onClick={() => amendMutation.mutate(workingInstance.id)}
                              disabled={amendMutation.isPending}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              {amendMutation.isPending ? 'Creating amendment...' : 'Amend (new linked draft)'}
                            </button>
                          )}
                        </div>
                      </div>

                      {workingInstance.status === 'FROZEN' && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                          This return is frozen and can never be edited again. Use Amend to create a new,
                          linked draft version instead.
                        </div>
                      )}

                      {Array.isArray(workingInstance.validation_report?.findings) && workingInstance.validation_report.findings.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-ink">Validation findings</div>
                          {workingInstance.validation_report.findings.map((f: any, i: number) => (
                            <div
                              key={i}
                              className={`text-[11px] px-2 py-1.5 rounded border ${
                                f.severity === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                              }`}
                            >
                              <span className="font-bold">{f.severity}:</span> {f.message}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-white sticky top-0">
                              <th className="py-2 px-3">Ref No.</th>
                              <th className="py-2 px-3">Line Label</th>
                              <th className="py-2 px-3">Source Type</th>
                              <th className="py-2 px-3 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5ede9] bg-white">
                            {(workingInstance.lines ?? []).map((line: any) => {
                              const isManual = line.source_type === 'MANUAL_ENTRY'
                              const isRatio = line.source_type === 'RATIO'
                              return (
                                <tr key={line.ref_no}>
                                  <td className="py-2 px-3 font-mono font-bold text-ink-soft">{line.ref_no}</td>
                                  <td className="py-2 px-3 text-ink font-medium">{line.label}</td>
                                  <td className="py-2 px-3 text-ink-muted uppercase text-[10px]">{line.source_type}</td>
                                  <td className="py-2 px-3 text-right">
                                    {isManual && workingInstance.status === 'DRAFT' ? (
                                      <input
                                        type="text"
                                        value={manualLines[line.ref_no] ?? String(line.value ?? '')}
                                        onChange={(e) =>
                                          setManualLines((prev) => ({ ...prev, [line.ref_no]: e.target.value }))
                                        }
                                        className="w-28 py-1 px-2 border border-ink-faint rounded text-right font-mono text-xs bg-white"
                                      />
                                    ) : (
                                      <span className="font-mono font-bold text-ink">
                                        {Number(line.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        {/* RATIO lines are percentage-numbers (10.00 = 10%), not a shilling
                                            amount — label it so it's never mistaken for a currency figure. */}
                                        {isRatio ? '%' : ''}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {workingInstance.status === 'DRAFT' && (
                        <button
                          onClick={() =>
                            saveManualLinesMutation.mutate({ id: workingInstance.id, lines: manualLines })
                          }
                          disabled={saveManualLinesMutation.isPending}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold cursor-pointer"
                        >
                          {saveManualLinesMutation.isPending ? 'Saving...' : 'Save Manual Lines & Recompute'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLAINTS DESK */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Log Member Complaint</div>
            <div className="text-xs text-ink-muted">Feeds statutory SASRA Forms 11/12 and tracks SLA due dates automatically.</div>

            {complaintMsg && (
              <div className="p-2.5 bg-mint-50 border border-mint-200 text-mint-800 text-xs rounded font-semibold">
                {complaintMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newComplaintDesc) return
                createComplaintMutation.mutate({
                  category: newComplaintCategory,
                  description: newComplaintDesc,
                  complainant_name: newComplainantName,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Category</label>
                <select
                  value={newComplaintCategory}
                  onChange={(e) => setNewComplaintCategory(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                >
                  <option value="SERVICE">Customer Service / Staff</option>
                  <option value="LOAN">Loan Processing / Interest</option>
                  <option value="REFUND">Savings Refund / Withdrawal</option>
                  <option value="GUARANTOR">Guarantor Dispute</option>
                  <option value="FRAUD">Fraud / Unauthorized Activity</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Complainant Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. John Kamau"
                  value={newComplainantName}
                  onChange={(e) => setNewComplainantName(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Complaint Description</label>
                <textarea
                  rows={3}
                  placeholder="Details of complaint..."
                  value={newComplaintDesc}
                  onChange={(e) => setNewComplaintDesc(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createComplaintMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Log Complaint
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Active Complaints &amp; Escalations</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Complainant</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">SLA Due At</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isComplaintsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">Loading complaints...</td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">No logged complaints.</td>
                    </tr>
                  ) : (
                    complaints.map((c: any) => (
                      <tr key={c.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{c.complainant_name || 'Anonymous Member'}</td>
                        <td className="py-2.5 px-3 uppercase text-ink-soft text-[10px]">{c.category}</td>
                        <td className="py-2.5 px-3 text-ink-muted">
                          {c.sla_due_at ? new Date(c.sla_due_at).toLocaleDateString() : '14 Days'}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {c.is_escalated ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200">
                              ESCALATED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                              {c.status || 'OPEN'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!c.is_escalated && (
                            <button
                              onClick={() => escalateComplaintMutation.mutate(c.id)}
                              disabled={escalateComplaintMutation.isPending}
                              className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Escalate
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
      )}

      {/* TAB 3: AGENCY BANKING */}
      {activeTab === 'agency' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Register Agency Banking Partner</div>
            <div className="text-xs text-ink-muted">Register agency locations for wet-ink application &amp; SASRA approval tracking.</div>

            {agentMsg && (
              <div className="p-2.5 bg-mint-50 border border-mint-200 text-mint-800 text-xs rounded font-semibold">
                {agentMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!agentName || !agentLocation) return
                createAgentMutation.mutate({
                  agent_name: agentName,
                  location: agentLocation,
                  bank_partner: agentBank || 'Co-op Bank',
                  phone_number: agentPhone,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Agent Location / Outlet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kasarani Central Agency"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Town / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Nairobi"
                  value={agentLocation}
                  onChange={(e) => setAgentLocation(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Partner Bank</label>
                <input
                  type="text"
                  placeholder="e.g. Co-op Bank / KCB"
                  value={agentBank}
                  onChange={(e) => setAgentBank(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 254712345678"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={createAgentMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Register Agent Location
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Registered Agents &amp; Application Status</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Agent Outlet</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Bank Partner</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isAgentsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">Loading agency partners...</td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">No agency partners registered yet.</td>
                    </tr>
                  ) : (
                    agents.map((ag: any) => (
                      <tr key={ag.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{ag.agent_name}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{ag.location}</td>
                        <td className="py-2.5 px-3 text-ink">{ag.bank_partner || 'Co-op Bank'}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                            {ag.status || 'DRAFT'}
                          </span>
                        </td>
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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'

const RETURN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  VALIDATED: 'Checked — ready to submit',
  VALIDATION_FAILED: 'Checked — has errors',
  PENDING_APPROVAL: 'Awaiting approval',
  APPROVED: 'Approved',
  FROZEN: 'Filed — locked',
  REJECTED: 'Rejected',
}
const humanizeReturnStatus = (status: string) => RETURN_STATUS_LABELS[status] ?? status
const SOURCE_TYPE_LABELS: Record<string, string> = {
  MANUAL_ENTRY: 'You enter this',
  COMPUTED: 'Calculated automatically',
  RATIO: 'Calculated ratio (%)',
}

const AGENCY_SERVICE_OPTIONS = [
  { value: 'CASH_DEPOSIT_WITHDRAWAL', label: 'Cash deposit & withdrawal' },
  { value: 'LOAN_DISBURSEMENT_REPAYMENT', label: 'Loan disbursement & repayment' },
  { value: 'BALANCE_INQUIRY', label: 'Balance inquiry' },
  { value: 'MINI_STATEMENT', label: 'Mini statement' },
  { value: 'BILL_PAYMENT', label: 'Bill payment' },
]

const AGENCY_TRANSACTION_TYPES = [
  { value: 'CASH_DEPOSIT', label: 'Cash Deposit' },
  { value: 'CASH_WITHDRAWAL', label: 'Cash Withdrawal' },
  { value: 'LOAN_DISBURSEMENT', label: 'Cash Disbursement of Loans' },
  { value: 'LOAN_REPAYMENT', label: 'Cash Repayment of Loans' },
  { value: 'BILL_PAYMENT', label: 'Payment of Bills/School Fees' },
  { value: 'FUND_TRANSFER', label: 'Transfer of Funds' },
  { value: 'BALANCE_ENQUIRY', label: 'Account Balance Enquiry' },
  { value: 'MINI_STATEMENT', label: 'Mini Statement Requests' },
  { value: 'LOAN_FORMS_COLLECTION', label: 'Loan Forms Collection' },
  { value: 'NEW_ACCOUNTS_OPENED', label: 'New Accounts Opened' },
  { value: 'NUMBER_OF_AGENTS', label: 'Number of Agents' },
  { value: 'AGENCY_INCOME_EARNED', label: 'Agency Income Earned by the SACCO' },
  { value: 'OTHER', label: 'Others' },
]

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
  const [agentBankName, setAgentBankName] = useState('')
  const [agentProjectedIncome, setAgentProjectedIncome] = useState('')
  const [agentServices, setAgentServices] = useState<string[]>([])
  const [agentResolutionRef, setAgentResolutionRef] = useState('')
  const [agentStartDate, setAgentStartDate] = useState('')
  const [agentMsg, setAgentMsg] = useState<string | null>(null)

  // Agency transactions state
  const [txnPeriodStart, setTxnPeriodStart] = useState('2026-01-01')
  const [txnPeriodEnd, setTxnPeriodEnd] = useState('2026-03-31')
  const [txnType, setTxnType] = useState('CASH_DEPOSIT')
  const [txnCount, setTxnCount] = useState(0)
  const [txnVolume, setTxnVolume] = useState(0)
  const [txnMsg, setTxnMsg] = useState<string | null>(null)

  // Complaints statistics export state
  const [statsPeriodStart, setStatsPeriodStart] = useState('2026-01-01')
  const [statsPeriodEnd, setStatsPeriodEnd] = useState('2026-12-31')

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

  const { data: agencyTransactions = [], isLoading: isTxnsLoading } = useQuery({
    queryKey: ['agency-transactions'],
    queryFn: () => api.agency.getTransactions(),
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
      setReturnStatusMsg('New draft return created.')
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
    mutationFn: (data: {
      bank_name: string
      projected_annual_income?: number
      services_offered?: string[]
      board_resolution_reference?: string
      proposed_start_date?: string
    }) => api.agency.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-agents'] })
      setAgentBankName('')
      setAgentProjectedIncome('')
      setAgentServices([])
      setAgentResolutionRef('')
      setAgentStartDate('')
      setAgentMsg('Agency arrangement registered in DRAFT status.')
      setTimeout(() => setAgentMsg(null), 4000)
    },
    onError: (err: any) => setAgentMsg(err?.message || 'Failed to register agency arrangement.'),
  })

  const updateAgentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ status: string; notes: string }> }) =>
      api.agency.updateAgent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency-agents'] }),
    onError: (err: any) => setAgentMsg(err?.message || 'Failed to update agency arrangement.'),
  })

  const createTransactionMutation = useMutation({
    mutationFn: (data: { period_start: string; period_end: string; transaction_type: string; volume_amount: number; count: number }) =>
      api.agency.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-transactions'] })
      setTxnCount(0)
      setTxnVolume(0)
      setTxnMsg('Transaction volume logged.')
      setTimeout(() => setTxnMsg(null), 4000)
    },
    onError: (err: any) => setTxnMsg(err?.message || 'Failed to log transaction volume — a row for this period and type may already exist.'),
  })

  const handleDownloadAgentPdf = async (id: string) => {
    try {
      const blob = await api.agency.getApplicationPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agency-application-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setAgentMsg(err?.message || 'Failed to download application PDF.')
    }
  }

  const handleExportComplaintsStats = async () => {
    try {
      const blob = await api.complaints.exportStatistics({ period_start: statsPeriodStart, period_end: statsPeriodEnd })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `complaints-statistics-${statsPeriodStart}_${statsPeriodEnd}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setComplaintMsg(err?.message || 'Failed to export complaints statistics.')
    }
  }

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
            File returns with SASRA, the Commissioner and UFAA, track member complaints against a deadline, and manage agency banking.
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
                            <span className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-200">
                              {humanizeReturnStatus(inst.status)}
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
                            {workingInstance.template_code} — {humanizeReturnStatus(workingInstance.status)}
                          </div>
                          <div className="text-[11px] text-ink-muted">Fill in the editable lines below — the calculated ones update on their own when you save.</div>
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
                              {amendMutation.isPending ? 'Creating amendment...' : 'Fix It (creates a new linked draft)'}
                            </button>
                          )}
                        </div>
                      </div>

                      {workingInstance.status === 'FROZEN' && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                          This return has been filed and can't be edited anymore. Need to change something? Use "Fix It" to start a new, linked draft instead.
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
                                  <td className="py-2 px-3 text-ink-muted text-[10px]">{SOURCE_TYPE_LABELS[line.source_type] ?? line.source_type}</td>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-base text-ink">Active Complaints &amp; Escalations</div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-[10px] text-ink-muted block">From</label>
                  <input type="date" value={statsPeriodStart} onChange={(e) => setStatsPeriodStart(e.target.value)} className="p-1.5 border border-ink-faint rounded text-xs bg-white" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-muted block">To</label>
                  <input type="date" value={statsPeriodEnd} onChange={(e) => setStatsPeriodEnd(e.target.value)} className="p-1.5 border border-ink-faint rounded text-xs bg-white" />
                </div>
                <button
                  onClick={handleExportComplaintsStats}
                  className="px-2.5 py-1.5 bg-mint-600 hover:bg-mint-700 text-white rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                >
                  Export Statistics CSV
                </button>
              </div>
            </div>
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
            <div className="font-bold text-base text-ink">Register Agency Banking Arrangement</div>
            <div className="text-xs text-ink-muted">SASRA's "Application Form for Approval of a Specific Agent" — track it from draft through SASRA's decision.</div>

            {agentMsg && (
              <div className="p-2.5 bg-mint-50 border border-mint-200 text-mint-800 text-xs rounded font-semibold">
                {agentMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!agentBankName) return
                createAgentMutation.mutate({
                  bank_name: agentBankName,
                  projected_annual_income: agentProjectedIncome ? Number(agentProjectedIncome) : undefined,
                  services_offered: agentServices,
                  board_resolution_reference: agentResolutionRef || undefined,
                  proposed_start_date: agentStartDate || undefined,
                })
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Partner Bank</label>
                <input
                  type="text"
                  placeholder="e.g. Co-op Bank / KCB"
                  value={agentBankName}
                  onChange={(e) => setAgentBankName(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Services to Offer</label>
                <div className="space-y-1">
                  {AGENCY_SERVICE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-ink">
                      <input
                        type="checkbox"
                        checked={agentServices.includes(opt.value)}
                        onChange={(e) =>
                          setAgentServices((prev) =>
                            e.target.checked ? [...prev, opt.value] : prev.filter((s) => s !== opt.value)
                          )
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Projected Annual Income (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={agentProjectedIncome}
                  onChange={(e) => setAgentProjectedIncome(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Board Resolution Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BR-2026-04"
                  value={agentResolutionRef}
                  onChange={(e) => setAgentResolutionRef(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Proposed Start Date (Optional)</label>
                <input
                  type="date"
                  value={agentStartDate}
                  onChange={(e) => setAgentStartDate(e.target.value)}
                  className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={createAgentMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Register Arrangement
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Registered Arrangements &amp; Application Status</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Partner Bank</th>
                    <th className="py-2 px-3">Services</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isAgentsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">Loading agency arrangements...</td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">No agency arrangements registered yet.</td>
                    </tr>
                  ) : (
                    agents.map((ag: any) => (
                      <tr key={ag.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{ag.bank_name}</td>
                        <td className="py-2.5 px-3 text-ink-muted">
                          {(ag.services_offered ?? []).map((s: string) => AGENCY_SERVICE_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ') || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-violet-700 border border-violet-200 uppercase">
                            {ag.status || 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          {ag.status === 'DRAFT' && (
                            <button
                              onClick={() => updateAgentMutation.mutate({ id: ag.id, data: { status: 'SUBMITTED_TO_SASRA' } })}
                              disabled={updateAgentMutation.isPending}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Submit to SASRA
                            </button>
                          )}
                          {ag.status === 'SUBMITTED_TO_SASRA' && (
                            <>
                              <button
                                onClick={() => updateAgentMutation.mutate({ id: ag.id, data: { status: 'APPROVED' } })}
                                disabled={updateAgentMutation.isPending}
                                className="px-2 py-1 bg-mint-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Mark Approved
                              </button>
                              <button
                                onClick={() => updateAgentMutation.mutate({ id: ag.id, data: { status: 'REJECTED' } })}
                                disabled={updateAgentMutation.isPending}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Mark Rejected
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDownloadAgentPdf(ag.id)}
                            className="px-2 py-1 border border-ink-faint text-ink rounded text-[10px] font-bold cursor-pointer hover:bg-surface-2"
                          >
                            Application PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Log Quarterly Transaction Volume</div>
            <div className="text-xs text-ink-muted">Manual entry — agency-channel transactions happen at the partner bank's own terminals, so there's no ledger trail to derive this from. Feeds the Agency Banking Return.</div>

            {txnMsg && (
              <div className="p-2.5 bg-mint-50 border border-mint-200 text-mint-800 text-xs rounded font-semibold">
                {txnMsg}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                createTransactionMutation.mutate({
                  period_start: txnPeriodStart,
                  period_end: txnPeriodEnd,
                  transaction_type: txnType,
                  count: txnCount,
                  volume_amount: txnVolume,
                })
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Period start</label>
                  <input type="date" value={txnPeriodStart} onChange={(e) => setTxnPeriodStart(e.target.value)} className="w-full p-2 border border-ink-faint rounded text-xs bg-white" required />
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Period end</label>
                  <input type="date" value={txnPeriodEnd} onChange={(e) => setTxnPeriodEnd(e.target.value)} className="w-full p-2 border border-ink-faint rounded text-xs bg-white" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Transaction Type</label>
                <select value={txnType} onChange={(e) => setTxnType(e.target.value)} className="w-full p-2 border border-ink-faint rounded text-xs bg-white">
                  {AGENCY_TRANSACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Count</label>
                  <input type="number" value={txnCount} onChange={(e) => setTxnCount(Number(e.target.value))} className="w-full p-2 border border-ink-faint rounded text-xs bg-white" required />
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Volume (KES)</label>
                  <input type="number" step="0.01" value={txnVolume} onChange={(e) => setTxnVolume(Number(e.target.value))} className="w-full p-2 border border-ink-faint rounded text-xs bg-white" required />
                </div>
              </div>
              <button
                type="submit"
                disabled={createTransactionMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Log Volume
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Logged Transaction Volumes</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Period</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Count</th>
                    <th className="py-2 px-3 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isTxnsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">Loading transaction logs...</td>
                    </tr>
                  ) : agencyTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-ink-muted">No transaction volumes logged yet.</td>
                    </tr>
                  ) : (
                    agencyTransactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 text-ink-muted">{t.period_start} – {t.period_end}</td>
                        <td className="py-2.5 px-3 text-ink">{AGENCY_TRANSACTION_TYPES.find((o) => o.value === t.transaction_type)?.label ?? t.transaction_type}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{Number(t.count ?? 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">KES {Number(t.volume_amount ?? 0).toLocaleString()}</td>
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

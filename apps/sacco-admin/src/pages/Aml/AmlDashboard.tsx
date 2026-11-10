import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { Badge } from '../../components/ui/Badge'

const CASE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'New',
  IN_PROGRESS: 'Being investigated',
  PENDING_MLRO_REVIEW: "Awaiting the MLRO's review",
  CLOSED_STR_FILED: 'Closed — reported to the regulator',
  CLOSED_FALSE_POSITIVE: 'Closed — false alarm',
  CLOSED_NO_ACTION: 'Closed — no action needed',
}
const humanizeCaseStatus = (status: string) => CASE_STATUS_LABELS[status] ?? status
const ALERT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'New',
  UNDER_REVIEW: 'Being reviewed',
  ESCALATED: 'Escalated to a case',
}
const humanizeAlertStatus = (status: string) => ALERT_STATUS_LABELS[status] ?? status

export function AmlDashboard() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'alerts' | 'cases' | 'str' | 'ctr' | 'sanctions' | 'metrics'>('alerts')

  // Cases state
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [caseNote, setCaseNote] = useState('')
  const [dispositionReason, setDispositionReason] = useState('')
  // CLOSED_STR_FILED is deliberately NOT selectable here — the backend's
  // disposition/ endpoint doesn't verify an actual filing exists before
  // accepting that status, so offering it in this dropdown would let
  // anyone close a case as "STR filed" without ever generating or filing
  // one. The only correct path to CLOSED_STR_FILED is str-filing/file/
  // succeeding, which sets it as a side effect.
  const [dispositionStatus, setDispositionStatus] = useState<'CLOSED_FALSE_POSITIVE' | 'CLOSED_NO_ACTION'>('CLOSED_FALSE_POSITIVE')
  const [strFilingRef, setStrFilingRef] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [ctrFilingRefs, setCtrFilingRefs] = useState<Record<string, string>>({})
  const [amlMsg, setAmlMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sanctions upload state
  const [domesticFile, setDomesticFile] = useState<File | null>(null)
  const [domesticListName, setDomesticListName] = useState('')
  const [domesticSource, setDomesticSource] = useState<'DOMESTIC' | 'PEP'>('DOMESTIC')

  const showMsg = (type: 'success' | 'error', text: string) => {
    setAmlMsg({ type, text })
    setTimeout(() => setAmlMsg(null), 5000)
  }

  // Queries
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ['aml-alerts'],
    queryFn: () => api.aml.getAlerts(),
  })

  const { data: cases = [], isLoading: isCasesLoading } = useQuery({
    queryKey: ['aml-cases'],
    queryFn: () => api.aml.getCases(),
  })

  // The case list (AMLCaseListSerializer) carries no notes/evidence/alerts/
  // str_filing — those only exist on the detail endpoint. Fetching this
  // separately (rather than trusting the row object selected from the list)
  // is what makes notes/STR-filing state actually show up when reopening a
  // case instead of always rendering empty.
  const { data: caseDetail, isLoading: isCaseDetailLoading } = useQuery({
    queryKey: ['aml-case-detail', selectedCaseId],
    queryFn: () => api.aml.getCase(selectedCaseId!),
    enabled: !!selectedCaseId,
  })

  const { data: ctrReports = [], isLoading: isCtrLoading } = useQuery({
    queryKey: ['aml-ctr-reports'],
    queryFn: () => api.aml.getCtrReports(),
  })

  const { data: sanctionsResults = [], isLoading: isSanctionsLoading } = useQuery({
    queryKey: ['aml-sanctions-results'],
    queryFn: () => api.aml.getSanctionsResults(),
  })

  const { data: amlMetrics } = useQuery({
    queryKey: ['aml-metrics'],
    queryFn: () => api.aml.getMetrics(30),
  })

  const invalidateCaseDetail = () => queryClient.invalidateQueries({ queryKey: ['aml-case-detail', selectedCaseId] })

  // Mutations
  const dismissAlertMutation = useMutation({
    mutationFn: (id: string) => api.aml.dismissAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-alerts'] })
      showMsg('success', 'Alert dismissed as a false positive.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to dismiss this alert.'),
  })

  const addNoteMutation = useMutation({
    mutationFn: (data: { id: string; note: string }) => api.aml.addNote(data.id, data.note),
    onSuccess: () => {
      invalidateCaseDetail()
      setCaseNote('')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to add this note.'),
  })

  const assignCaseMutation = useMutation({
    mutationFn: (data: { id: string; assigneeId: string }) => api.aml.assignCase(data.id, data.assigneeId),
    onSuccess: () => {
      invalidateCaseDetail()
      queryClient.invalidateQueries({ queryKey: ['aml-cases'] })
      setAssigneeId('')
      showMsg('success', 'Case assigned.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to assign this case — check the user ID.'),
  })

  const uploadEvidenceMutation = useMutation({
    mutationFn: (data: { id: string; file: File }) => api.aml.uploadEvidence(data.id, data.file),
    onSuccess: () => {
      invalidateCaseDetail()
      setEvidenceFile(null)
      showMsg('success', 'Evidence uploaded.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to upload evidence.'),
  })

  const closeDispositionMutation = useMutation({
    mutationFn: (data: { id: string; status: 'CLOSED_FALSE_POSITIVE' | 'CLOSED_NO_ACTION'; reason: string }) =>
      api.aml.closeCaseDisposition(data.id, { status: data.status, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-cases'] })
      setSelectedCaseId(null)
      setDispositionReason('')
      showMsg('success', 'Case disposition recorded.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to record this disposition.'),
  })

  const generateStrMutation = useMutation({
    mutationFn: (caseId: string) => api.aml.generateStrFiling(caseId),
    onSuccess: () => {
      invalidateCaseDetail()
      showMsg('success', 'Draft report generated — review it below before it goes to the MLRO.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to generate the STR draft.'),
  })

  const fileStrMutation = useMutation({
    mutationFn: (data: { caseId: string; ref: string }) => api.aml.fileStr(data.caseId, data.ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-cases'] })
      invalidateCaseDetail()
      setStrFilingRef('')
      showMsg('success', 'STR filing reference recorded.')
    },
    onError: (err: any) => {
      // 403 here specifically means "you are not this SACCO's configured
      // MLRO" — surface that distinction rather than a generic failure,
      // since silently swallowing it could read as "it worked."
      if (err?.status === 403) {
        showMsg('error', "Only this SACCO's designated anti-money-laundering officer (MLRO) may record this.")
      } else if (err?.status === 409) {
        showMsg('error', err?.message || 'This still has unresolved problems flagged below, or was already filed.')
      } else {
        showMsg('error', err?.message || 'Failed to record this filing.')
      }
    },
  })

  const fileCtrMutation = useMutation({
    mutationFn: (data: { id: string; ref: string }) => api.aml.fileCtr(data.id, data.ref),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['aml-ctr-reports'] })
      setCtrFilingRefs((prev) => ({ ...prev, [vars.id]: '' }))
      showMsg('success', 'CTR filing reference recorded.')
    },
    onError: (err: any) => showMsg('error', err?.status === 409 ? 'This CTR report was already filed.' : err?.message || 'Failed to file this CTR report.'),
  })

  const uploadDomesticSanctionsMutation = useMutation({
    mutationFn: () => api.aml.uploadDomesticSanctions(domesticFile as File, domesticListName, { source: domesticSource }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aml-sanctions-results'] })
      setDomesticFile(null)
      setDomesticListName('')
      showMsg('success', 'List uploaded — members and transactions were automatically re-checked against it.')
    },
    onError: (err: any) => showMsg('error', err?.message || 'Failed to upload this list.'),
  })

  const clearSanctionsMutation = useMutation({
    mutationFn: (id: string) => api.aml.clearSanctionsResult(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aml-sanctions-results'] }),
    onError: (err: any) => showMsg('error', err?.message || 'Failed to clear this match.'),
  })

  const confirmSanctionsMutation = useMutation({
    mutationFn: (id: string) => api.aml.confirmSanctionsResult(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aml-sanctions-results'] }),
    onError: (err: any) => showMsg('error', err?.message || 'Failed to confirm this match.'),
  })

  const strFiling = caseDetail?.str_filing ?? null
  const strFindings: Array<{ severity: string; message: string }> = strFiling?.validation_report?.findings ?? []
  const hasBlockingStrError = strFindings.some((f) => f.severity === 'ERROR')

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xl font-bold text-ink flex items-center gap-1.5">
            AML, Fraud Detection &amp; goAML Reporting
            <InfoTip text="Flags transactions and member activity that look suspicious, so they can be investigated and — if needed — reported to the regulator." label="About AML & Fraud Detection" />
          </div>
          <div className="text-xs text-ink-muted flex items-start gap-1.5">
            <span>Detection rules, case investigations, regulator filings and sanctions-list screening.</span>
            <InfoTip text="STR = Suspicious Transaction Report, CTR = Cash Transaction Report, MLRO = this SACCO's designated Money Laundering Reporting Officer, FRC = the Financial Reporting Centre (the regulator these get filed with). This all follows Kenya's anti-money-laundering law (POCAMLA)." label="Acronyms used on this page" />
          </div>
        </div>
      </div>

      {amlMsg && (
        <div className={`p-3 text-xs rounded-lg font-semibold border ${amlMsg.type === 'success' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {amlMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e5ede9] gap-4 text-sm font-medium overflow-x-auto">
        {([
          ['alerts', `Daily Alerts (${alerts.length})`],
          ['cases', 'Case Investigations'],
          ['str', 'STR & Regulator Filing'],
          ['ctr', 'Weekly Cash Reports'],
          ['sanctions', 'Sanctions Screening'],
          ['metrics', 'AML Metrics'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-2.5 px-1 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === key ? 'border-violet-600 text-violet-700 font-semibold' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">AML Detection Alerts</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                  <th className="py-2.5 px-3">Rule</th>
                  <th className="py-2.5 px-3">Subject Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Evidence Snapshot</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isAlertsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted">Loading daily AML alerts...</td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-ink-muted">No open AML alerts.</td>
                  </tr>
                ) : (
                  alerts.map((alt: any) => {
                    // A CRITICAL alert auto-escalates into a case server-side —
                    // by the time it shows here as ESCALATED, dismissing it
                    // from the raw alert list would bypass the case that
                    // already exists for it. Only an OPEN/UNDER_REVIEW alert
                    // is still a plain false-positive-or-not decision.
                    const dismissable = !alt.status || alt.status === 'OPEN' || alt.status === 'UNDER_REVIEW'
                    return (
                      <tr key={alt.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{alt.rule_code || 'Rule Violation'}</td>
                        <td className="py-2.5 px-3 text-ink-muted uppercase">{alt.subject_type || 'MEMBER'}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <Badge variant={alt.severity === 'CRITICAL' || alt.severity === 'HIGH' ? 'error' : 'warning'}>
                            {alt.severity}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-ink">
                          {humanizeAlertStatus(alt.status || 'OPEN')}
                          {alt.case && !dismissable && (
                            <button
                              onClick={() => { setActiveTab('cases'); setSelectedCaseId(alt.case) }}
                              className="ml-2 text-violet-700 underline text-[10px]"
                            >
                              View case →
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-ink-muted max-w-xs truncate">
                          {JSON.stringify(alt.evidence ?? {})}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {dismissable ? (
                            <button
                              onClick={() => dismissAlertMutation.mutate(alt.id)}
                              disabled={dismissAlertMutation.isPending}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-ink-muted rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Dismiss (False Positive)
                            </button>
                          ) : (
                            <span className="text-[10px] text-ink-faint">Escalated</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CASES */}
      {activeTab === 'cases' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Cases Queue</div>
            <div className="overflow-y-auto max-h-[500px] space-y-2">
              {isCasesLoading ? (
                <div className="text-xs text-ink-muted">Loading cases...</div>
              ) : cases.length === 0 ? (
                <div className="text-xs text-ink-muted">No open AML cases.</div>
              ) : (
                cases.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedCaseId === c.id
                        ? 'bg-violet-50 border-violet-400 font-semibold'
                        : 'bg-surface-2 border-ink-faint hover:bg-surface-1'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-violet-700">{c.case_number || c.id}</span>
                      <span className="text-[10px] uppercase font-bold text-ink-muted">{c.case_type}</span>
                    </div>
                    <div className="text-[10px] text-ink-faint mt-1">Status: {humanizeCaseStatus(c.status)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Case Investigation Workbench</div>
            {!selectedCaseId ? (
              <div className="text-xs text-ink-muted">Select a case from the queue to investigate.</div>
            ) : isCaseDetailLoading || !caseDetail ? (
              <div className="text-xs text-ink-muted">Loading case detail...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-surface-2 p-3 rounded-lg border border-ink-faint space-y-1">
                  <div><span className="text-ink-muted">Case Ref:</span> <span className="font-mono font-bold">{caseDetail.case_number}</span></div>
                  <div><span className="text-ink-muted">Case Type:</span> <span className="font-bold uppercase">{caseDetail.case_type}</span></div>
                  <div><span className="text-ink-muted">Status:</span> {humanizeCaseStatus(caseDetail.status)}</div>
                  <div><span className="text-ink-muted">Assigned to:</span> {caseDetail.assigned_to || 'Unassigned'}</div>
                  <div><span className="text-ink-muted">Suspicion Clock Started:</span> {caseDetail.suspicion_detected_at ? new Date(caseDetail.suspicion_detected_at).toLocaleString() : '—'}</div>
                </div>

                {/* Assign */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Assignee user ID"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="flex-1 p-2 border border-ink-faint rounded text-xs bg-white"
                  />
                  <button
                    onClick={() => assigneeId && assignCaseMutation.mutate({ id: caseDetail.id, assigneeId })}
                    disabled={!assigneeId || assignCaseMutation.isPending}
                    className="px-3 py-1.5 bg-surface-2 border border-ink-faint hover:bg-surface-1 text-ink font-bold rounded text-xs cursor-pointer disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2">
                  <div className="font-bold text-ink">Investigation Notes</div>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-surface-2 p-2 rounded border">
                    {(caseDetail.notes ?? []).map((n: any, idx: number) => (
                      <div key={idx} className="text-[11px] border-b border-ink-faint pb-1 last:border-0">
                        <span className="text-ink-muted text-[10px]">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}:</span> {n.note}
                      </div>
                    ))}
                    {(caseDetail.notes ?? []).length === 0 && <div className="text-ink-muted italic">No notes added.</div>}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add investigation note..."
                      value={caseNote}
                      onChange={(e) => setCaseNote(e.target.value)}
                      className="flex-1 p-2 border border-ink-faint rounded text-xs bg-white"
                    />
                    <button
                      onClick={() => {
                        if (!caseNote) return
                        addNoteMutation.mutate({ id: caseDetail.id, note: caseNote })
                      }}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded text-xs cursor-pointer"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Evidence */}
                <div className="space-y-2">
                  <div className="font-bold text-ink">Evidence</div>
                  <div className="space-y-1 bg-surface-2 p-2 rounded border">
                    {(caseDetail.evidence ?? []).map((e: any) => (
                      <div key={e.id} className="text-[11px]">{e.file_name || e.file || 'Attachment'}</div>
                    ))}
                    {(caseDetail.evidence ?? []).length === 0 && <div className="text-ink-muted italic text-[11px]">No evidence attached.</div>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="flex-1 text-xs"
                    />
                    <button
                      onClick={() => evidenceFile && uploadEvidenceMutation.mutate({ id: caseDetail.id, file: evidenceFile })}
                      disabled={!evidenceFile || uploadEvidenceMutation.isPending}
                      className="px-3 py-1.5 bg-surface-2 border border-ink-faint hover:bg-surface-1 text-ink font-bold rounded text-xs cursor-pointer disabled:opacity-50"
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {/* Close Disposition */}
                <div className="border-t border-[#e5ede9] pt-3 space-y-2">
                  <div className="font-bold text-ink">Close This Case</div>
                  <p className="text-[10px] text-ink-faint">
                    If this turned out to be a genuine money-laundering concern, don't close it here — go to the STR &amp; Regulator Filing tab and file the report; this case closes itself automatically once that's done.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-ink-muted block mb-1">Why is it closing?</label>
                      <select
                        value={dispositionStatus}
                        onChange={(e) => setDispositionStatus(e.target.value as any)}
                        className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                      >
                        <option value="CLOSED_FALSE_POSITIVE">False alarm</option>
                        <option value="CLOSED_NO_ACTION">Reviewed — no action needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-ink-muted block mb-1">Justification Reason</label>
                      <input
                        type="text"
                        placeholder="Reason for disposition..."
                        value={dispositionReason}
                        onChange={(e) => setDispositionReason(e.target.value)}
                        className="w-full p-2 border border-ink-faint rounded text-xs bg-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!dispositionReason) return
                      closeDispositionMutation.mutate({ id: caseDetail.id, status: dispositionStatus, reason: dispositionReason })
                    }}
                    disabled={!dispositionReason || closeDispositionMutation.isPending}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded cursor-pointer"
                  >
                    Close Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STR & GOAML */}
      {activeTab === 'str' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Suspicious Transaction Report</div>
          <div className="text-xs text-ink-muted space-y-1">
            <p>Prepares a draft report for this SACCO's anti-money-laundering officer (MLRO) to review.</p>
            <p className="text-amber-700 font-semibold">
              This does NOT submit anything to the regulator (FRC) itself. The MLRO still has to review the draft
              and upload it to the regulator's own system by hand — the box below only records that they did, after the fact.
            </p>
          </div>

          {!selectedCaseId || !caseDetail ? (
            <div className="text-xs text-ink-muted">
              Select a case from the Case Investigations tab to prepare its report.
            </div>
          ) : caseDetail.case_type !== 'STR' ? (
            <div className="text-xs text-ink-muted">
              Case {caseDetail.case_number} isn't the kind of case this report applies to.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-surface-2 p-3 rounded border">
                <div className="font-bold text-xs text-ink">Selected Case: {caseDetail.case_number}</div>
                <button
                  onClick={() => generateStrMutation.mutate(caseDetail.id)}
                  disabled={generateStrMutation.isPending}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-bold cursor-pointer"
                >
                  {generateStrMutation.isPending ? 'Generating...' : strFiling ? 'Regenerate Draft' : 'Generate Draft'}
                </button>
              </div>

              {strFiling && (
                <>
                  {strFindings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-ink">Validation findings</div>
                      {strFindings.map((f, i) => (
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

                  <div>
                    <div className="text-xs font-bold text-ink mb-1 flex items-center gap-1.5">
                      Draft Report
                      <InfoTip text="This is a draft in the technical format (goAML XML) the regulator expects — it's not final until the MLRO has reviewed it and uploaded it themselves." label="About this draft" />
                    </div>
                    <textarea
                      rows={8}
                      value={strFiling.xml_content ?? ''}
                      readOnly
                      className="w-full p-3 font-mono text-[10px] bg-slate-900 text-emerald-400 rounded-lg border"
                    />
                  </div>

                  {caseDetail.status === 'CLOSED_STR_FILED' ? (
                    <div className="text-xs font-semibold text-mint-700 bg-mint-50 border border-mint-200 rounded p-2">
                      Filed — reference on record.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {hasBlockingStrError && (
                        <div className="text-[11px] text-red-700 font-semibold">
                          There's a problem flagged above in red — fix that before this can be recorded as filed.
                        </div>
                      )}
                      <div className="flex gap-2 items-center pt-1">
                        <input
                          type="text"
                          placeholder="Reference number, once the MLRO has actually uploaded it..."
                          value={strFilingRef}
                          onChange={(e) => setStrFilingRef(e.target.value)}
                          className="flex-1 p-2 border border-ink-faint rounded text-xs bg-white"
                        />
                        <button
                          onClick={() => {
                            if (!strFilingRef) return
                            fileStrMutation.mutate({ caseId: caseDetail.id, ref: strFilingRef })
                          }}
                          disabled={!strFilingRef || hasBlockingStrError || fileStrMutation.isPending}
                          className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50"
                        >
                          Record MLRO Filing Reference
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CTR */}
      {activeTab === 'ctr' && (
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm">
          <div className="font-bold text-base text-ink">Large Cash Transaction Reports</div>
          <div className="text-xs text-ink-muted">A weekly report of large cash movements, generated automatically — you just file the reference once it's been sent to the regulator.</div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                  <th className="py-2 px-3">Period</th>
                  <th className="py-2 px-3">Total Amount</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Filing Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5ede9]">
                {isCtrLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-muted">Loading CTR reports...</td>
                  </tr>
                ) : ctrReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-muted">No CTR reports generated.</td>
                  </tr>
                ) : (
                  ctrReports.map((ctr: any) => (
                    <tr key={ctr.id} className="hover:bg-surface-1">
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {ctr.period_start && ctr.period_end
                          ? `${new Date(ctr.period_start).toLocaleDateString()} – ${new Date(ctr.period_end).toLocaleDateString()}`
                          : 'Weekly Sweep'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-ink">KES {Number(ctr.total_amount ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-violet-700">{ctr.status === 'FILED' ? 'Filed' : 'Draft'}</td>
                      <td className="py-2.5 px-3 font-mono text-ink-muted">
                        {ctr.filing_reference || (
                          <div className="flex gap-1 items-center">
                            <input
                              type="text"
                              placeholder="Filing reference"
                              value={ctrFilingRefs[ctr.id] ?? ''}
                              onChange={(e) => setCtrFilingRefs((prev) => ({ ...prev, [ctr.id]: e.target.value }))}
                              className="p-1 border border-ink-faint rounded text-[11px] w-32"
                            />
                            <button
                              onClick={() => {
                                const ref = ctrFilingRefs[ctr.id]
                                if (ref) fileCtrMutation.mutate({ id: ctr.id, ref })
                              }}
                              disabled={!ctrFilingRefs[ctr.id] || fileCtrMutation.isPending}
                              className="px-2 py-1 bg-mint-600 hover:bg-mint-700 text-white rounded text-[10px] font-bold disabled:opacity-50"
                            >
                              File
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SANCTIONS */}
      {activeTab === 'sanctions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
            <div className="font-bold text-base text-ink">Upload Domestic Sanctions List</div>
            <div className="text-xs text-ink-muted">Upload a watchlist (CSV/XLSX) — every member is automatically checked against it.</div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!domesticFile || !domesticListName.trim()) return
                uploadDomesticSanctionsMutation.mutate()
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="List name (e.g. Internal Watchlist Jan 2026)"
                value={domesticListName}
                onChange={(e) => setDomesticListName(e.target.value)}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
                required
              />

              <select
                value={domesticSource}
                onChange={(e) => setDomesticSource(e.target.value as 'DOMESTIC' | 'PEP')}
                className="w-full p-2 border border-[#e5ede9] rounded text-xs bg-white"
              >
                <option value="DOMESTIC">Domestic watchlist</option>
                <option value="PEP">Politically-exposed persons (PEP)</option>
              </select>

              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => setDomesticFile(e.target.files?.[0] || null)}
                className="w-full text-xs"
                required
              />

              <button
                type="submit"
                disabled={!domesticFile || !domesticListName.trim() || uploadDomesticSanctionsMutation.isPending}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded cursor-pointer"
              >
                Upload &amp; Auto-Screen
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-4 shadow-sm md:col-span-2">
            <div className="font-bold text-base text-ink">Sanctions Screening Results</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5ede9] text-ink-muted font-semibold bg-surface-2">
                    <th className="py-2 px-3">Matched Entry</th>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Match Confidence</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ede9]">
                  {isSanctionsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">Loading sanctions matches...</td>
                    </tr>
                  ) : sanctionsResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-ink-muted">No sanctions potential matches.</td>
                    </tr>
                  ) : (
                    sanctionsResults.map((s: any) => (
                      <tr key={s.id} className="hover:bg-surface-1">
                        <td className="py-2.5 px-3 font-semibold text-ink">{s.matched_entry_name || '—'}</td>
                        <td className="py-2.5 px-3 text-ink-muted uppercase">{s.subject_type || 'MEMBER'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{(Number(s.match_score ?? 0) * 100).toFixed(0)}%</td>
                        <td className="py-2.5 px-3 font-bold text-violet-700">{s.status === 'POTENTIAL_MATCH' ? 'Needs review' : s.status === 'CONFIRMED' ? 'Confirmed match' : 'Cleared'}</td>
                        <td className="py-2.5 px-3 text-right space-x-1">
                          {s.status === 'POTENTIAL_MATCH' && (
                            <>
                              <button
                                onClick={() => clearSanctionsMutation.mutate(s.id)}
                                className="px-2 py-1 bg-gray-100 text-ink-muted rounded text-[10px] font-bold"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => confirmSanctionsMutation.mutate(s.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                              >
                                Confirm Match
                              </button>
                            </>
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

      {/* TAB 6: METRICS */}
      {activeTab === 'metrics' && amlMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
            <div className="text-xs text-ink-muted uppercase font-bold mb-1">Total Alerts (30 Days)</div>
            <div className="text-2xl font-bold text-ink">{amlMetrics.total_alerts ?? 0}</div>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
            <div className="text-xs text-ink-muted uppercase font-bold mb-1">False Positive Rate</div>
            <div className="text-2xl font-bold text-violet-700">
              {amlMetrics.false_positive_rate != null ? `${(amlMetrics.false_positive_rate * 100).toFixed(1)}%` : 'No window data'}
            </div>
          </div>
          <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm">
            <div className="text-xs text-ink-muted uppercase font-bold mb-1">SLA Breaches</div>
            <div className="text-2xl font-bold text-red-700">{amlMetrics.sla_breaches ?? 0}</div>
          </div>
        </div>
      )}
    </div>
  )
}

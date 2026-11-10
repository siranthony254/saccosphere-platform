import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { Badge } from '../../components/ui/Badge'

const PRODUCTS: Array<{ value: string; label: string }> = [
  { value: 'MEMBERS', label: 'Members and KYC fields' },
  { value: 'NOMINEES', label: 'Nominees' },
  { value: 'EMPLOYERS', label: 'Employers and payroll numbers' },
  { value: 'SAVINGS_BALANCES', label: 'Savings and share balances' },
  { value: 'LOANS', label: 'Loans (original terms)' },
  { value: 'LOAN_SCHEDULES', label: 'Loan remaining schedules' },
  { value: 'GUARANTORS', label: 'Guarantors per loan' },
  { value: 'DIVIDEND_HISTORY', label: 'Dividend history (optional)' },
]

const RECONCILABLE_PRODUCTS = ['SAVINGS_BALANCES', 'LOANS', 'DIVIDEND_HISTORY']

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  VALIDATED: 'info',
  VALIDATION_FAILED: 'error',
  PENDING_APPROVAL: 'warning',
  COMMITTED: 'success',
  COMMIT_FAILED: 'error',
  ROLLED_BACK: 'neutral',
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function MigrationToolkit() {
  const queryClient = useQueryClient()
  const [saccoId, setSaccoId] = useState('')
  const [cutoverDate, setCutoverDate] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [reconcileProduct, setReconcileProduct] = useState('SAVINGS_BALANCES')
  const [reconcileText, setReconcileText] = useState('')

  const { data: saccosData } = useQuery({
    queryKey: ['superadmin-saccos'],
    queryFn: () => api.superAdmin.getSaccos(),
  })
  const saccos = saccosData?.results ?? []

  const { data: batches = [], isLoading: isBatchesLoading } = useQuery({
    queryKey: ['onboarding-batches'],
    queryFn: () => api.migrationToolkit.getBatches(),
  })

  const { data: batch, isLoading: isBatchLoading } = useQuery({
    queryKey: ['onboarding-batch', selectedBatchId],
    queryFn: () => api.migrationToolkit.getBatch(selectedBatchId as string),
    enabled: !!selectedBatchId,
  })

  const createBatchMutation = useMutation({
    mutationFn: () => api.migrationToolkit.createBatch({ sacco: saccoId, cutover_date: cutoverDate }),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batches'] })
      setSaccoId('')
      setCutoverDate('')
      setSelectedBatchId(created.id)
      setMsg('Onboarding batch created. Upload each product file next.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to create this batch — the SACCO must be newly created with no members yet.'),
  })

  const uploadMutation = useMutation({
    mutationFn: (data: { product: string; file: File }) => api.migrationToolkit.uploadFile(selectedBatchId as string, data.product, data.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batch', selectedBatchId] })
      setMsg('File uploaded.')
      setTimeout(() => setMsg(null), 3000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to upload this file.'),
  })

  const dryRunMutation = useMutation({
    mutationFn: () => api.migrationToolkit.runDryRun(selectedBatchId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batch', selectedBatchId] })
      setMsg('Dry run complete — check the validation report below.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Dry run failed.'),
  })

  const commitMutation = useMutation({
    mutationFn: () => api.migrationToolkit.commitBatch(selectedBatchId as string),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batch', selectedBatchId] })
      setMsg(result?.status ? 'Commit complete.' : 'Submitted for a second super admin to approve.')
      setTimeout(() => setMsg(null), 5000)
    },
    // Backend gap: see api.migrationToolkit.commitBatch's comment — a 428
    // here can't yet be cleared by retrying with a code on this screen.
    onError: (err: any) => setMsg(
      err?.status === 428
        ? 'This action needs a very recent step-up verification. Approve or confirm another sensitive action first (e.g. the Approvals queue), then retry within a few minutes.'
        : err?.message || 'Commit failed.'
    ),
  })

  const rollbackMutation = useMutation({
    mutationFn: () => api.migrationToolkit.rollbackBatch(selectedBatchId as string),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batch', selectedBatchId] })
      setMsg(result?.status ? 'Rolled back.' : 'Rollback submitted for a second super admin to approve.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(
      err?.status === 428
        ? 'This action needs a very recent step-up verification. Approve or confirm another sensitive action first (e.g. the Approvals queue), then retry within a few minutes.'
        : err?.message || 'Rollback failed — a live transaction may already have touched what was committed.'
    ),
  })

  const reconcileMutation = useMutation({
    mutationFn: () => {
      const totals: Record<string, number> = {}
      for (const line of reconcileText.split('\n')) {
        const [memberNumber, amount] = line.split(',').map((s) => s.trim())
        if (memberNumber && amount) totals[memberNumber] = Number(amount)
      }
      return api.migrationToolkit.reconcile(selectedBatchId as string, { product: reconcileProduct as any, totals })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-batch', selectedBatchId] })
      setMsg('Reconciliation complete — check the report below.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Reconciliation failed.'),
  })

  const fileByProduct = (product: string) => (batch?.files ?? []).find((f: any) => f.product === product)

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-lg font-semibold text-ink flex items-center gap-1.5">
          Migration Toolkit
          <InfoTip text="Brings a brand-new pilot SACCO's historical members, balances, loans and guarantors onto the platform in bulk — its own staff have no accounts yet, so this is done on their behalf." label="About the Migration Toolkit" />
        </div>
        <div className="text-xs text-ink-muted">Upload, validate, commit once at cutover, and reconcile a new SACCO's legacy data.</div>
      </div>

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
          <div className="font-bold text-base text-ink">New Onboarding Batch</div>
          <div>
            <label className="text-ink-muted mb-1 block">SACCO</label>
            <select value={saccoId} onChange={(e) => setSaccoId(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white">
              <option value="">Select a newly-created SACCO...</option>
              {saccos.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-ink-muted mb-1 block">Cutover Date</label>
            <input type="date" value={cutoverDate} onChange={(e) => setCutoverDate(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
            <div className="text-ink-faint mt-1">Run commit close to this date — it's stamped on the opening ledger entry, not used to filter the data itself.</div>
          </div>
          <button
            onClick={() => saccoId && cutoverDate && createBatchMutation.mutate()}
            disabled={!saccoId || !cutoverDate || createBatchMutation.isPending}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
          >
            Create Batch
          </button>

          <div className="border-t pt-3">
            <div className="font-bold text-ink mb-2">Download Templates</div>
            <div className="space-y-1">
              {PRODUCTS.map((p) => (
                <button
                  key={p.value}
                  onClick={async () => downloadBlob(await api.migrationToolkit.downloadTemplate(p.value, 'xlsx'), `${p.value.toLowerCase()}_template.xlsx`)}
                  className="w-full text-left px-2 py-1.5 bg-surface-2 hover:bg-surface-1 rounded text-ink"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
          <div className="font-bold text-base text-ink mb-3">Onboarding Batches</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">SACCO</th>
                  <th className="py-2 px-3">Cutover</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Files</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isBatchesLoading ? (
                  <tr><td colSpan={5} className="py-4 text-center text-ink-muted">Loading batches...</td></tr>
                ) : batches.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-ink-muted">No onboarding batches yet.</td></tr>
                ) : (
                  batches.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-2 px-3 font-semibold text-ink">{b.sacco_name}</td>
                      <td className="py-2 px-3 text-ink-muted">{b.cutover_date}</td>
                      <td className="py-2 px-3"><Badge variant={STATUS_VARIANT[b.status] ?? 'neutral'}>{b.status}</Badge></td>
                      <td className="py-2 px-3 text-ink-muted">{(b.files ?? []).length}/{PRODUCTS.length}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => setSelectedBatchId(b.id)} className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold">Open</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedBatchId && (
            <div className="border-t pt-4 mt-4 space-y-4">
              {isBatchLoading ? (
                <div className="text-ink-muted">Loading batch...</div>
              ) : batch ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="font-bold text-ink">{batch.sacco_name} — <Badge variant={STATUS_VARIANT[batch.status] ?? 'neutral'}>{batch.status}</Badge></div>
                    <div className="flex gap-1.5">
                      <button onClick={() => dryRunMutation.mutate()} disabled={dryRunMutation.isPending} className="px-2.5 py-1.5 bg-blue-600 text-white rounded font-bold text-[10px]">Run Dry Run</button>
                      {batch.status === 'VALIDATED' && (
                        <button onClick={() => commitMutation.mutate()} disabled={commitMutation.isPending} className="px-2.5 py-1.5 bg-mint-600 text-white rounded font-bold text-[10px]">Commit</button>
                      )}
                      {batch.status === 'COMMITTED' && (
                        <button onClick={() => confirm('Roll back this committed batch?') && rollbackMutation.mutate()} disabled={rollbackMutation.isPending} className="px-2.5 py-1.5 bg-red-600 text-white rounded font-bold text-[10px]">Rollback</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-ink mb-2">Product Files</div>
                    <div className="space-y-1.5">
                      {PRODUCTS.map((p) => {
                        const uploaded = fileByProduct(p.value)
                        return (
                          <div key={p.value} className="flex items-center justify-between bg-surface-2 rounded px-2 py-1.5">
                            <span className="text-ink">{p.label}</span>
                            <div className="flex items-center gap-2">
                              {uploaded && <span className="text-mint-700 font-semibold">{uploaded.row_count} rows</span>}
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) uploadMutation.mutate({ product: p.value, file })
                                }}
                                className="text-[10px] w-40"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {Object.keys(batch.validation_report ?? {}).length > 0 && (
                    <div>
                      <div className="font-bold text-ink mb-1.5">Validation Report</div>
                      <pre className="bg-surface-2 rounded p-2 text-[10px] overflow-x-auto max-h-56">{JSON.stringify(batch.validation_report, null, 2)}</pre>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="font-bold text-ink mb-2 flex items-center gap-1.5">
                      Reconcile
                      <InfoTip text="Paste the legacy system's own totals per member (one 'member_number,amount' per line) — this checks them against what was actually committed." label="How reconciliation works" />
                    </div>
                    <div className="flex gap-2 mb-1.5">
                      <select value={reconcileProduct} onChange={(e) => setReconcileProduct(e.target.value)} className="p-1.5 border border-ink-faint rounded bg-white">
                        {RECONCILABLE_PRODUCTS.map((p) => <option key={p} value={p}>{PRODUCTS.find((pp) => pp.value === p)?.label}</option>)}
                      </select>
                    </div>
                    <textarea
                      rows={4}
                      placeholder={'member_number,amount\nM-00123,15000.00\nM-00124,8200.00'}
                      value={reconcileText}
                      onChange={(e) => setReconcileText(e.target.value)}
                      className="w-full p-2 border border-ink-faint rounded font-mono bg-white mb-1.5"
                    />
                    <button
                      onClick={() => reconcileText && reconcileMutation.mutate()}
                      disabled={!reconcileText || reconcileMutation.isPending}
                      className="px-3 py-1.5 bg-violet-600 text-white rounded font-bold cursor-pointer disabled:opacity-50"
                    >
                      Reconcile
                    </button>
                    {Object.keys(batch.reconciliation_report ?? {}).length > 0 && (
                      <pre className="bg-surface-2 rounded p-2 text-[10px] overflow-x-auto max-h-56 mt-2">{JSON.stringify(batch.reconciliation_report, null, 2)}</pre>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

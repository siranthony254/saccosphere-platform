import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { InfoTip } from '@saccosphere/ui'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-mint-50 text-mint-700 border-mint-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
}

const IN_PROGRESS = ['PENDING', 'PROCESSING']

export function StatementImport() {
  const queryClient = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['statement-import-jobs'],
    queryFn: () => api.statementImport.getJobs(),
    refetchInterval: (query) => {
      const list = query.state.data as any[] | undefined
      return list?.some((j) => IN_PROGRESS.includes(j.status)) ? 3000 : false
    },
  })

  const { data: job } = useQuery({
    queryKey: ['statement-import-job', selectedJobId],
    queryFn: () => api.statementImport.getJob(selectedJobId as string),
    enabled: !!selectedJobId,
    refetchInterval: (query) => (IN_PROGRESS.includes((query.state.data as any)?.status) ? 2000 : false),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.statementImport.uploadStatement(file),
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['statement-import-jobs'] })
      setSelectedJobId(created.id)
      setMsg('Statement uploaded — reconciliation is running in the background.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to upload this statement — check the file is a valid CSV under 5MB.'),
  })

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Bank Statement Import"
        subtitle="Upload a C2B paybill/bank statement to reconcile it against what the platform actually recorded"
        info="Checks your paybill statement against SaccoSphere's own M-Pesa confirmations and the suspense-clearing ledger total, a three-way match. Anything that doesn't line up shows up as a 'break' for you to investigate."
      />

      {msg && <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Upload Statement" className="md:col-span-1">
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-1.5 text-ink-muted">
              <span>CSV, under 5MB. Expected columns: transaction id, time, amount, bill reference, phone number.</span>
              <InfoTip text="This is matched against ProviderEvent records (every M-Pesa confirmation this platform received) and the MPESA_PAYBILL_CLEARING ledger account total for the same period — not re-parsed as new transactions." label="What gets checked" />
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadMutation.mutate(file)
              }}
              disabled={uploadMutation.isPending}
              className="w-full text-[11px]"
            />
            {uploadMutation.isPending && <div className="text-ink-muted">Uploading and parsing...</div>}
          </div>
        </Card>

        <Card title="Import Jobs" className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-ink-muted bg-surface-2">
                  <th className="py-2 px-3">File</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Rows</th>
                  <th className="py-2 px-3 text-right">Matched</th>
                  <th className="py-2 px-3 text-right">Breaks</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-4 text-center text-ink-muted">Loading import jobs...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan={6} className="py-4 text-center text-ink-muted">No statement imports yet.</td></tr>
                ) : (
                  jobs.map((j: any) => (
                    <tr key={j.id}>
                      <td className="py-2 px-3 font-semibold text-ink">{j.file_name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${STATUS_STYLES[j.status] ?? ''}`}>{j.status}</span>
                        {IN_PROGRESS.includes(j.status) && <span className="text-ink-faint ml-1">{j.progress_pct}%</span>}
                      </td>
                      <td className="py-2 px-3 text-right">{j.processed_rows}/{j.total_rows}</td>
                      <td className="py-2 px-3 text-right text-mint-700 font-bold">{j.matched_rows}</td>
                      <td className="py-2 px-3 text-right text-red-600 font-bold">{j.break_rows}</td>
                      <td className="py-2 px-3 text-right">
                        <button onClick={() => setSelectedJobId(j.id)} className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedJobId && job && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="font-bold text-ink text-xs">{job.file_name} — {job.status}</div>
              {job.breaks?.length > 0 && (
                <div>
                  <div className="font-bold text-ink text-xs mb-1.5">Reconciliation Breaks</div>
                  <pre className="bg-surface-2 rounded p-2 text-[10px] overflow-x-auto max-h-56">{JSON.stringify(job.breaks, null, 2)}</pre>
                </div>
              )}
              {job.errors?.length > 0 && (
                <div>
                  <div className="font-bold text-red-700 text-xs mb-1.5">Errors</div>
                  <pre className="bg-red-50 rounded p-2 text-[10px] overflow-x-auto max-h-56">{JSON.stringify(job.errors, null, 2)}</pre>
                </div>
              )}
              {(!job.breaks || job.breaks.length === 0) && job.status === 'COMPLETED' && (
                <div className="text-mint-700 text-xs font-semibold">Everything matched — no breaks found.</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

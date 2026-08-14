import { useState } from 'react'
import { useImportMembers, useImportJobStatus } from '../../hooks/useImport'

export function Import() {
  const [file, setFile] = useState<File | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const importMembers = useImportMembers()
  const { data: jobStatus } = useImportJobStatus(jobId || '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    try {
      const result = await importMembers.mutateAsync(file)
      setJobId(result.job_id)
      setFile(null)
    } catch (error) {
      console.error('Failed to import members:', error)
      alert('Failed to import members. Check console for details.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Member Import</div>
          <div className="text-xs text-ink-muted">Bulk import members from CSV file</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Upload form */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-4">Upload CSV</div>
          <form onSubmit={handleImport} className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <div className="text-[10px] text-ink-muted mt-1">
                CSV should contain: member_number, first_name, last_name, email, phone_number
              </div>
            </div>
            <button
              type="submit"
              disabled={importMembers.isPending || !file}
              className="w-full py-2 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {importMembers.isPending ? 'Importing...' : 'Start Import'}
            </button>
          </form>
        </div>

        {/* Job status */}
        <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-4">Import Status</div>
          {jobId && jobStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-surface-3 items-center">
                <span className="text-xs text-ink-muted">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  jobStatus.status === 'COMPLETED' ? 'bg-mint-50 text-mint-700 border border-mint-200' :
                  jobStatus.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {jobStatus.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-ink-muted mb-1">
                  <span>Progress</span>
                  <span className="font-medium text-ink">{jobStatus.progress_pct ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-surface2 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-violet-600 transition-all duration-300"
                    style={{ width: `${jobStatus.progress_pct ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Processed</span>
                <span className="text-xs font-semibold text-ink">{jobStatus.processed_rows} / {jobStatus.total_rows} rows</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Successful</span>
                <span className="text-xs font-semibold text-mint-600">{jobStatus.success_rows}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Failed</span>
                <span className="text-xs font-semibold text-red-700">{jobStatus.error_rows}</span>
              </div>

              {jobStatus.errors && jobStatus.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-red-700 mb-1">Row Error Logs ({jobStatus.errors.length}):</div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 max-h-40 overflow-y-auto space-y-1">
                    {jobStatus.errors.map((err: any, i: number) => (
                      <div key={i} className="text-[11px] text-red-800 border-b border-red-100 last:border-0 pb-1">
                        <span className="font-bold">Row {err.row || i + 1}:</span> {err.error || err.message || JSON.stringify(err)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-ink-muted italic py-8 text-center">
              No active import job. Upload a CSV file to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

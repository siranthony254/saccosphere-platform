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
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Status</span>
                <span className="text-xs font-semibold text-ink">{jobStatus.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Progress</span>
                <span className="text-xs font-semibold text-ink">{jobStatus.progress}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-3">
                <span className="text-xs text-ink-muted">Processed</span>
                <span className="text-xs font-semibold text-ink">{jobStatus.processed_records} / {jobStatus.total_records}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-ink-muted">Failed</span>
                <span className="text-xs font-semibold text-red-700">{jobStatus.failed_records}</span>
              </div>
              {jobStatus.error_summary && jobStatus.error_summary.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-ink-muted mb-1">Errors:</div>
                  <div className="text-xs text-red-700 max-h-20 overflow-y-auto">
                    {jobStatus.error_summary.map((err: string, i: number) => (
                      <div key={i} className="py-0.5">{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-ink-muted">
              {jobId ? 'Loading status...' : 'No import job in progress.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

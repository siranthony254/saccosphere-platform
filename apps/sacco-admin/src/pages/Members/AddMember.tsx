import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAddMember, useImportJobStatus } from '../../hooks/useImport'

export function AddMember() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    employment_status: '',
    monthly_income: '',
  })
  const [jobId, setJobId] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const addMember = useAddMember()
  const { data: job } = useImportJobStatus(jobId)

  useEffect(() => {
    if (!job) return
    if (job.status === 'completed') {
      if (job.error_rows > 0) {
        const first = job.errors_summary?.items?.[0]
        setErrorMsg(
          (first && (first.message || first.error || JSON.stringify(first))) ||
            'The member could not be added. Check the details and try again.'
        )
        setJobId('')
      } else {
        navigate('/members')
      }
    } else if (job.status === 'failed') {
      setErrorMsg('The import failed. Please try again.')
      setJobId('')
    }
  }, [job, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    addMember.mutate(
      {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || undefined,
        employment_status: formData.employment_status.trim() || undefined,
        monthly_income: formData.monthly_income ? Number(formData.monthly_income) : undefined,
      },
      {
        onSuccess: (res: any) => setJobId(res?.job_id ?? ''),
        onError: (err: any) => setErrorMsg(err?.message || 'Failed to add member. Please try again.'),
      }
    )
  }

  const busy = addMember.isPending || !!jobId

  const input = 'w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Add Member</div>
          <div className="text-xs text-ink-muted">
            Adds the member to your SACCO immediately and issues a member number.
          </div>
        </div>
        <button
          onClick={() => navigate('/members')}
          className="px-4 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 max-w-2xl bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">First Name</label>
              <input className={input} value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Last Name</label>
              <input className={input} value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Email</label>
            <input type="email" className={input} value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Phone Number</label>
            <input type="tel" className={input} value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })} placeholder="+2547…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Employment status (optional)</label>
              <input className={input} value={formData.employment_status}
                onChange={e => setFormData({ ...formData, employment_status: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Monthly income (optional)</label>
              <input type="number" className={input} value={formData.monthly_income}
                onChange={e => setFormData({ ...formData, monthly_income: e.target.value })} />
            </div>
          </div>
          <p className="text-[11px] text-ink-muted">
            The member verifies their own national ID during KYC. To add many members at once, use Import.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {busy ? 'Adding…' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="px-4 py-2 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

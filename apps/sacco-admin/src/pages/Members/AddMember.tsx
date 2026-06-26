import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function AddMember() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_id: '',
  })

  const createMember = useMutation({
    mutationFn: (data: typeof formData) => api.saccoAdmin.createMember(data),
    onSuccess: () => {
      navigate('/members')
    },
    onError: (error) => {
      console.error('Failed to create member:', error)
      alert('Failed to create member. Check console for details.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMember.mutate(formData)
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Add Member</div>
          <div className="text-xs text-ink-muted">Create a new SACCO member</div>
        </div>
        <button
          onClick={() => navigate('/members')}
          className="px-4 py-1.5 rounded-lg border border-ink-faint bg-white text-sm cursor-pointer hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-5 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">First Name</label>
              <input
                type="text"
                className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Last Name</label>
              <input
                type="text"
                className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Email</label>
            <input
              type="email"
              className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">Phone Number</label>
            <input
              type="tel"
              className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
              value={formData.phone_number}
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">National ID</label>
            <input
              type="text"
              className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
              value={formData.national_id}
              onChange={e => setFormData({ ...formData, national_id: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={createMember.isPending}
              className="flex-1 py-2 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {createMember.isPending ? 'Creating...' : 'Create Member'}
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

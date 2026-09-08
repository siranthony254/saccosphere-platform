import { useState } from 'react'
import { useUserRoles } from '../../hooks/useRoles'

export function Roles() {
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const { data: roles, isLoading, isError } = useUserRoles(userId)

  return (
    <div className="p-5">
      <div className="mb-5">
        <div className="text-lg font-semibold text-ink">Roles</div>
        <div className="text-xs text-ink-muted">Look up the platform roles held by a user.</div>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-800">
        Assigning or revoking roles is handled by SaccoSphere platform administration.
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setUserId(input.trim())
          }}
          className="flex gap-2 mb-4"
        >
          <input
            className="flex-1 py-2 px-3 border border-ink-faint rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Enter user UUID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold"
          >
            View roles
          </button>
        </form>

        {!userId ? (
          <div className="text-sm text-ink-muted">Enter a user ID to view their roles.</div>
        ) : isLoading ? (
          <div className="text-sm text-ink-muted">Loading…</div>
        ) : isError ? (
          <div className="text-sm text-red-600">Could not load roles for this user.</div>
        ) : (roles ?? []).length === 0 ? (
          <div className="text-sm text-ink-muted">No roles found for this user.</div>
        ) : (
          <div className="space-y-2">
            {(roles ?? []).map((role: any) => (
              <div key={role.id} className="flex items-center justify-between p-2.5 bg-surface-2 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-ink">{role.role_label}</div>
                  <div className="text-xs text-ink-muted">
                    {role.user_email || '—'}
                    {role.sacco_name ? ` · ${role.sacco_name}` : ''}
                  </div>
                </div>
                <div className="text-[11px] text-ink-faint">
                  {role.created_at ? new Date(role.created_at).toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useUserRoles, useAssignRole, useRevokeRole } from '../../hooks/useRoles'

export function Roles() {
  const [userId, setUserId] = useState('')
  const [roleName, setRoleName] = useState('MEMBER')
  const [saccoId, setSaccoId] = useState('')

  const { data: roles, refetch } = useUserRoles(userId)
  const assignRole = useAssignRole()
  const revokeRole = useRevokeRole()

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await assignRole.mutateAsync({ user_id: userId, role_name: roleName, sacco_id: saccoId || null })
      refetch()
      setUserId('')
      setSaccoId('')
    } catch (error) {
      console.error('Failed to assign role:', error)
      alert('Failed to assign role. Check console for details.')
    }
  }

  const handleRevoke = async (roleId: string) => {
    try {
      await revokeRole.mutateAsync(roleId)
      refetch()
    } catch (error) {
      console.error('Failed to revoke role:', error)
      alert('Failed to revoke role. Check console for details.')
    }
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-lg font-semibold text-ink">Role Management</div>
          <div className="text-xs text-ink-muted">Assign and revoke user roles (SUPER_ADMIN only)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Assign role form */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-4">Assign Role</div>
          <form onSubmit={handleAssign} className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">User ID (UUID)</label>
              <input
                className="w-full py-2 px-3 border border-mid rounded-lg text-sm outline-none"
                placeholder="Enter user UUID"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Role</label>
              <select
                className="w-full py-2 px-3 border border-mid rounded-lg text-sm outline-none bg-surface"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
              >
                <option value="MEMBER">Member</option>
                <option value="SACCO_ADMIN">SACCO Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">SACCO ID (optional - for SACCO-scoped roles)</label>
              <input
                className="w-full py-2 px-3 border border-mid rounded-lg text-sm outline-none"
                placeholder="Enter SACCO UUID"
                value={saccoId}
                onChange={e => setSaccoId(e.target.value)}
              />
              <div className="text-[10px] text-ink-muted mt-1">Leave empty for platform-wide roles (SUPER_ADMIN)</div>
            </div>
            <button
              type="submit"
              disabled={assignRole.isPending}
              className="w-full py-2 px-4 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
            </button>
          </form>
        </div>

        {/* User roles list */}
        <div className="bg-surface border border-mid rounded-[10px] p-4">
          <div className="font-semibold text-sm text-ink mb-4">User Roles</div>
          <div className="mb-3">
            <input
              className="w-full py-2 px-3 border border-mid rounded-lg text-sm outline-none"
              placeholder="Enter user UUID to view roles"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>
          {userId && roles ? (
            <div className="space-y-2">
              {roles.length === 0 ? (
                <div className="text-sm text-ink-muted">No roles found for this user.</div>
              ) : (
                roles.map((role: any) => (
                  <div key={role.id} className="flex items-center justify-between p-2 bg-surface-2 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{role.name.replace('_', ' ')}</div>
                      <div className="text-xs text-ink-muted">
                        {role.sacco ? `SACCO: ${role.sacco?.name || role.sacco}` : 'Platform-wide'}
                      </div>
                      <div className="text-[10px] text-ink-muted">User: {role.user?.email || role.user?.first_name || '—'}</div>
                    </div>
                    <button
                      onClick={() => handleRevoke(role.id)}
                      disabled={revokeRole.isPending}
                      className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Enter a user ID to view their roles.</div>
          )}
        </div>
      </div>
    </div>
  )
}

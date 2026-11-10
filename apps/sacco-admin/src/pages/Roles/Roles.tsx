import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useUserRoles } from '../../hooks/useRoles'
import { InfoTip } from '@saccosphere/ui'
import { Badge } from '../../components/ui/Badge'

const SENSITIVITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  MONEY_MOVING: 'error',
  PRIVILEGE_MANAGEMENT: 'warning',
  OPERATIONAL: 'neutral',
}

const SENSITIVITY_LABELS: Record<string, string> = {
  MONEY_MOVING: 'Money-moving',
  PRIVILEGE_MANAGEMENT: 'Privilege management',
  OPERATIONAL: 'Operational',
}

function humanizeCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase())
}

export function Roles() {
  const [activeTab, setActiveTab] = useState<'lookup' | 'roles' | 'assignments'>('roles')

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="text-lg font-semibold text-ink flex items-center gap-1.5">
          Roles &amp; Permissions
          <InfoTip text="Define custom admin roles for this SACCO — a named bundle of permissions — then assign staff to them. You can only grant permissions you hold yourself, and a sensitive change may need a second admin's approval." label="About Roles & Permissions" />
        </div>
        <div className="text-xs text-ink-muted">Manage which staff members have admin access to this SACCO, and what each one is allowed to do.</div>
      </div>

      <div className="flex gap-2 border-b border-[#e5ede9]">
        {(['roles', 'assignments', 'lookup'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold cursor-pointer ${
              activeTab === tab ? 'border-b-2 border-violet-600 text-violet-700' : 'text-ink-muted'
            }`}
          >
            {tab === 'roles' ? 'Custom Roles' : tab === 'assignments' ? 'Staff Assignments' : 'Legacy Role Lookup'}
          </button>
        ))}
      </div>

      {activeTab === 'roles' && <CustomRolesTab />}
      {activeTab === 'assignments' && <AssignmentsTab />}
      {activeTab === 'lookup' && <LegacyLookupTab />}
    </div>
  )
}

function CustomRolesTab() {
  const queryClient = useQueryClient()
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissionCodes, setPermissionCodes] = useState<string[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  const { data: catalog, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['admin-permission-catalog'],
    queryFn: () => api.adminRoles.getPermissionCatalog(),
  })

  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.adminRoles.getRoles(),
  })

  const resetForm = () => {
    setEditingRoleId(null)
    setName('')
    setDescription('')
    setPermissionCodes([])
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      editingRoleId
        ? api.adminRoles.updateRole(editingRoleId, { name, description, permission_codes: permissionCodes })
        : api.adminRoles.createRole({ name, description, permission_codes: permissionCodes }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      resetForm()
      setMsg(result?.id ? 'Role saved.' : 'Submitted for a second admin to approve.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to save this role.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.adminRoles.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setMsg('Role deleted.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to delete this role — it may still have active staff assigned.'),
  })

  const startEdit = (role: any) => {
    setEditingRoleId(role.id)
    setName(role.name)
    setDescription(role.description ?? '')
    setPermissionCodes(role.permissions ?? [])
  }

  const togglePermission = (code: string) => {
    setPermissionCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {msg && (
        <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">{msg}</div>
      )}

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1 text-xs">
        <div className="font-bold text-base text-ink">{editingRoleId ? 'Edit Role' : 'New Role'}</div>
        <div>
          <label className="text-ink-muted mb-1 block">Role Name</label>
          <input type="text" placeholder="e.g. Collections Officer" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
        </div>
        <div>
          <label className="text-ink-muted mb-1 block">Description (Optional)</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => name && saveMutation.mutate()}
            disabled={!name || saveMutation.isPending}
            className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
          >
            {editingRoleId ? 'Save Changes' : 'Create Role'}
          </button>
          {editingRoleId && (
            <button onClick={resetForm} className="px-3 py-2 border border-ink-faint rounded text-ink-muted">Cancel</button>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="font-bold text-ink mb-2">Permissions ({permissionCodes.length} selected)</div>
          {isCatalogLoading ? (
            <div className="text-ink-muted">Loading catalog...</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(catalog?.categories ?? []).map((group) => (
                <div key={group.category}>
                  <div className="font-semibold text-ink-soft uppercase text-[10px] mb-1">{humanizeCategory(group.category)}</div>
                  <div className="space-y-1">
                    {group.permissions.map((perm) => (
                      <label key={perm.code} className="flex items-start gap-1.5 p-1.5 rounded hover:bg-surface-2 cursor-pointer">
                        <input type="checkbox" checked={permissionCodes.includes(perm.code)} onChange={() => togglePermission(perm.code)} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-ink">{perm.label}</span>
                            <Badge variant={SENSITIVITY_VARIANT[perm.sensitivity] ?? 'neutral'}>{SENSITIVITY_LABELS[perm.sensitivity] ?? perm.sensitivity}</Badge>
                          </div>
                          {!!perm.description && <div className="text-ink-faint text-[10px]">{perm.description}</div>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2 text-xs">
        <div className="font-bold text-base text-ink mb-3">This SACCO's Roles</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-ink-muted bg-surface-2">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Permissions</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isRolesLoading ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading roles...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No custom roles yet.</td></tr>
              ) : (
                roles.map((role: any) => (
                  <tr key={role.id}>
                    <td className="py-2.5 px-3 font-semibold text-ink">{role.name}</td>
                    <td className="py-2.5 px-3 text-ink-muted">{(role.permissions ?? []).length} permission{(role.permissions ?? []).length === 1 ? '' : 's'}</td>
                    <td className="py-2.5 px-3">
                      {role.is_system ? (
                        <Badge variant="neutral">System</Badge>
                      ) : (
                        <Badge variant="violet">Custom</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {!role.is_system && (
                        <>
                          <button onClick={() => startEdit(role)} className="px-2 py-1 bg-violet-600 text-white rounded text-[10px] font-bold">Edit</button>
                          <button
                            onClick={() => confirm(`Delete role "${role.name}"?`) && deleteMutation.mutate(role.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                          >
                            Delete
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
  )
}

function AssignmentsTab() {
  const queryClient = useQueryClient()
  const [targetUserId, setTargetUserId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.adminRoles.getRoles(),
  })

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-role-assignments'],
    queryFn: () => api.adminRoles.getAssignments(),
  })

  const assignMutation = useMutation({
    mutationFn: () => api.adminRoles.createAssignment({ target_user_id: targetUserId, role_id: roleId }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-assignments'] })
      setTargetUserId('')
      setRoleId('')
      setMsg(result?.id ? 'Role assigned.' : 'Submitted for a second admin to approve.')
      setTimeout(() => setMsg(null), 5000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to assign this role.'),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.adminRoles.revokeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-assignments'] })
      setMsg('Assignment revoked.')
      setTimeout(() => setMsg(null), 4000)
    },
    onError: (err: any) => setMsg(err?.message || 'Failed to revoke this assignment — this may be the only person who can manage admin roles.'),
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
      <div className="md:col-span-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg font-semibold">
        Known backend limitation: a staff member assigned ONLY a role here (and who does not also hold the
        legacy SACCO_ADMIN role) cannot currently log into this portal — the login endpoint doesn't yet check
        this permission system when deciding who counts as an admin. Until that's fixed backend-side, only
        assign roles to staff who already have SACCO_ADMIN access some other way.
      </div>

      {msg && (
        <div className="md:col-span-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold">{msg}</div>
      )}

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 space-y-3 shadow-sm md:col-span-1">
        <div className="font-bold text-base text-ink flex items-center gap-1.5">
          Assign a Role
          <InfoTip text="There's currently no staff directory to pick from here — this needs the staff member's own user ID, which you'd get from wherever they were added as an admin." label="Why a raw ID" />
        </div>
        <div>
          <label className="text-ink-muted mb-1 block">Staff Member's User ID</label>
          <input type="text" placeholder="UUID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} className="w-full p-2 border border-ink-faint rounded font-mono bg-white" />
        </div>
        <div>
          <label className="text-ink-muted mb-1 block">Role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full p-2 border border-ink-faint rounded bg-white">
            <option value="">Select a role...</option>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => targetUserId && roleId && assignMutation.mutate()}
          disabled={!targetUserId || !roleId || assignMutation.isPending}
          className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded cursor-pointer disabled:opacity-50"
        >
          Assign Role
        </button>
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4 shadow-sm md:col-span-2">
        <div className="font-bold text-base text-ink mb-3">Active Assignments</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-ink-muted bg-surface-2">
                <th className="py-2 px-3">User ID</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Assigned At</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">Loading assignments...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No active assignments.</td></tr>
              ) : (
                assignments.map((a: any) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-3 font-mono text-ink-soft">{a.user}</td>
                    <td className="py-2.5 px-3 font-semibold text-ink">{a.role_name}</td>
                    <td className="py-2.5 px-3 text-ink-muted">{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => confirm('Revoke this assignment?') && revokeMutation.mutate(a.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LegacyLookupTab() {
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState('')
  const { data: roles, isLoading, isError } = useUserRoles(userId)

  return (
    <div className="max-w-xl">
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-800">
        This looks up the legacy platform-level role (Member / SACCO Admin / Super Admin) — separate from the custom roles above. Assigning or revoking a legacy role is handled by SaccoSphere platform administration.
      </div>

      <div className="bg-white border border-[#e5ede9] rounded-[10px] p-4">
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
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold">
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

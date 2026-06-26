import { useAuthStore } from '../../store/useAuthStore'

export function PlatformSettings() {
  const { user } = useAuthStore()

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-lg font-semibold text-ink">Platform configuration</div>
          <div className="text-xs text-ink-muted">Saccosphere global configuration — super admin only</div>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Platform settings are not available from the backend yet. There is no{' '}
        <code className="font-mono text-xs">/api/v1/super-admin/settings/</code> (or equivalent) endpoint in the current API contract.
        Contact the backend team to expose platform configuration before this screen can be made editable.
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="bg-surface border border-mid rounded-[10px] p-5 mb-4">
            <div className="font-semibold text-sm text-ink mb-4">Signed-in account</div>
            {user ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">Name</div>
                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">Email</div>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">Phone</div>
                  <div className="font-medium">{user.phone_number || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">Role</div>
                  <div className="font-medium capitalize">Super Admin</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-muted">KYC Status</div>
                  <div className="font-medium capitalize">{user.kyc_status || 'Not verified'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-ink-muted">Loading user profile...</div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-surface border border-mid rounded-[10px] p-5">
            <div className="font-semibold text-sm text-ink mb-3.5">Backend endpoints needed</div>
            <ul className="space-y-2 text-sm text-ink-muted list-disc pl-5">
              <li>Platform identity and support settings</li>
              <li>Global fee configuration</li>
              <li>Super admin team management</li>
              <li>KYC and AML policy toggles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

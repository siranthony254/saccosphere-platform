import { ThemePicker } from '@saccosphere/ui'
import { useAuthStore } from '../../store/useAuthStore'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'

export function PlatformSettings() {
  const { user } = useAuthStore()

  return (
    <div className="p-5">
      <PageHeader title="Platform configuration" subtitle="Saccosphere global configuration — super admin only" />

      <div className="grid grid-cols-2 gap-5">
        <Card title="Signed-in account">
          {user ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-muted">Name</div>
                <div className="font-medium">
                  {user.first_name} {user.last_name}
                </div>
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
                <div className="font-medium capitalize">{user.role}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-muted">KYC Status</div>
                <div className="font-medium capitalize">{user.kyc_status || 'Not verified'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Loading user profile...</div>
          )}
        </Card>

        <Card title="Editable settings">
          <div className="text-sm text-ink-muted leading-relaxed">
            Platform-wide configuration — platform identity, global fee schedule, the super-admin
            team, KYC / AML policy — has no API and is managed directly in platform administration
            (Django admin), not this console. SACCO-level policy lives in each SACCO's own admin
            settings.
          </div>
          <div className="mt-4 text-xs text-ink-faint">
            This screen deliberately holds no editable fields and no hard-coded config values.
          </div>
        </Card>
      </div>

      <Card title="Background theme" className="mt-5">
        <p className="text-xs text-ink-muted mb-4">
          Applies instantly across the whole console — every screen shares this one setting.
        </p>
        <ThemePicker />
      </Card>
    </div>
  )
}

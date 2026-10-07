import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { ThemePicker } from '@saccosphere/ui'
import { useAuthStore } from '../../store/useAuthStore'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { StepUpModal } from '../../components/auth/StepUpModal'

function HolidayModeCard() {
  const queryClient = useQueryClient()
  const [showStepUp, setShowStepUp] = useState(false)
  const [pendingTargetState, setPendingTargetState] = useState<boolean | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const { data: holidayData, isLoading } = useQuery({
    queryKey: ['superadmin-holiday-mode'],
    queryFn: () => api.superAdmin.getHolidayMode(),
  })

  const isHolidayMode = Boolean(holidayData?.holiday_mode_enabled)

  const updateMutation = useMutation({
    mutationFn: (enabled: boolean) => api.superAdmin.updateHolidayMode(enabled),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-holiday-mode'] })
      setStatusMessage(
        res.holiday_mode_enabled
          ? 'Platform Holiday / Heightened Risk Mode is now ACTIVE. B2C limits lowered and approvals enforced.'
          : 'Platform Holiday Mode is now DEACTIVATED. Standard operational limits restored.'
      )
      setTimeout(() => setStatusMessage(null), 5000)
    },
    onError: (err: any) => {
      setStatusMessage(err?.message || 'Failed to update Holiday Mode.')
    },
  })

  const handleToggleClick = (targetState: boolean) => {
    setPendingTargetState(targetState)
    setShowStepUp(true)
  }

  const handleStepUpSuccess = () => {
    if (pendingTargetState !== null) {
      updateMutation.mutate(pendingTargetState)
      setPendingTargetState(null)
    }
  }

  return (
    <Card title="Platform Holiday & Risk Control Mode" className="mt-5">
      <div className="space-y-3">
        <p className="text-xs text-ink-muted leading-relaxed">
          Platform-wide risk governance switch. Enabling Holiday Mode applies heightened risk controls across all active SACCOs:
          lowers M-Pesa B2C instant disbursement thresholds, forces step-up/maker-checker on automated disbursements, and flags abnormal transaction velocity.
        </p>

        {statusMessage && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-lg font-semibold">
            {statusMessage}
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-ink-faint">
          <div>
            <div className="text-sm font-bold text-ink">
              Platform Holiday / Heightened Risk Mode
            </div>
            <div className="text-xs text-ink-muted">
              Current Status:{' '}
              <span className={isHolidayMode ? 'font-bold text-amber-700' : 'font-bold text-mint-700'}>
                {isLoading ? 'Checking...' : isHolidayMode ? 'ENABLED (Heightened Risk Controls)' : 'DISABLED (Standard Operation)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleToggleClick(!isHolidayMode)}
            disabled={isLoading || updateMutation.isPending}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white ${
              isHolidayMode
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {updateMutation.isPending
              ? 'Updating...'
              : isHolidayMode
              ? 'Disable Holiday Mode'
              : 'Enable Holiday Mode'}
          </button>
        </div>
      </div>

      <StepUpModal
        isOpen={showStepUp}
        title="Authorize Holiday Mode Change"
        description={`Changing Platform Holiday Mode to ${pendingTargetState ? 'ENABLED' : 'DISABLED'} requires step-up security verification.`}
        onClose={() => setShowStepUp(false)}
        onSuccess={handleStepUpSuccess}
      />
    </Card>
  )
}

function StaffMfaSetupCard() {
  const [mfaData, setMfaData] = useState<{ secret: string; qr_code: string; recovery_codes: string[] } | null>(null)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleEnroll = async () => {
    setIsLoading(true)
    setStatus(null)
    try {
      const res = await api.auth.mfaEnroll()
      setMfaData(res)
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Failed to initiate MFA enrollment.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setIsLoading(true)
    setStatus(null)
    try {
      await api.auth.mfaConfirm(code.trim())
      setStatus({ type: 'success', message: 'MFA confirmed and enabled for your super admin account!' })
      setMfaData(null)
      setCode('')
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Failed to confirm MFA code.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    setIsLoading(true)
    setStatus(null)
    try {
      await api.auth.mfaReset()
      setStatus({ type: 'success', message: 'MFA reset successfully.' })
      setMfaData(null)
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Failed to reset MFA.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card title="Super Admin 2FA / MFA Security" className="mt-5">
      <p className="text-xs text-ink-muted mb-4">
        Multi-Factor Authentication (TOTP / Authenticator App) for super-admin step-up verification on platform-wide control actions (holiday mode, billing exemptions, role grants).
      </p>

      {status && (
        <div className={`p-3 rounded-lg text-xs font-semibold mb-3 ${status.type === 'success' ? 'bg-mint-50 text-mint-800 border border-mint-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {status.message}
        </div>
      )}

      {!mfaData ? (
        <div className="flex gap-3">
          <button
            onClick={handleEnroll}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            {isLoading ? 'Loading...' : 'Enroll Authenticator / TOTP'}
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-ink-muted font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Reset MFA
          </button>
        </div>
      ) : (
        <div className="space-y-4 bg-surface-2 p-4 rounded-xl border border-ink-faint">
          <div className="text-xs font-bold text-ink">Scan QR Code or copy secret key into your Authenticator app:</div>

          {mfaData.qr_code ? (
            <img src={mfaData.qr_code} alt="MFA QR Code" className="w-36 h-36 bg-white p-2 rounded border" />
          ) : (
            <div className="p-2 bg-white rounded font-mono text-xs text-indigo-700 font-bold border">
              Secret: {mfaData.secret}
            </div>
          )}

          {mfaData.recovery_codes && mfaData.recovery_codes.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-ink mb-1">Save your recovery codes:</div>
              <div className="flex flex-wrap gap-1 font-mono text-[10px] bg-white p-2 rounded border">
                {mfaData.recovery_codes.join(', ')}
              </div>
            </div>
          )}

          <form onSubmit={handleConfirm} className="flex gap-2 items-center pt-2">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-2 border border-ink-faint rounded-lg text-xs font-mono bg-white"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Confirm & Activate MFA'}
            </button>
          </form>
        </div>
      )}
    </Card>
  )
}

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
            </div>
          ) : (
            <div className="text-sm text-ink-muted">Loading user profile...</div>
          )}
        </Card>

        <Card title="Platform Controls">
          <div className="text-sm text-ink-muted leading-relaxed">
            Platform-wide risk policies, holiday mode controls, and MFA step-up security are configured below. Saccosphere infrastructure settings are managed securely through environment variables and backend governance policies.
          </div>
        </Card>
      </div>

      <HolidayModeCard />

      <StaffMfaSetupCard />

      <Card title="Background theme" className="mt-5">
        <p className="text-xs text-ink-muted mb-4">
          Applies instantly across the whole console — every screen shares this one setting.
        </p>
        <ThemePicker />
      </Card>
    </div>
  )
}

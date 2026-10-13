import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLogin, useMfaEnroll, useMfaConfirm, useMfaLoginVerify, useCompleteStaffLogin } from '../../hooks/useAuth'
import type { StaffLoginResult } from '@saccosphere/api-client'

type View =
  | { step: 'credentials' }
  | { step: 'mfa_verify'; challengeToken: string }
  | { step: 'mfa_enroll'; enrollmentToken: string; secret: string }
  | { step: 'mfa_recovery_codes'; codes: string[] }

const formatSecret = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim()

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/overview'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [view, setView] = useState<View>({ step: 'credentials' })
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingLogin, setPendingLogin] = useState<(StaffLoginResult & { kind: 'tokens' }) | null>(null)

  const loginMutation = useLogin()
  const enrollMutation = useMfaEnroll()
  const confirmMutation = useMfaConfirm()
  const verifyMutation = useMfaLoginVerify()
  const completeLogin = useCompleteStaffLogin()

  // Only a real superadmin role may use this portal — an otherwise valid
  // staff login (e.g. a plain SACCO_ADMIN) is rejected here, after tokens
  // already exist but before they're applied to this app's auth state.
  const finishIfAuthorized = async (result: StaffLoginResult & { kind: 'tokens' }) => {
    if (result.user.role !== 'superadmin') {
      setFormError(`This account is not authorized for the Super Admin portal (role: ${result.user.role}).`)
      return
    }
    await completeLogin(result)
    navigate(from, { replace: true })
  }

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    try {
      const result = await loginMutation.mutateAsync({ email, password })
      if (result.kind === 'tokens') {
        await finishIfAuthorized(result)
        return
      }
      if (result.kind === 'mfa_required') {
        setView({ step: 'mfa_verify', challengeToken: result.challenge_token })
        return
      }
      const enrolled = await enrollMutation.mutateAsync(result.enrollment_token)
      setView({ step: 'mfa_enroll', enrollmentToken: result.enrollment_token, secret: enrolled.secret })
    } catch (error: any) {
      setFormError(error?.message || 'Unable to sign in. Check your credentials.')
    }
  }

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (view.step !== 'mfa_verify') return
    setFormError(null)
    try {
      const result = await verifyMutation.mutateAsync({ challengeToken: view.challengeToken, code })
      if (result.kind === 'tokens') await finishIfAuthorized(result)
    } catch (error: any) {
      setFormError(error?.message || 'Incorrect code. Try again.')
    }
  }

  const handleEnrollConfirmSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (view.step !== 'mfa_enroll') return
    setFormError(null)
    try {
      const result = await confirmMutation.mutateAsync({ enrollmentToken: view.enrollmentToken, code })
      setPendingLogin(result)
      setView({ step: 'mfa_recovery_codes', codes: result.recovery_codes })
    } catch (error: any) {
      setFormError(error?.message || 'Incorrect code. Try again.')
    }
  }

  const handleRecoveryCodesAcknowledged = async () => {
    if (pendingLogin) await finishIfAuthorized(pendingLogin)
  }

  const isBusy = loginMutation.isPending || enrollMutation.isPending || confirmMutation.isPending || verifyMutation.isPending

  return (
    <div className="min-h-screen bg-[#080b16] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold">Welcome to Saccosphere</div>
          <p className="mt-2 text-sm text-slate-400">
            {view.step === 'credentials' && 'Sign in to the platform admin portal.'}
            {view.step === 'mfa_verify' && 'Enter your authenticator code to finish signing in.'}
            {view.step === 'mfa_enroll' && 'Set up two-factor authentication before you can continue.'}
            {view.step === 'mfa_recovery_codes' && 'Save your recovery codes — this is the only time they are shown.'}
          </p>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</div>
        )}

        {view.step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Email</label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              type="email"
              aria-label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Password</label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              type="password"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {view.step === 'mfa_verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">
              Authenticator code (or a recovery code)
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyMutation.isPending ? 'Verifying…' : 'Verify and sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setView({ step: 'credentials' }); setCode(''); setFormError(null) }}
              className="w-full text-xs text-slate-400 hover:text-slate-200"
            >
              Back to sign in
            </button>
          </form>
        )}

        {view.step === 'mfa_enroll' && (
          <form onSubmit={handleEnrollConfirmSubmit} className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <p className="text-xs text-slate-400">
                Scan this into an authenticator app (Google Authenticator, Authy, 1Password, etc.) — or add it
                manually using the key below.
              </p>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Manual entry key</div>
              <div className="font-mono text-sm text-indigo-400 tracking-wider break-all">
                {formatSecret(view.secret)}
              </div>
            </div>
            <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">
              Enter the 6-digit code from your app
            </label>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmMutation.isPending ? 'Confirming…' : 'Confirm and enable'}
            </button>
          </form>
        )}

        {view.step === 'mfa_recovery_codes' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              Store these somewhere safe. If you lose your authenticator device, these are the only way back in —
              they will never be shown again.
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm text-indigo-400">
              {view.codes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRecoveryCodesAcknowledged}
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              I've saved these — continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

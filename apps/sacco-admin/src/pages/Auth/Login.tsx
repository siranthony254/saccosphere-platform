import { useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useLogin } from '../../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const loginMutation = useLogin()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await loginMutation.mutateAsync({ email, password })
      navigate(from, { replace: true })
    } catch {
    }
  }

  return (
    <div className="min-h-screen bg-[#071014] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold">Welcome to Saccosphere</div>
          <p className="mt-2 text-sm text-slate-400">Sign in to your SACCO admin portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Email</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Password</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {loginMutation.isError && (
            <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {loginMutation.error && typeof loginMutation.error === 'object' && 'message' in loginMutation.error
                ? String((loginMutation.error as { message: string }).message)
                : loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : 'Unable to sign in. Check your credentials.'}
            </div>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-mint-600 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

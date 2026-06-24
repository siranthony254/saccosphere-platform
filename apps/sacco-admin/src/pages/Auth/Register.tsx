import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRegister } from '../../hooks/useAuth'

export function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('254')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const registerMutation = useRegister()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== passwordConfirm) return alert('Passwords do not match')

    await registerMutation.mutateAsync({
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
      password,
      password2: passwordConfirm,
    })

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#071014] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <div className="text-3xl font-semibold">Create your account</div>
          <p className="mt-2 text-sm text-slate-400">Join your SACCO management portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">First name</label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Last name</label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Email</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Phone number</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="254712345678"
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

          <label className="block text-xs uppercase tracking-[0.24em] text-slate-400">Confirm password</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            required
          />

          {registerMutation.isError && (
            <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {registerMutation.error instanceof Error ? registerMutation.error.message : 'Unable to register.'}
            </div>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full rounded-xl bg-mint-600 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerMutation.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register

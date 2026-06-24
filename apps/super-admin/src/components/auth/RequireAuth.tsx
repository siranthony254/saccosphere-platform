import type { ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import type { User } from '@saccosphere/schemas'

interface RequireAuthProps {
  children: ReactNode
  allowedRoles?: User['role'][]
}

export function RequireAuth({ children, allowedRoles = ['superadmin'] }: RequireAuthProps) {
  const { user, authReady } = useAuthStore()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-2 text-ink-muted">
        <div className="rounded-xl border border-surface-4 bg-white px-6 py-5 shadow-sm">
          <div className="text-sm font-medium">Loading platform session…</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-2 text-ink-muted px-4">
        <div className="max-w-md rounded-[20px] border border-amber-200 bg-amber-50 p-8 text-left shadow-sm">
          <div className="text-lg font-semibold text-amber-900">Access denied</div>
          <p className="mt-3 text-sm text-amber-900/80">Your account does not have super admin access. Please sign in with a platform admin account or use the correct portal.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

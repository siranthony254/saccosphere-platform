import type { ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

const isSaccoAdmin = (user: ReturnType<typeof useAuthStore.getState>['user']) =>
  user?.role === 'sacco_admin' && user.sacco_id !== null

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuthStore()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-2 text-ink-muted">
        <div className="rounded-xl border border-surface-4 bg-white px-6 py-5 shadow-sm">
          <div className="text-sm font-medium">Loading admin session…</div>
        </div>
      </div>
    )
  }

  if (!user || !isSaccoAdmin(user)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

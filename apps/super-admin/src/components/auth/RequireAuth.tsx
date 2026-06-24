import type { ReactNode } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export function RequireAuth({ children }: { children: ReactNode }) {
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

  // Backend handles permission checks via API responses
  // If user is authenticated, let them access - backend will deny unauthorized requests
  return <>{children}</>
}

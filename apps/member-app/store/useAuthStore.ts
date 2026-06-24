/**
 * useAuthStore
 * Holds the JWT access token in memory and the current user profile.
 * Access token is NEVER persisted to storage — memory only.
 * This is the security boundary against XSS token theft.
 */

import { create } from 'zustand'
import type { User } from '@saccosphere/schemas'

interface AuthState {
  /** JWT access token — in memory only, never persisted */
  accessToken: string | null
  /** Current authenticated user */
  user: User | null
  /** Whether the initial auth check (silent refresh) has completed */
  authReady: boolean

  setAuth: (payload: { token: string; user: User }) => void
  clearAuth: () => void
  setAuthReady: (ready: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  authReady: false,

  setAuth: ({ token, user }) => set({ accessToken: token, user, authReady: true }),
  clearAuth: () => set({ accessToken: null, user: null, authReady: true }),
  setAuthReady: (ready) => set({ authReady: ready }),
}))

/** Convenience selectors */
export const useCurrentUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.accessToken !== null)
export const useUserRole = () => useAuthStore((s) => s.user?.role ?? null)
export const useKYCStatus = () => useAuthStore((s) => s.user?.kyc_status ?? null)

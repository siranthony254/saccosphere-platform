import { create } from 'zustand'
import type { User } from '@saccosphere/schemas'

interface AuthState {
  accessToken: string | null
  user: User | null
  authReady: boolean
  setAuth: (p: { token: string; user: User }) => void
  clearAuth: () => void
  setAuthReady: (r: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, user: null, authReady: false,
  setAuth: ({ token, user }) => set({ accessToken: token, user, authReady: true }),
  clearAuth: () => set({ accessToken: null, user: null, authReady: true }),
  setAuthReady: (authReady) => set({ authReady }),
}))

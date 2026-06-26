import { create } from 'zustand'
import type { User } from '@saccosphere/schemas'
import { setSaccoId, clearTokens } from '@saccosphere/api-client'

interface AuthState {
  accessToken: string | null
  user: User | null
  saccoId: string | null
  authReady: boolean
  setAuth: (p: { token: string; user: User }) => void
  clearAuth: () => void
  setAuthReady: (r: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, user: null, saccoId: null, authReady: false,
  setAuth: ({ token, user }) => {
    const saccoId = user.sacco_id ?? null
    setSaccoId(saccoId)
    set({ accessToken: token, user, saccoId, authReady: true })
  },
  clearAuth: () => {
    clearTokens()
    set({ accessToken: null, user: null, saccoId: null, authReady: true })
  },
  setAuthReady: (authReady) => set({ authReady }),
}))

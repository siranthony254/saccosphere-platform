import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, setAccessToken, setRefreshToken } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { LoginInput, RegisterInput } from '@saccosphere/schemas'

const REFRESH_TOKEN_STORAGE_KEY = 'sacco-admin-refresh-token'

export async function saveRefreshToken(token?: string | null) {
  setRefreshToken(token ?? null)
  if (!token) return clearStoredRefreshToken()
  window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token)
}

export async function loadRefreshToken() {
  const token = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  setRefreshToken(token)
  return token
}

export async function clearStoredRefreshToken() {
  setRefreshToken(null)
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
}

// ─── Auth Bootstrap ────────────────────────────────────────────────────────────

export function useAuthBootstrap() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const setAuthReady = useAuthStore((state) => state.setAuthReady)

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const refreshToken = await loadRefreshToken()
      if (!refreshToken) {
        setAuthReady(true)
        return
      }

      try {
        // Refresh the access token
        const { access } = await api.auth.refresh(refreshToken)
        setAccessToken(access)

        // Fetch user profile
        const user = await api.member.getProfile()

        if (!isMounted) return
        setAuth({ token: access, user })
      } catch (error) {
        // Clear tokens on any error (401, network, etc.)
        clearTokens()
        await clearStoredRefreshToken()
        clearAuth()
      } finally {
        if (isMounted) setAuthReady(true)
      }
    }

    const handleLogout = () => {
      clearTokens()
      clearStoredRefreshToken()
      clearAuth()
    }

    window.addEventListener('saccosphere:logout', handleLogout)
    bootstrap()

    return () => {
      isMounted = false
      window.removeEventListener('saccosphere:logout', handleLogout)
    }
  }, [setAuth, clearAuth, setAuthReady])
}

// ─── Login Mutation ────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const tokens = await api.auth.login(data)
      setAccessToken(tokens.access)
      await saveRefreshToken(tokens.refresh)
      setAuth({ token: tokens.access, user: tokens.user })
      return tokens
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()

  return async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      // Ignore 401 errors - token may already be expired
      // Still proceed to clear local state
      console.log('Logout API call failed, clearing local state anyway')
    }
    clearTokens()
    await clearStoredRefreshToken()
    clearAuth()
    queryClient.clear()
  }
}

// ─── Register (optional — sacco-admins are typically set up by super admin) ───

export function useRegister() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const tokens = await api.auth.register(data)
      setAccessToken(tokens.access)
      await saveRefreshToken(tokens.refresh)
      setAuth({ token: tokens.access, user: tokens.user })
      return tokens
    },
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

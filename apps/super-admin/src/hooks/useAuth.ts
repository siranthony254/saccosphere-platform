import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, setAccessToken, setRefreshToken } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { LoginInput } from '@saccosphere/schemas'

const REFRESH_TOKEN_STORAGE_KEY = 'super-admin-refresh-token'

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
  const queryClient = useQueryClient()

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const refreshToken = await loadRefreshToken()
      if (!refreshToken) {
        setAuthReady(true)
        return
      }

      try {
        // Clear in-memory refresh token temporarily to prevent interceptor retry loop
        const { setRefreshToken, axiosInstance } = await import('@saccosphere/api-client')
        setRefreshToken(null)
        
        const response = await axiosInstance.post('/accounts/token/refresh/', { refresh: refreshToken })
        
        const newToken = response.data.data?.access || response.data.access
        if (!newToken) throw new Error('No access token in refresh response')
        
        setAccessToken(newToken)
        setRefreshToken(refreshToken) // Restore it if refresh succeeded

        // Fetch user profile
        const user = await api.member.getProfile()

        if (!isMounted) return
        setAuth({ token: newToken, user })
        
        // Invalidate all queries to ensure fresh data on page load
        queryClient.invalidateQueries()
      } catch (error) {
        // Clear tokens on any error (401, network, etc.)
        console.error('Auth bootstrap failed:', error)
        clearTokens()
        await clearStoredRefreshToken()
        clearAuth()
      } finally {
        // Always set authReady to true, even on failure
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
  }, [setAuth, clearAuth, setAuthReady, queryClient])
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

import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, setAccessToken, setRefreshToken } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'

const REFRESH_TOKEN_STORAGE_KEY = 'super-admin-refresh-token'

export function useAuthBootstrap() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const setAuthReady = useAuthStore((state) => state.setAuthReady)

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      if (!refreshToken) {
        setAuthReady(true)
        return
      }

      try {
        setRefreshToken(refreshToken)
        const { access } = await api.auth.refresh(refreshToken)
        setAccessToken(access)
        const user = await api.member.getProfile()

        if (user.role !== 'superadmin') {
          throw new Error('Only platform admin accounts may use this portal.')
        }

        if (!isMounted) return
        setAuth({ token: access, user })
      } catch (error) {
        clearTokens()
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
        clearAuth()
      } finally {
        if (isMounted) setAuthReady(true)
      }
    }

    const handleLogout = () => {
      clearTokens()
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
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

export function useLogin() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const tokens = await api.auth.login(data)
      if (tokens.user.role !== 'superadmin') {
        clearTokens()
        throw new Error('Only platform admin accounts may sign in to this portal.')
      }
      return tokens
    },
    onSuccess: (tokens) => {
      setAccessToken(tokens.access)
      setRefreshToken(tokens.refresh)
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh)
      setAuth({ token: tokens.access, user: tokens.user })
      queryClient.clear()
    },
  })
}

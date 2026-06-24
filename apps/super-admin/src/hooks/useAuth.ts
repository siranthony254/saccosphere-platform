import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, setAccessToken, setRefreshToken, apiCall } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { User } from '@saccosphere/schemas'

const REFRESH_TOKEN_STORAGE_KEY = 'super-admin-refresh-token'

// ─── Role helpers (mirrors api-client logic, works on management/roles response) ─

function deriveRoleFromRoles(roles: any[]): User['role'] {
  const names = roles.map((r: any) => String(r.name ?? '').toUpperCase())
  if (names.includes('SUPER_ADMIN')) return 'superadmin'
  if (names.includes('SACCO_ADMIN')) return 'sacco_admin'
  return 'member'
}

async function fetchRolesForUser(userId: string): Promise<any[]> {
  try {
    const response = await apiCall<any>('GET', '/management/roles/', undefined, {
      params: { user_id: userId },
    })
    const results = Array.isArray(response)
      ? response
      : Array.isArray(response?.results)
        ? response.results
        : []
    return results
  } catch {
    // 403 means the user is not an admin — return empty
    return []
  }
}

// ─── Auth Bootstrap ────────────────────────────────────────────────────────────

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

        // Refresh the access token
        const { access } = await api.auth.refresh(refreshToken)
        setAccessToken(access)

        // Fetch basic profile (no role field in backend response)
        const basicUser = await api.member.getProfile()

        // Fetch roles from management API to determine admin level
        const roles = await fetchRolesForUser(String(basicUser.id))
        const role = deriveRoleFromRoles(roles)

        // Super admin portal only allows superadmin accounts
        if (role !== 'superadmin') {
          throw new Error('Only platform admin accounts may use this portal.')
        }

        const user: User = { ...basicUser, role }

        if (!isMounted) return
        setAuth({ token: access, user })
      } catch {
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

// ─── Login Mutation ────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      // api.auth.login now:
      //  1. POSTs to /accounts/login/ → gets tokens + basic user
      //  2. Sets access token in memory
      //  3. Calls /management/roles/ to determine role
      //  4. Returns AuthTokens with role-enriched user
      const tokens = await api.auth.login(data)

      if (tokens.user.role !== 'superadmin') {
        clearTokens()
        throw new Error(
          'Only platform super-admin accounts may sign in here. ' +
          'If you are a SACCO admin, please use the SACCO admin portal.'
        )
      }
      return tokens
    },
    onSuccess: (tokens) => {
      // Token is already set in api.auth.login, but set it again to be safe
      setAccessToken(tokens.access)
      setRefreshToken(tokens.refresh ?? '')
      if (tokens.refresh) {
        window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh)
      }
      setAuth({ token: tokens.access, user: tokens.user })
      queryClient.clear()
    },
  })
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()

  return async () => {
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    try {
      if (refreshToken) {
        // Tell backend to blacklist the refresh token
        await apiCall<void>('POST', '/accounts/logout/', { refresh: refreshToken })
      }
    } catch {
      // Ignore errors — always clear local state regardless
    } finally {
      clearTokens()
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
      clearAuth()
      queryClient.clear()
    }
  }
}

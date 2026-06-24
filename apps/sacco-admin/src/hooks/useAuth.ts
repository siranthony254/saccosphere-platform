import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, setAccessToken, setRefreshToken, apiCall } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { User } from '@saccosphere/schemas'

const REFRESH_TOKEN_STORAGE_KEY = 'sacco-admin-refresh-token'

// ─── Role helpers ──────────────────────────────────────────────────────────────

function deriveRoleFromRoles(roles: any[], basicUser?: Partial<User>): User['role'] {
  const names = roles.map((r: any) => String(r.name ?? r.role ?? '').toUpperCase())
  if (names.includes('SUPER_ADMIN') || names.includes('SUPERADMIN')) return 'superadmin'
  if (names.includes('SACCO_ADMIN') || names.includes('SACCOADMIN')) return 'sacco_admin'

  const explicitRole = String(basicUser?.role ?? '').toLowerCase()
  if (explicitRole === 'superadmin' || explicitRole === 'super_admin') return 'superadmin'
  if (explicitRole === 'sacco_admin') return 'sacco_admin'

  return 'member'
}

function saccoContextFromRoles(roles: any[]): { sacco_id: string | null; sacco_slug: string | null } {
  const adminRole = roles.find(
    (r: any) => String(r.name).toUpperCase() === 'SACCO_ADMIN' && r.sacco != null
  )
  if (!adminRole) return { sacco_id: null, sacco_slug: null }
  const saccoId = typeof adminRole.sacco === 'object' ? adminRole.sacco?.id : adminRole.sacco
  const saccoSlug = typeof adminRole.sacco === 'object' ? adminRole.sacco?.slug ?? null : null
  return {
    sacco_id: saccoId ? String(saccoId) : null,
    sacco_slug: saccoSlug,
  }
}

async function fetchRolesForUser(userId: string): Promise<any[]> {
  for (const params of [{ user_id: userId }, undefined] as const) {
    try {
      const response = await apiCall<any>(
        'GET',
        '/management/roles/',
        undefined,
        params ? { params } : undefined
      )
      const results = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
          ? response.results
          : []
      if (results.length > 0) return results
    } catch {
      // try next strategy
    }
  }
  return []
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

        // Fetch basic profile
        const basicUser = await api.member.getProfile()

        // Determine role via management API
        const roles = await fetchRolesForUser(String(basicUser.id))
        const role = deriveRoleFromRoles(roles, basicUser)
        const saccoCtx = saccoContextFromRoles(roles)

        // SACCO admin portal allows sacco_admin OR superadmin accounts
        if (role !== 'sacco_admin' && role !== 'superadmin') {
          throw new Error('Only SACCO admin accounts may use this portal.')
        }

        const user: User = { ...basicUser, role, ...saccoCtx }

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
      const tokens = await api.auth.login(data)

      if (tokens.user.role !== 'sacco_admin' && tokens.user.role !== 'superadmin') {
        clearTokens()
        throw new Error(
          'Only SACCO admin accounts may sign in to this portal. ' +
          'Regular members should use the Saccosphere member app.'
        )
      }
      return tokens
    },
    onSuccess: (tokens) => {
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

// ─── Register (optional — sacco-admins are typically set up by super admin) ───

export function useRegister() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (data: {
      email: string
      first_name: string
      last_name: string
      phone_number: string
      password: string
      password2: string
    }) => {
      const tokens = await api.auth.register(data)
      if (tokens.user.role !== 'sacco_admin' && tokens.user.role !== 'superadmin') {
        clearTokens()
        throw new Error('Only SACCO or platform admins may register here.')
      }
      return tokens
    },
    onSuccess: (tokens) => {
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

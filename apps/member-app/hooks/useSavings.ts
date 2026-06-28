import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import { useIsAuthenticated } from '../store/useAuthStore'

export function useSavings(params?: { sacco?: string; status?: string }) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: QueryKeys.savings(params),
    queryFn: () => api.savings.list(params),
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: isAuthenticated,
  })
}

export function useSavingsTypes(saccoId: string) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['savings-types', saccoId],
    queryFn: () => api.savings.getTypes(saccoId),
    staleTime: 300_000, // 5 minutes - savings types don't change frequently
    gcTime: 600_000,
    enabled: isAuthenticated && !!saccoId,
  })
}

export function useSavingsBalance(saccoId: string) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['savings-balance', saccoId],
    queryFn: () => api.member.getBalance(saccoId),
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: isAuthenticated && !!saccoId,
  })
}

export function useSavingsBreakdown(saccoId: string) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['savings-breakdown', saccoId],
    queryFn: () => api.savings.getBreakdown(saccoId),
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: isAuthenticated && !!saccoId,
  })
}

import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { Transaction } from '@saccosphere/schemas'
import { useIsAuthenticated } from '../store/useAuthStore'

interface TransactionFilters {
  sacco?: string
  type?: string
  from?: string
  to?: string
}

export function useTransactions(filters?: TransactionFilters) {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: QueryKeys.transactions(filters),
    queryFn: () => api.member.getTransactions(filters).then((r) => r.results),
    staleTime: STALE_TIMES.transactions,
    gcTime: 300_000, // Keep in cache for 5 minutes
    enabled: isAuthenticated,
  })
}

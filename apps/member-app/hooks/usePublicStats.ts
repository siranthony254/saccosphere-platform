import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useIsAuthenticated } from '../store/useAuthStore'

export function usePublicStats() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: api.saccos.getPublicStats,
    staleTime: 30_000,
    gcTime: 300_000,
    enabled: isAuthenticated, // Only fetch when authenticated
    retry: 1, // Only retry once on failure
  })
}

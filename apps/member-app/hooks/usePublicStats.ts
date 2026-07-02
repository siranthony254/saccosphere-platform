import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: api.saccos.getPublicStats,
    staleTime: 30_000,
    gcTime: 300_000,
    enabled: true, // Always fetch - public stats don't require authentication
    retry: 1, // Only retry once on failure
  })
}

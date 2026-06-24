import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: api.saccos.getPublicStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

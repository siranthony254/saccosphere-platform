import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { Sacco } from '@saccosphere/schemas'

export function useSaccos(params?: { sector?: string; county?: string; search?: string }) {
  return useQuery({
    queryKey: QueryKeys.saccos(params),
    queryFn: () => api.saccos.list(params),
    staleTime: STALE_TIMES.saccos,
    gcTime: 600_000, // Keep in cache for 10 minutes
  })
}

export function useSacco(slug: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['sacco', slug],
    queryFn: () => api.saccos.get(slug),
    staleTime: STALE_TIMES.saccos,
    gcTime: 600_000, // Keep in cache for 10 minutes
    refetchInterval: options?.refetchInterval, // Only refetch if explicitly requested
  })
}

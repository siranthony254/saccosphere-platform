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
    enabled: true, // SACCO discovery is public - no authentication required
  })
}

export function useSacco(slug: string, options?: { refetchInterval?: number; staleTime?: number }) {
  return useQuery({
    queryKey: ['sacco', slug],
    queryFn: () => api.saccos.get(slug),
    staleTime: options?.staleTime ?? STALE_TIMES.saccos,
    gcTime: 600_000, // Keep in cache for 10 minutes
    refetchInterval: options?.refetchInterval, // Only refetch if explicitly requested
    enabled: !!slug, // Fetch when slug is provided (SACCO details may be public)
  })
}

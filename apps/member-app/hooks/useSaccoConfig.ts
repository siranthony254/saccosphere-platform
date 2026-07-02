import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useSaccoConfig(slug: string, options?: { refetchInterval?: number; staleTime?: number }) {
  return useQuery({
    queryKey: QueryKeys.saccoConfig(slug),
    queryFn: () => api.saccos.getConfig(slug),
    staleTime: options?.staleTime ?? STALE_TIMES.saccoConfig,
    gcTime: 600_000, // Keep in cache for 10 minutes
    refetchInterval: options?.refetchInterval,
    enabled: !!slug, // Fetch when slug is provided (SACCO config may be public for discovery)
  })
}

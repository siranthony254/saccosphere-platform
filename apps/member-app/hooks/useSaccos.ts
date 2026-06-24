import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { Sacco } from '@saccosphere/schemas'

export function useSaccos(params?: { sector?: string; county?: string; search?: string }) {
  return useQuery({
    queryKey: QueryKeys.saccos(params),
    queryFn: () => api.saccos.list(params),
  })
}

export function useSacco(slug: string) {
  return useQuery({
    queryKey: ['sacco', slug],
    queryFn: () => api.saccos.get(slug),
  })
}

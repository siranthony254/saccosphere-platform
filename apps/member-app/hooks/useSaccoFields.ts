import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useSaccoFields(saccoId: string) {
  return useQuery({
    queryKey: ['sacco-fields', saccoId],
    queryFn: () => api.member.getSaccoFields(saccoId),
    enabled: !!saccoId,
    staleTime: 300_000, // 5 minutes
  })
}

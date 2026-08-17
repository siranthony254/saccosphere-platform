import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useInternalGuarantors(params?: { status?: string }) {
  return useQuery({
    queryKey: ['internal-guarantors', params],
    queryFn: () => api.saccoAdmin.getInternalGuarantors(params),
    staleTime: 15_000,
  })
}

export function useReleaseGuarantorHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.saccoAdmin.releaseGuarantorHold(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-guarantors'] })
    },
  })
}

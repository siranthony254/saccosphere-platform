import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useExternalGuarantors(params?: { status?: string }) {
  return useQuery({
    queryKey: ['external-guarantors', params],
    queryFn: () => api.saccoAdmin.getExternalGuarantors(params),
  })
}

export function useReviewExternalGuarantor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      api.saccoAdmin.reviewExternalGuarantor(id, { action, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['external-guarantors'] }),
  })
}

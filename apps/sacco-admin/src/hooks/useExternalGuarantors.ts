import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useExternalGuarantors() {
  return useQuery({
    queryKey: ['external-guarantors'],
    queryFn: api.saccoAdmin.getExternalGuarantors,
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

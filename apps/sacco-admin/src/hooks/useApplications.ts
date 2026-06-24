import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useApplications() {
  return useQuery({
    queryKey: QueryKeys.adminApplications(),
    queryFn: api.saccoAdmin.getApplications,
  })
}

export function useReviewApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      api.saccoAdmin.reviewApplication(id, { action, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeys.adminApplications() }),
  })
}

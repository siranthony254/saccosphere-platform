import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useApplications(params?: { status?: string }) {
  return useQuery({
    queryKey: ['admin-applications', params?.status],
    queryFn: () => api.saccoAdmin.getApplications(params),
    staleTime: 30_000,
  })
}


export function useReviewApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, review_notes }: { id: string; status: 'APPROVED' | 'REJECTED'; review_notes?: string }) =>
      api.saccoAdmin.reviewApplication(id, { status, review_notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-applications'] }),
  })
}

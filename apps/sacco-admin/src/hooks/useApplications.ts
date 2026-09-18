import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useApplications(params?: { status?: string }) {
  return useQuery({
    queryKey: ['admin-applications', params?.status],
    queryFn: () => api.saccoAdmin.getApplications(params),
    staleTime: 30_000,
  })
}

export function useApplicationReview(applicationId: string | null) {
  return useQuery({
    queryKey: ['admin-application-review', applicationId],
    queryFn: () => api.saccoAdmin.getApplicationReview(applicationId as string),
    enabled: Boolean(applicationId),
  })
}

export function useReviewApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, status, review_notes }: { applicationId: string; status: 'APPROVED' | 'REJECTED'; review_notes?: string }) =>
      api.saccoAdmin.reviewApplication(applicationId, { status, review_notes }),
    onSuccess: (_data, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-application-review', applicationId] })
    },
  })
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useKycQueue(params?: { status?: string }) {
  return useQuery({
    queryKey: ['kyc-queue', params],
    queryFn: () => api.saccoAdmin.getKycQueue(params),
  })
}

export function useReviewKyc() {
  return useMutation({
    mutationFn: ({ id, status, rejection_reason }: { id: string; status: 'APPROVED' | 'REJECTED'; rejection_reason?: string }) =>
      api.saccoAdmin.reviewKyc(id, { status, rejection_reason }),
  })
}

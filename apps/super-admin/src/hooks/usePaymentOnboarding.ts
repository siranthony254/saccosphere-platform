import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const KEY = ['payment-onboarding-submissions']

export function usePaymentOnboardingQueue() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.superAdmin.getPaymentConfigSubmissions(),
    staleTime: 15_000,
  })
}

export function useVerifyPaymentConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.superAdmin.verifyPaymentConfigSubmission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useApprovePaymentConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.superAdmin.approvePaymentConfigSubmission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRejectPaymentConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.superAdmin.rejectPaymentConfigSubmission(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function usePaymentConfigSubmissions() {
  return useQuery({
    queryKey: ['payment-config-submissions'],
    queryFn: () => api.saccoAdmin.getPaymentConfigSubmissions(),
    staleTime: 15_000,
  })
}

export function useSubmitPaymentConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.saccoAdmin.submitPaymentConfig>[0]) =>
      api.saccoAdmin.submitPaymentConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-config-submissions'] }),
  })
}

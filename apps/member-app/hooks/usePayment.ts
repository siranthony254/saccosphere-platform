import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useInitiatePayment() {
  return useMutation({
    mutationFn: api.payments.stkPush,
  })
}

export function useFeePreview(params: { type: 'deposit' | 'repayment' | 'withdrawal'; amount: number }) {
  return useQuery({
    queryKey: ['fee-preview', params.type, params.amount],
    queryFn: () => api.payments.getFeePreview(params),
    staleTime: 300_000,
    gcTime: 600_000,
    enabled: params.amount > 0,
  })
}

export function useWithdrawSavings() {
  return useMutation({
    mutationFn: (data: { sacco_id: string; saving_id: string; amount: number; phone_number: string }) =>
      api.payments.withdrawSavings(data),
  })
}

export function usePaymentStatus(reference: string) {
  return useQuery({
    queryKey: QueryKeys.paymentStatus(reference),
    queryFn: () => api.payments.checkStatus(reference),
    staleTime: STALE_TIMES.paymentStatus,
    enabled: Boolean(reference),
    refetchInterval: (query) => (query.state.data?.is_final ? false : 4000),
  })
}

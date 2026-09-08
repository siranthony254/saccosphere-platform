import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { STKPushInput, STKPushResponse } from '@saccosphere/schemas'

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

export function useMpesaDetails(id: string) {
  return useQuery({
    queryKey: ['mpesa-details', id],
    queryFn: () => api.payments.getMpesaDetails(id),
    staleTime: 300_000,
    enabled: !!id,
  })
}

export function useB2cDisburse() {
  return useMutation({
    mutationFn: api.payments.b2cDisburse,
  })
}

export function useB2cStatus(conversationId: string) {
  return useQuery({
    queryKey: ['b2c-status', conversationId],
    queryFn: () => api.payments.checkB2cStatus(conversationId),
    staleTime: 30_000,
    refetchInterval: (query) => (query.state.data?.is_final ? false : 10_000),
    enabled: !!conversationId,
  })
}

export function useB2cHistory(saccoId?: string) {
  return useQuery({
    queryKey: ['b2c-history', saccoId],
    queryFn: () => api.payments.getB2cHistory(saccoId),
    staleTime: 60_000,
  })
}

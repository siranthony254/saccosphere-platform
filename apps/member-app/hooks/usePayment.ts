import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { STKPushInput, STKPushResponse } from '@saccosphere/schemas'

export function useInitiatePayment() {
  return useMutation({
    mutationFn: api.payments.stkPush,
  })
}

export function usePaymentStatus(reference: string) {
  return useQuery({
    queryKey: QueryKeys.paymentStatus(reference),
    queryFn: () => api.payments.checkStatus(reference),
    staleTime: STALE_TIMES.paymentStatus,
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
    refetchInterval: 10_000, // Poll every 10 seconds
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

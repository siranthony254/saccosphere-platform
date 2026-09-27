import { useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api, generateIdempotencyKey } from '@saccosphere/api-client'
import type { STKPushInput } from '@saccosphere/schemas'

export function useInitiatePayment() {
  // One key per mount of the screen that owns this hook (i.e. per payment
  // attempt) — reused across any retry/double-tap of that same attempt so
  // the backend can't double-charge, per the Idempotency-Key contract.
  const idempotencyKeyRef = useRef(generateIdempotencyKey())
  return useMutation({
    mutationFn: (data: STKPushInput) => api.payments.stkPush(data, idempotencyKeyRef.current),
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
  const idempotencyKeyRef = useRef(generateIdempotencyKey())
  return useMutation({
    mutationFn: (data: { sacco_id: string; saving_id: string; amount: number; phone_number: string }) =>
      api.payments.withdrawSavings(data, idempotencyKeyRef.current),
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

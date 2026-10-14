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

export function useFeePreview(params: { type: 'deposit' | 'repayment' | 'withdrawal'; amount: number; sacco_id?: string }) {
  return useQuery({
    queryKey: ['fee-preview', params.type, params.amount, params.sacco_id],
    queryFn: () => api.payments.getFeePreview(params),
    staleTime: 300_000,
    gcTime: 600_000,
    enabled: params.amount > 0,
  })
}

export function useWithdrawSavings() {
  const idempotencyKeyRef = useRef(generateIdempotencyKey())
  return useMutation({
    mutationFn: (data: { sacco_id: string; saving_id: string; amount: number; phone_number: string; verification_code?: string }) =>
      api.payments.withdrawSavings(data, idempotencyKeyRef.current),
  })
}

// P11 internal transfer — fully synchronous (no M-Pesa leg, no pending
// state), so unlike withdrawals this never needs step-up/polling handling
// of its own: a 201 is immediate final success, any 4xx is immediate
// final failure.
export function useInternalTransfer() {
  const idempotencyKeyRef = useRef(generateIdempotencyKey())
  return useMutation({
    mutationFn: (data: {
      source_saving_id: string
      destination_kind: 'LOAN_REPAYMENT' | 'BOSA' | 'SHARE_CAPITAL' | 'MEMBER'
      destination_id?: string
      destination_member_number?: string
      amount: number
    }) => api.payments.internalTransfer(data, idempotencyKeyRef.current),
  })
}

// Polls the dedicated withdrawal-status endpoint once a withdrawal is
// REQUESTED/PENDING_APPROVAL/APPROVED/SUBMITTED/UNKNOWN — stops once it
// lands on a genuinely terminal state (COMPLETED/FAILED/REJECTED).
export function useWithdrawalStatus(transactionId: string | null) {
  return useQuery({
    queryKey: ['withdrawal-status', transactionId],
    queryFn: () => api.payments.checkWithdrawalStatus(transactionId!),
    enabled: Boolean(transactionId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 5000
      return data.is_completed || data.is_failed ? false : 5000
    },
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

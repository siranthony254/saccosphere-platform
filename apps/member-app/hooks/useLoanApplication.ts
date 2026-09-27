import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api, generateIdempotencyKey } from '@saccosphere/api-client'
import type { LoanApplicationInput } from '@saccosphere/schemas'

export function useSubmitLoanApplication() {
  const queryClient = useQueryClient()
  const idempotencyKeyRef = useRef(generateIdempotencyKey())

  return useMutation({
    mutationFn: (data: LoanApplicationInput) => api.loans.apply(data, idempotencyKeyRef.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.loans() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}

export function useRepayLoan() {
  const queryClient = useQueryClient()
  const idempotencyKeyRef = useRef(generateIdempotencyKey())

  return useMutation({
    mutationFn: ({
      loanId,
      amount,
      saccoId,
      phoneNumber,
      instalmentNumber,
    }: {
      loanId: string
      amount: number
      saccoId: string
      phoneNumber: string
      instalmentNumber?: number
    }) =>
      api.loans.repay(loanId, amount, {
        sacco_id: saccoId,
        phone_number: phoneNumber,
        instalment_number: instalmentNumber,
      }, idempotencyKeyRef.current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.loans() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}

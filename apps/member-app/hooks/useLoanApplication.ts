import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useSubmitLoanApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.loans.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.loans() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}

export function useRespondToGuarantorRequest() {
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      api.loans.respondToGuarantorRequest(id, action),
  })
}

export function useRepayLoan() {
  const queryClient = useQueryClient()

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
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.loans() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard() })
    },
  })
}

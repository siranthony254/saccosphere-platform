import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useAdminLoans(filters?: { status?: string }) {
  return useQuery({
    queryKey: QueryKeys.adminLoans(filters),
    queryFn: () => api.saccoAdmin.getLoans(filters),
  })
}

export function useReviewLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      api.saccoAdmin.reviewLoan(id, { action, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeys.adminLoans() }),
  })
}

export function useDisburseLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ loanId, amount, phone_number, remarks }: {
      loanId: string
      amount: number
      phone_number: string
      remarks?: string
    }) => api.saccoAdmin.disburseLoan(loanId, { amount, phone_number, remarks }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeys.adminLoans() }),
  })
}

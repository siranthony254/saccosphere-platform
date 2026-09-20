import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export type LoanType = {
  id: string
  name: string
  description: string
  interest_rate: number
  max_term_months: number
  min_amount: number
  max_amount: number
  requires_guarantors: boolean
  min_guarantors: number
  is_active: boolean
}

export type LoanTypeInput = {
  name: string
  description?: string
  interest_rate: number
  max_term_months: number
  min_amount: number
  max_amount: number
  requires_guarantors?: boolean
  min_guarantors?: number
  is_active?: boolean
}

export function useLoanTypesList(saccoId?: string) {
  return useQuery({
    queryKey: ['loan-types', saccoId],
    queryFn: () => api.saccoAdmin.getLoanTypes(saccoId!) as Promise<LoanType[]>,
    enabled: !!saccoId,
    staleTime: 60_000,
  })
}

export function useCreateLoanType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LoanTypeInput) => api.saccoAdmin.createLoanType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loan-types'] }),
  })
}

export function useUpdateLoanType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LoanTypeInput> }) =>
      api.saccoAdmin.updateLoanType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loan-types'] }),
  })
}

export function useDeleteLoanType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.deleteLoanType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loan-types'] }),
  })
}

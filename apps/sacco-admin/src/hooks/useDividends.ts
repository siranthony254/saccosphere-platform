import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import type { DividendDeclaration } from '@saccosphere/schemas'

const IN_PROGRESS_STATUSES = ['CALCULATING', 'DISBURSING']

export function useDividendDeclarations() {
  return useQuery({
    queryKey: ['dividend-declarations'],
    queryFn: api.saccoAdmin.getDividendDeclarations,
    // calculate/disburse now queue a background job and return immediately
    // (202, status CALCULATING/DISBURSING) instead of completing inline —
    // poll while anything is mid-flight so the table reflects CALCULATED/
    // DISBURSED/FAILED without the admin needing to manually refresh.
    refetchInterval: (query) => {
      const declarations = query.state.data as DividendDeclaration[] | undefined
      const hasInProgress = declarations?.some((d) => IN_PROGRESS_STATUSES.includes(d.status))
      return hasInProgress ? 3000 : false
    },
  })
}

export function useCreateDividendDeclaration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      savings_type: string
      financial_year: string
      declared_rate: number
      period_start: string
      period_end: string
    }) => api.saccoAdmin.createDividendDeclaration(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dividend-declarations'] }),
  })
}

export function useSavingsTypes(saccoId?: string) {
  return useQuery({
    queryKey: ['savings-types', saccoId],
    queryFn: () => api.saccoAdmin.getSavingsTypes(saccoId!),
    enabled: !!saccoId,
    staleTime: 300_000,
  })
}

export function useCalculateDividend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.calculateDividend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dividend-declarations'] })
      qc.invalidateQueries({ queryKey: ['dividend-payouts'] })
    },
  })
}

export function useApproveDividend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.approveDividend(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dividend-declarations'] }),
  })
}

export function useDisburseDividend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.disburseDividend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dividend-declarations'] })
      qc.invalidateQueries({ queryKey: ['dividend-payouts'] })
    },
  })
}

export function useDividendPayouts() {
  return useQuery({
    queryKey: ['dividend-payouts'],
    queryFn: api.saccoAdmin.getDividendPayouts,
  })
}

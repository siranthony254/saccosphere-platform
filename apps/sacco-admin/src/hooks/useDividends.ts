import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useDividendDeclarations() {
  return useQuery({
    queryKey: ['dividend-declarations'],
    queryFn: api.saccoAdmin.getDividendDeclarations,
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

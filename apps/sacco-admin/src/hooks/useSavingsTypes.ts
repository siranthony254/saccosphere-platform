import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export type SavingsType = {
  id: string
  name: string
  description: string
  interest_rate: number
  minimum_contribution: number
  is_active: boolean
  allows_multiple_accounts: boolean
}

export type SavingsTypeInput = {
  name: string
  description?: string
  interest_rate: number
  minimum_contribution: number
  is_active?: boolean
  allows_multiple_accounts?: boolean
}

export function useSavingsTypesList(saccoId?: string) {
  return useQuery({
    queryKey: ['savings-types', saccoId],
    queryFn: () => api.saccoAdmin.getSavingsTypes(saccoId!) as Promise<SavingsType[]>,
    enabled: !!saccoId,
    staleTime: 60_000,
  })
}

export function useCreateSavingsType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SavingsTypeInput) => api.saccoAdmin.createSavingsType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-types'] }),
  })
}

export function useUpdateSavingsType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavingsTypeInput> }) =>
      api.saccoAdmin.updateSavingsType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-types'] }),
  })
}

export function useDeleteSavingsType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.deleteSavingsType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-types'] }),
  })
}

import { useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useLedgerEntries(params?: { sacco_id?: string; from_date?: string; to_date?: string }) {
  return useQuery({
    queryKey: ['ledger-entries', params],
    queryFn: () => api.member.getEntries(params),
    staleTime: 60_000,
    gcTime: 300_000,
  })
}

export function useLedgerBalance(saccoId: string) {
  return useQuery({
    queryKey: ['ledger-balance', saccoId],
    queryFn: () => api.member.getBalance(saccoId),
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: !!saccoId,
  })
}

export function useStatement(params: { sacco_id: string; from_date: string; to_date: string }) {
  return useQuery({
    queryKey: ['statement', params],
    queryFn: () => api.member.getStatement(params),
    staleTime: 60_000,
  })
}

import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useLedgerEntries(params: { sacco_id: string; from_date?: string; to_date?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: ['ledger-entries', params],
    queryFn: () => api.saccoAdmin.getLedgerEntries(params),
    enabled: Boolean(params.sacco_id),
    staleTime: 15_000,
  })
}

export function useLedgerBalance(saccoId?: string) {
  return useQuery({
    queryKey: ['ledger-balance', saccoId],
    queryFn: () => api.saccoAdmin.getLedgerBalance(saccoId!),
    enabled: Boolean(saccoId),
    staleTime: 15_000,
  })
}

export function useLedgerStatement(params: { sacco_id: string; from_date: string; to_date: string; page?: number }) {
  return useQuery({
    queryKey: ['ledger-statement', params],
    queryFn: () => api.saccoAdmin.getLedgerStatement(params),
    enabled: Boolean(params.sacco_id && params.from_date && params.to_date),
    staleTime: 30_000,
  })
}

export function useDownloadLedgerPDF() {
  return useMutation({
    mutationFn: (params: { sacco_id: string; from_date: string; to_date: string }) =>
      api.saccoAdmin.downloadLedgerStatementPDF(params),
  })
}

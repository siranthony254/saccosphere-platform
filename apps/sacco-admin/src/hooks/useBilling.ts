import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.saccoAdmin.getInvoices(),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.saccoAdmin.getInvoice(id),
    enabled: !!id,
  })
}

export function useResendInvoice() {
  return useMutation({
    mutationFn: api.saccoAdmin.resendInvoice,
  })
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format?: 'csv' | 'pdf' }) =>
      api.saccoAdmin.downloadInvoice(id, format),
  })
}

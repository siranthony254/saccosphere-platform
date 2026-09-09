import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useInvoices(params?: { status?: string; sacco_id?: string }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await api.saccoAdmin.getInvoices(params)
      return Array.isArray(response) ? response : response.results ?? []
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.saccoAdmin.getInvoice(id),
    enabled: !!id,
  })
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format?: 'csv' | 'pdf' }) =>
      api.saccoAdmin.downloadInvoice(id, format),
  })
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, payment_ref, payment_method }: {
      id: string
      amount: number
      payment_ref: string
      payment_method: 'mpesa' | 'bank' | 'internal'
    }) => api.superAdmin.markInvoicePaid(id, { amount, payment_ref, payment_method }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice'] })
      qc.invalidateQueries({ queryKey: ['revenue-summary'] })
      qc.invalidateQueries({ queryKey: ['all-saccos'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useReminderPolicy() {
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['reminder-policy'],
    queryFn: () => api.saccoAdmin.getReminderPolicy(),
  })

  const m = useMutation({
    mutationFn: (data: Parameters<typeof api.saccoAdmin.updateReminderPolicy>[0]) =>
      api.saccoAdmin.updateReminderPolicy(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminder-policy'] }),
  })

  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error,
    isSaving: m.isPending,
    save: (
      data: Parameters<typeof api.saccoAdmin.updateReminderPolicy>[0],
      options?: { onSuccess?: () => void; onError?: (error: unknown) => void }
    ) => m.mutate(data, options),
  }
}

export function useCollectionsQueue(minDays = 1) {
  return useQuery({
    queryKey: ['collections-queue', minDays],
    queryFn: () => api.saccoAdmin.getCollectionsQueue(minDays),
  })
}

export function usePAR() {
  return useQuery({
    queryKey: ['collections-par'],
    queryFn: () => api.saccoAdmin.getPAR(),
  })
}

export function useLoanContacts(loanId: string | null) {
  return useQuery({
    queryKey: ['loan-contacts', loanId],
    queryFn: () => api.saccoAdmin.getLoanContacts(loanId!),
    enabled: !!loanId,
  })
}

export function useLogLoanContact(loanId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { channel: 'CALL' | 'SMS' | 'VISIT' | 'OTHER'; outcome: string; notes?: string }) =>
      api.saccoAdmin.logLoanContact(loanId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan-contacts', loanId] })
      qc.invalidateQueries({ queryKey: ['collections-queue'] })
    },
  })
}

export function useLoanPromises(loanId: string | null) {
  return useQuery({
    queryKey: ['loan-promises', loanId],
    queryFn: () => api.saccoAdmin.getLoanPromises(loanId!),
    enabled: !!loanId,
  })
}

export function useCreateLoanPromise(loanId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { promised_on: string; amount: number }) => api.saccoAdmin.createLoanPromise(loanId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan-promises', loanId] })
      qc.invalidateQueries({ queryKey: ['collections-queue'] })
    },
  })
}

export function useCancelLoanPromise(loanId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (promiseId: string) => api.saccoAdmin.cancelLoanPromise(promiseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan-promises', loanId] })
      qc.invalidateQueries({ queryKey: ['collections-queue'] })
    },
  })
}

// Maker-checker gated — always lands on the approvals queue, never
// immediate. There's no useful optimistic update, just a 202 ack.
export function useInitiateGuarantorRecovery(loanId: string | null) {
  return useMutation({
    mutationFn: (requestedAmount: number) => api.saccoAdmin.initiateGuarantorRecovery(loanId!, requestedAmount),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

// Every pledge the member has made, across every SACCO, plus their own
// guarantee capacity. Doubles as "pending requests needing my action"
// (filter status === 'PENDING') and a full "my guarantees" statement.
export function useGuarantorStatement() {
  return useQuery({
    queryKey: ['guarantor-statement'],
    queryFn: api.loans.getGuarantorStatement,
    staleTime: 30_000,
  })
}

export function useRequestGuarantorOtp() {
  return useMutation({
    mutationFn: ({ loanId, guarantorId }: { loanId: string; guarantorId: string }) =>
      api.loans.requestGuarantorConsentOtp(loanId, guarantorId),
  })
}

export function useRespondToGuarantorRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      loanId,
      guarantorId,
      action,
      notes,
      otpCode,
    }: {
      loanId: string
      guarantorId: string
      action: 'approve' | 'decline'
      notes?: string
      otpCode?: string
    }) => api.loans.respondToGuarantorRequest(loanId, guarantorId, action, { notes, otp_code: otpCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantor-statement'] })
    },
  })
}

// Exact-match only and 404s on no match — a search-on-submit mutation
// fits better than a live query that would refetch into a 404 on every
// keystroke.
export function useSearchGuarantor(loanId: string) {
  return useMutation({
    mutationFn: (query: string) => api.loans.searchGuarantors(loanId, query),
  })
}

export function useRequestGuarantorSubstitution(loanId: string) {
  return useMutation({
    mutationFn: ({ guarantorId, newGuarantorUserId, guaranteeAmount }: { guarantorId: string; newGuarantorUserId: string; guaranteeAmount: number }) =>
      api.loans.requestGuarantorSubstitution(loanId, guarantorId, {
        new_guarantor_user_id: newGuarantorUserId,
        guarantee_amount: guaranteeAmount,
      }),
  })
}

export function useRequestReconsentOtp() {
  return useMutation({
    mutationFn: ({ restructureId, guarantorId }: { restructureId: string; guarantorId: string }) =>
      api.loans.requestGuarantorReconsentOtp(restructureId, guarantorId),
  })
}

export function useRespondToReconsent() {
  return useMutation({
    mutationFn: ({ restructureId, guarantorId, action, otpCode }: { restructureId: string; guarantorId: string; action: 'approve' | 'decline'; otpCode?: string }) =>
      api.loans.respondToGuarantorReconsent(restructureId, guarantorId, action, otpCode),
  })
}

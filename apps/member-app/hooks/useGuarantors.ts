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

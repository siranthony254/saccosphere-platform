import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

// P13 what-if: no application or record created, callable as often as
// needed - a pure calculator, not tied to any loan id.
export function useWhatIf() {
  return useMutation({
    mutationFn: ({ loanTypeId, termMonths }: { loanTypeId: string; termMonths?: number }) =>
      api.loans.whatIf(loanTypeId, termMonths),
  })
}

// 404s until an appraisal record exists (i.e. before the member has
// actually applied) - treat `error` as "nothing to show yet", not a
// real failure.
export function useAppraisalSummary(loanId: string | null) {
  return useQuery({
    queryKey: ['appraisal-summary', loanId],
    queryFn: () => api.loans.getAppraisalSummary(loanId!),
    enabled: Boolean(loanId),
    retry: false,
  })
}

// 404s until the loan has actually been approved (the offer is
// generated as a side effect of approval, never lazily).
export function useLoanOffer(loanId: string | null) {
  return useQuery({
    queryKey: ['loan-offer', loanId],
    queryFn: () => api.loans.getLoanOffer(loanId!),
    enabled: Boolean(loanId),
    retry: false,
  })
}

export function useAcceptLoanOffer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (loanId: string) => api.loans.acceptLoanOffer(loanId),
    onSuccess: (_data, loanId) => {
      queryClient.invalidateQueries({ queryKey: ['loan-offer', loanId] })
    },
  })
}

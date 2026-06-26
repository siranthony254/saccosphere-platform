import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useLoans(params?: { sacco?: string; status?: string }) {
  return useQuery({
    queryKey: QueryKeys.loans(params),
    queryFn: () => api.loans.list(params),
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // Keep in cache for 5 minutes
  })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QueryKeys.loanDetail(id),
    queryFn: () => api.loans.get(id),
    staleTime: 60_000,
    gcTime: 300_000,
  })
}

export function useLoanComparison(amount: number, months: number) {
  return useQuery({
    queryKey: QueryKeys.loanComparison(amount, months),
    queryFn: () => api.loans.compare({ amount, months }),
    staleTime: 300_000, // 5 minutes - loan products don't change frequently
    gcTime: 600_000,
  })
}

export function useGuarantorRequests() {
  return useQuery({
    queryKey: ['guarantor-requests'],
    queryFn: api.loans.getGuarantorRequests,
    refetchInterval: 30_000,
  })
}

export function useSearchGuarantors(loanId: string, query: string) {
  return useQuery({
    queryKey: QueryKeys.guarantorSearch(loanId, query),
    queryFn: () => api.loans.searchGuarantors(loanId, query),
    enabled: query.length > 0,
  })
}

export function useLoanEligibility(membershipId: string) {
  return useQuery({
    queryKey: ['loan-eligibility', membershipId],
    queryFn: () => api.loans.getEligibility(membershipId),
    staleTime: 60_000,
    gcTime: 300_000,
    enabled: !!membershipId,
  })
}

export function useLoanSchedule(loanId: string) {
  return useQuery({
    queryKey: ['loan-schedule', loanId],
    queryFn: () => api.loans.getSchedule(loanId),
    staleTime: 300_000, // Schedule doesn't change frequently
    gcTime: 600_000,
    enabled: !!loanId,
  })
}

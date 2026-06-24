import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useLoans(params?: { sacco?: string; status?: string }) {
  return useQuery({
    queryKey: QueryKeys.loans(params),
    queryFn: () => api.loans.list(params),
    refetchInterval: 30_000,
  })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QueryKeys.loanDetail(id),
    queryFn: () => api.loans.get(id),
  })
}

export function useLoanComparison(amount: number, months: number) {
  return useQuery({
    queryKey: QueryKeys.loanComparison(amount, months),
    queryFn: () => api.loans.compare({ amount, months }),
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

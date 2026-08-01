import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useAdminLoans(filters?: { status?: string }) {
  return useQuery({
    queryKey: QueryKeys.adminLoans(filters),
    queryFn: () => api.saccoAdmin.getLoanApprovals(),
  })
}

export function useReviewLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes, override_reason }: { id: string; action: 'under_review' | 'approve' | 'reject'; notes?: string; override_reason?: string }) =>
      api.saccoAdmin.reviewLoan(id, { action, notes, override_reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QueryKeys.adminLoans() }),
  })
}

export function useDisburseLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ loanId, notes }: { loanId: string; notes?: string }) =>
      api.saccoAdmin.reviewLoan(loanId, { action: 'disburse' as any, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.adminLoans() })
      qc.invalidateQueries({ queryKey: ['disbursement-history'] })
    },
  })
}

export function useManualDisburseLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { loanId: string; amount: number; phone_number: string; remarks?: string }) =>
      api.saccoAdmin.disburseLoan(data.loanId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QueryKeys.adminLoans() })
      qc.invalidateQueries({ queryKey: ['disbursement-history'] })
    },
  })
}




export function useB2CStatus(conversationId: string) {
  return useQuery({
    queryKey: ['b2c-status', conversationId],
    queryFn: () => api.saccoAdmin.getB2CStatus(conversationId),
    enabled: !!conversationId,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 5000 : false), // Poll only while pending
  })
}

export function useDisbursementHistory() {
  return useQuery({
    queryKey: ['disbursement-history'],
    queryFn: api.saccoAdmin.getDisbursements,
  })
}

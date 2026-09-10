import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export type DisbursementDispute = {
  loan_id: string
  sacco: string
  member: string
  amount: number
  status: string
  disputed_at: string | null
  dispute_reason: string
  mpesa_conversation_id: string
  audit_log_count: number
}

export function useDisbursementDisputes() {
  return useQuery({
    queryKey: ['disbursement-disputes'],
    queryFn: () => api.superAdmin.getDisbursementDisputes() as Promise<DisbursementDispute[]>,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useDisbursementAudit(loanId: string | null) {
  return useQuery({
    queryKey: ['disbursement-audit', loanId],
    queryFn: () => api.superAdmin.getDisbursementAudit(loanId!),
    enabled: !!loanId,
    staleTime: 30_000,
  })
}

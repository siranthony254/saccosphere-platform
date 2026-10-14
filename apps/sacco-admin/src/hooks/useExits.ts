import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useRefundQueue(statusFilter?: string) {
  return useQuery({
    queryKey: ['refund-queue', statusFilter],
    queryFn: () => api.saccoAdmin.getRefundQueue(statusFilter),
  })
}

export function useMarkRefundBankPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, bankReference }: { id: string; bankReference: string }) =>
      api.saccoAdmin.markRefundBankPayout(id, bankReference),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['refund-queue'] }),
  })
}

export function useDeceasedClaims() {
  return useQuery({
    queryKey: ['deceased-claims'],
    queryFn: api.saccoAdmin.getDeceasedClaims,
  })
}

export function useCreateDeceasedClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (membershipId: string) => api.saccoAdmin.createDeceasedClaim(membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deceased-claims'] }),
  })
}

export function useUploadClaimDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, documentType, file }: { claimId: string; documentType: string; file: File }) =>
      api.saccoAdmin.uploadClaimDocument(claimId, documentType, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deceased-claims'] }),
  })
}

export function useVerifyClaimDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, documentId, isVerified }: { claimId: string; documentId: string; isVerified?: boolean }) =>
      api.saccoAdmin.verifyClaimDocument(claimId, documentId, isVerified),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deceased-claims'] }),
  })
}

export function useSettleDeceasedClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ claimId, data }: { claimId: string; data: Parameters<typeof api.saccoAdmin.settleDeceasedClaim>[1] }) =>
      api.saccoAdmin.settleDeceasedClaim(claimId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deceased-claims'] }),
  })
}

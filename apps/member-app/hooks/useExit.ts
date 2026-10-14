import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useExitStatus(membershipId: string | null) {
  return useQuery({
    queryKey: ['exit-status', membershipId],
    queryFn: () => api.member.getExitStatus(membershipId!),
    enabled: !!membershipId,
    retry: false,
  })
}

export function useRequestExit(membershipId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => api.member.requestExit(membershipId!, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exit-status', membershipId] }),
  })
}

export function useCancelExit(membershipId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.member.cancelExit(membershipId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exit-status', membershipId] }),
  })
}

export function useRequestShareTransfer(membershipId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (buyerMembershipId: string) => api.member.requestShareTransfer(membershipId!, buyerMembershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exit-status', membershipId] }),
  })
}

export function useRespondToShareTransfer() {
  return useMutation({
    mutationFn: ({ exitRequestId, action }: { exitRequestId: string; action: 'ACCEPT' | 'DECLINE' }) =>
      api.member.respondToShareTransfer(exitRequestId, action),
  })
}

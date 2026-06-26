import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useKycStatus() {
  return useQuery({
    queryKey: QueryKeys.kyc(),
    queryFn: api.kyc.getStatus,
    staleTime: STALE_TIMES.profile,
  })
}

export function useSubmitKycId() {
  return useMutation({
    mutationFn: (data: { national_id: string }) => api.kyc.submitId(data),
  })
}

export function useUploadKycDocument() {
  return useMutation({
    mutationFn: api.kyc.uploadDocument,
  })
}

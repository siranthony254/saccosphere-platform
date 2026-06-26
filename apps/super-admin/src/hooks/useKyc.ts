import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useKycQueue() {
  return useQuery({
    queryKey: ['kyc-queue'],
    queryFn: api.superAdmin.getKycQueue,
  })
}

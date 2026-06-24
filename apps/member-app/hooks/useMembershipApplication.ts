import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useMembershipApplications() {
  return useQuery({
    queryKey: QueryKeys.applications(),
    queryFn: api.applications.list,
  })
}

export function useSubmitMembershipApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.applications.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QueryKeys.applications() }),
  })
}

export function usePayRegistrationFee() {
  return useMutation({
    mutationFn: api.applications.payRegistrationFee,
  })
}

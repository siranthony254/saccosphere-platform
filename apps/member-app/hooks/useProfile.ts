import { useMutation, useQuery } from '@tanstack/react-query'
import { QueryKeys, STALE_TIMES } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import type { User } from '@saccosphere/schemas'

export function useProfile() {
  return useQuery({
    queryKey: QueryKeys.profile(),
    queryFn: api.member.getProfile,
    staleTime: STALE_TIMES.profile,
  })
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (user: Partial<User>) => api.member.updateProfile(user),
    onSuccess: () => {
      return api.member.getProfile()
    },
  })
}

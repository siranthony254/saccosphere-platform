import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => api.superAdmin.getUserRoles(userId),
    enabled: !!userId,
  })
}

export function useAssignRole() {
  return useMutation({
    mutationFn: api.superAdmin.assignRole,
  })
}

export function useRevokeRole() {
  return useMutation({
    mutationFn: api.superAdmin.revokeRole,
  })
}

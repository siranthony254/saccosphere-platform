import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => api.saccoAdmin.getRoles(userId),
    enabled: !!userId,
  })
}

export function useAssignRole() {
  return useMutation({
    mutationFn: api.saccoAdmin.assignRole,
  })
}

export function useRevokeRole() {
  return useMutation({
    mutationFn: api.saccoAdmin.revokeRole,
  })
}

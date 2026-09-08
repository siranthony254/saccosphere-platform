import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

// Read-only. Assigning / revoking roles is IsSuperAdmin on the backend, so
// those actions are done from the platform (super-admin) app, not here.
export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => api.saccoAdmin.getRoles(userId),
    enabled: !!userId,
  })
}

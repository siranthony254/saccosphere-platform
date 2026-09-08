import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

// Read-only. Approve/reject needs a SaccoApplication id no endpoint exposes —
// see the note on api.saccoAdmin (getApplications lists pending members only).
export function useApplications(params?: { status?: string }) {
  return useQuery({
    queryKey: ['admin-applications', params?.status],
    queryFn: () => api.saccoAdmin.getApplications(params),
    staleTime: 30_000,
  })
}

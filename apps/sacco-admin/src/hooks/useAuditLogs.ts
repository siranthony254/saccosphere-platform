import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useAuditLogs(params?: { action?: string; resource_type?: string; cursor?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.saccoAdmin.getAuditLogs(params),
  })
}

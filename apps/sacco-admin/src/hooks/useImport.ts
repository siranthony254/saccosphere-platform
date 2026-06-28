import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useImportMembers() {
  return useMutation({
    mutationFn: api.saccoAdmin.importMembers,
  })
}

export function useImportJobStatus(jobId: string) {
  return useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () => api.saccoAdmin.getImportJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: 5000,
  })
}

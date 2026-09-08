import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useImportMembers() {
  return useMutation({
    mutationFn: api.saccoAdmin.importMembers,
  })
}

/** Add a single member — submitted through the CSV import pipeline. */
export function useAddMember() {
  return useMutation({
    mutationFn: api.saccoAdmin.addMemberViaImport,
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

import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useDownloadReport() {
  return useMutation({
    mutationFn: (format: 'csv' | 'pdf' = 'pdf') => api.saccoAdmin.downloadReport(format),
  })
}

import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useDownloadReport() {
  return useMutation({
    mutationFn: (params: { type: 'loans' | 'contributions' | 'members'; from_date?: string; to_date?: string; format?: 'csv' | 'pdf' }) => 
      api.saccoAdmin.downloadReport(params),
  })
}

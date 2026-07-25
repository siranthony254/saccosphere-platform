import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useSMSCampaigns() {
  return useQuery({
    queryKey: ['sms-campaigns'],
    queryFn: api.saccoAdmin.getSMSCampaigns,
  })
}

export function useCreateSMSCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; message: string; recipient_type: string }) =>
      api.saccoAdmin.createSMSCampaign(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sms-campaigns'] }),
  })
}

export function useSendSMSCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.saccoAdmin.sendSMSCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sms-campaigns'] }),
  })
}

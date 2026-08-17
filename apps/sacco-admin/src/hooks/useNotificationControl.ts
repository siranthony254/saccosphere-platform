import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export function useNotificationLogs(params?: { channel?: string; category?: string; status?: string }) {
  return useQuery({
    queryKey: ['notification-logs', params],
    queryFn: () => api.saccoAdmin.getNotificationLogs(params),
    staleTime: 15_000,
  })
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => api.saccoAdmin.getNotificationSettings(),
    staleTime: 30_000,
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.saccoAdmin.updateNotificationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })
}

export function useSendMultiChannelBroadcast() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; message: string; channels: Array<'SMS' | 'EMAIL' | 'PUSH'>; recipient_type: string }) =>
      api.saccoAdmin.sendMultiChannelBroadcast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] })
    },
  })
}

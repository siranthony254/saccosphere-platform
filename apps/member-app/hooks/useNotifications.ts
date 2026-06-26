import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'

export function useNotifications() {
  return useQuery({
    queryKey: QueryKeys.notifications(),
    queryFn: api.member.getNotifications,
    staleTime: 0,
    gcTime: 300_000, // Keep in cache for 5 minutes
    refetchInterval: 60_000, // Refresh every minute instead of 30 seconds
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.member.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.member.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.notifications() })
    },
  })
}

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (data: { token: string; platform: 'ios' | 'android' }) =>
      api.member.registerDevice(data),
  })
}

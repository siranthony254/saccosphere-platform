import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@saccosphere/config'
import { api } from '@saccosphere/api-client'
import { useIsAuthenticated } from '../store/useAuthStore'

export function useNotifications() {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: QueryKeys.notifications(),
    queryFn: api.member.getNotifications,
    staleTime: 0,
    gcTime: 300_000, // Keep in cache for 5 minutes
    retry: 1,
    enabled: isAuthenticated,
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
    mutationFn: (data: { token: string; platform: 'ios' | 'android' | 'web' | string }) =>
      api.member.registerDevice(data),
  })
}

export function useAutoRegisterDeviceToken() {
  const isAuthenticated = useIsAuthenticated()
  const registerDevice = useRegisterDevice()

  useEffect(() => {
    if (!isAuthenticated) return

    const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB'
    const deviceToken = `expo_token_${Platform.OS}_${Date.now()}`

    registerDevice.mutate(
      { token: deviceToken, platform },
      {
        onError: (err) => console.warn('Device token auto-registration notice:', err?.message),
      }
    )
  }, [isAuthenticated])
}

import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
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

/**
 * Requests notification permission and registers this device's real Expo
 * push token with the backend. No-ops on web (Expo push tokens require a
 * native build) and on simulators/emulators (no push capability — the SDK
 * throws, which we treat as "can't register here" rather than an error).
 */
async function getRealExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') return null

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) return null

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  return token
}

export function useAutoRegisterDeviceToken() {
  const isAuthenticated = useIsAuthenticated()
  const registerDevice = useRegisterDevice()

  useEffect(() => {
    if (!isAuthenticated) return

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'

    getRealExpoPushToken()
      .then((token) => {
        if (!token) return
        registerDevice.mutate(
          { token, platform },
          {
            onError: (err) => console.warn('Device token auto-registration notice:', err?.message),
          }
        )
      })
      .catch((err) => {
        // No push capability here (simulator/emulator, permission denied,
        // missing credentials) — not an error the user needs to see.
        console.warn('Push token unavailable on this device:', err?.message ?? err)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])
}

import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { api, setAccessToken, setRefreshToken, clearTokens } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { LoginInput, RegisterInput } from '@saccosphere/schemas'

const REFRESH_TOKEN_KEY = 'saccosphere.refresh_token'

export async function saveRefreshToken(token?: string | null) {
  setRefreshToken(token ?? null)
  if (!token) return clearStoredRefreshToken()

  if (Platform.OS === 'web') {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
    return
  }

  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
}

export async function loadRefreshToken() {
  const token =
    Platform.OS === 'web'
      ? window.localStorage.getItem(REFRESH_TOKEN_KEY)
      : await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  setRefreshToken(token)
  return token
}

export async function clearStoredRefreshToken() {
  setRefreshToken(null)
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    return
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

export function useLogin() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const tokens = await api.auth.login(data)
      if (tokens.user.role !== 'member') {
        await clearStoredRefreshToken()
        clearTokens()
        throw new Error('Only member accounts may sign in to this app.')
      }
      setAccessToken(tokens.access)
      await saveRefreshToken(tokens.refresh)
      setAuth({ token: tokens.access, user: tokens.user })
      return tokens
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const tokens = await api.auth.register(data)
      if (tokens.user.role !== 'member') {
        await clearStoredRefreshToken()
        clearTokens()
        throw new Error('Only member accounts may use this app.')
      }
      setAccessToken(tokens.access)
      await saveRefreshToken(tokens.refresh)
      setAuth({ token: tokens.access, user: tokens.user })
      return tokens
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      await api.auth.logout()
      clearTokens()
      await clearStoredRefreshToken()
      clearAuth()
    },
  })
}

export function useSendOTP() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose?: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' }) =>
      api.auth.sendOTP(phone, purpose),
  })
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      api.auth.verifyOTP(phone, code),
  })
}

export function useResendOTP() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose?: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' }) =>
      api.auth.resendOTP(phone, purpose),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (identifier: string) => api.auth.requestPasswordReset(identifier),
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: {
      phone_number: string
      code: string
      new_password: string
      new_password2: string
    }) => api.auth.confirmPasswordReset(data),
  })
}

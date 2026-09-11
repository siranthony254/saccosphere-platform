import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { api, setAccessToken, setRefreshToken, clearTokens } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import type { LoginInput, RegisterInput } from '@saccosphere/schemas'

const REFRESH_TOKEN_KEY = 'saccosphere.refresh_token'

// Web storage note: the access token is intentionally memory-only (see
// useAuthStore.ts) to defend against XSS token theft. The refresh token
// lives in sessionStorage rather than localStorage — it doesn't survive a
// full browser close/reopen and isn't shared across tabs, which narrows the
// window for a stored-XSS payload to exfiltrate/replay it compared to
// localStorage. This is not full at-rest encryption (the web platform has
// no secure key-storage primitive to encrypt against without also exposing
// the key), so a live XSS payload running during an active session can
// still read it — the mitigation here is exposure window, not confidentiality.
// Native builds are unaffected: SecureStore (OS keychain) is used there.

export async function saveRefreshToken(token?: string | null) {
  setRefreshToken(token ?? null)
  if (!token) return clearStoredRefreshToken()

  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
    return
  }

  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
}

export async function loadRefreshToken() {
  const token =
    Platform.OS === 'web'
      ? window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
      : await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  setRefreshToken(token)
  return token
}

export async function clearStoredRefreshToken() {
  setRefreshToken(null)
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    return
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
}

export function useGoogleAuth() {
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (data: { id_token: string; flow: 'login' | 'signup' }) => {
      const tokens = await api.auth.googleAuth(data)
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

/** Attach a Google identity to the already signed-in account. */
export function useLinkGoogle() {
  return useMutation({
    mutationFn: (data: { id_token: string; nonce?: string }) => api.auth.linkGoogle(data),
  })
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
      try {
        const refreshToken = await loadRefreshToken()
        await api.auth.logout(refreshToken || undefined)
      } catch (error) {
        // Ignore 401 errors - token may already be expired
        // Still proceed to clear local state
      }
      clearTokens()
      await clearStoredRefreshToken()
      clearAuth()
    },
  })
}

// Note: OTP send/verify and password-reset/change screens call
// api.auth.sendOTP/verifyOTP/requestPasswordReset/confirmPasswordReset/
// changePassword directly rather than through react-query mutations here —
// this file previously had unused wrapper hooks for all five that were
// removed as dead code (zero call sites).

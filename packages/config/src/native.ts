/**
 * React Native/Expo entrypoint for @saccosphere/config.
 * Uses process.env (Expo automatically exposes EXPO_PUBLIC_* vars).
 */

export * from './shared'

const DEFAULT_API_URL = 'https://saccosphere-production.up.railway.app'

export const getApiUrl = (): string => {
  const env = (globalThis as any).process?.env
  const url = env?.EXPO_PUBLIC_API_URL || env?.API_URL || env?.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  return url
}

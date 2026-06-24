/**
 * Web entrypoint for @saccosphere/config (Vite/React).
 * Uses process.env for environment variables in bundlers that do not support import.meta.
 */

export * from './shared'

const env = (globalThis as any).process?.env as Record<string, string | undefined> | undefined
const DEFAULT_API_URL = 'https://saccosphere-production.up.railway.app'

export const getApiUrl = (): string => {
  const url = env?.EXPO_PUBLIC_API_URL || env?.VITE_API_URL || env?.API_URL || DEFAULT_API_URL
  return url
}

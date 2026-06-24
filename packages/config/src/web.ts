/**
 * Web entrypoint for @saccosphere/config (Vite/React).
 * Uses process.env for environment variables in bundlers that do not support import.meta.
 */

export * from './shared'

const env = (globalThis as any).process?.env as Record<string, string | undefined> | undefined
const DEFAULT_API_URL = 'http://127.0.0.1:8000'

export const getApiUrl = (): string => {
  const url = env?.VITE_API_URL || env?.API_URL || DEFAULT_API_URL
  return url
}

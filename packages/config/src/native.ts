/**
 * React Native/Expo entrypoint for @saccosphere/config.
 *
 * Metro (babel-preset-expo) only inlines `process.env.EXPO_PUBLIC_*` when it
 * appears as a *literal* member expression — not via an alias like
 * `const env = process.env; env.EXPO_PUBLIC_API_URL`. So we must read it
 * directly here, otherwise release (EAS) builds silently fall back to
 * DEFAULT_API_URL and ignore eas.json / .env.
 */

export * from './shared'

const DEFAULT_API_URL = 'https://saccosphere-production-a4cb.up.railway.app'

export const getApiUrl = (): string => {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    process.env.API_URL

  const url = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  return url || DEFAULT_API_URL
}

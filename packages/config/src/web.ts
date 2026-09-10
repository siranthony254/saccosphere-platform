/**
 * Web entrypoint for @saccosphere/config.
 *
 * Loaded by BOTH the Vite admin apps and Expo/Metro when the member app runs
 * on web (`expo start --web`). Constraints:
 *   - Metro emits CommonJS, where the ESM-only meta object is a hard
 *     SyntaxError, so this file must never use it (Vite-only construct).
 *   - Vite does not provide a `process` global, so a bare `process.env.X`
 *     read would throw ReferenceError there — UNLESS the exact token is
 *     replaced at build time. The admin vite.config files `define` every
 *     `process.env.*` token used below, so in a Vite build these become
 *     string literals and no `process` reference survives.
 *   - Metro/Expo does provide `process.env`, so the same tokens read fine
 *     there (and `EXPO_PUBLIC_*` is injected by Expo).
 */

export * from './shared'

const DEFAULT_API_URL = 'https://saccosphere-production-a4cb.up.railway.app'

export const getApiUrl = (): string => {
  const fromEnv =
    process.env.VITE_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.API_URL

  const url = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  return url || DEFAULT_API_URL
}

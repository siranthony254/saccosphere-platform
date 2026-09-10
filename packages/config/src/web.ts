/**
 * Web entrypoint for @saccosphere/config (Vite / React).
 *
 * Vite statically replaces the exact token `import.meta.env.VITE_*` at build
 * time. Reading it through an alias or optional chain defeats that, so
 * production builds would ignore `.env` / Vercel env vars and silently use
 * DEFAULT_API_URL. Reference it directly.
 */

export * from './shared'

const DEFAULT_API_URL = 'https://saccosphere-production-a4cb.up.railway.app'

export const getApiUrl = (): string => {
  let fromEnv: string | undefined

  try {
    // Statically replaced by Vite. Guarded for non-ESM/SSR contexts.
    fromEnv = import.meta.env.VITE_API_URL as string | undefined
  } catch {
    /* import.meta unavailable */
  }

  if (!fromEnv && typeof process !== 'undefined' && process.env) {
    fromEnv = process.env.VITE_API_URL || process.env.API_URL
  }

  const url = typeof fromEnv === 'string' ? fromEnv.trim() : ''
  return url || DEFAULT_API_URL
}

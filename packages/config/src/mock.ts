/**
 * @saccosphere/config/mock
 *
 * Central mock flag reader. Works in both Expo (EXPO_PUBLIC_) and Vite (VITE_) environments.
 * All flags default to false when unset — real API calls are used by default.
 */

const read = (key: string): boolean => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

  const expoVal = env?.[`EXPO_PUBLIC_${key}`]
  const viteVal =
    typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env
      ? (import.meta as { env: Record<string, string> }).env[`VITE_${key}`]
      : undefined

  const val = expoVal ?? viteVal
  return val === 'true'
}

export const MOCK = {
  auth: read('MOCK_AUTH'),
  saccos: read('MOCK_SACCOS'),
  memberships: read('MOCK_MEMBERSHIPS'),
  loans: read('MOCK_LOANS'),
  payments: read('MOCK_PAYMENTS'),
  saccoAdmin: read('MOCK_SACCO_ADMIN'),
  superAdmin: read('MOCK_SUPER_ADMIN'),
} as const

export type MockDomain = keyof typeof MOCK

export const isAnyMockEnabled = (): boolean => Object.values(MOCK).some(Boolean)

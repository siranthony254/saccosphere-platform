/**
 * @saccosphere/config/mock
 *
 * Central mock flag reader. Works in both Expo (EXPO_PUBLIC_) and Vite (VITE_) environments.
 *
 * Usage:
 *   import { MOCK } from '@saccosphere/config/mock'
 *   if (MOCK.loans) { return useMockQuery(...) }
 *
 * To switch a feature to real API calls:
 *   1. Set the corresponding env var to "false" in your .env file
 *   2. Uncomment the real API call in the hook file
 *   3. Done — no component changes needed
 */

const read = (key: string): boolean => {
  // Try Expo prefix first (member app)
  const expoVal =
    typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)[`EXPO_PUBLIC_${key}`]
      : undefined

  // Try Vite prefix (admin portals)
  const viteVal =
    typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string> }).env
      ? (import.meta as { env: Record<string, string> }).env[`VITE_${key}`]
      : undefined

  const val = expoVal ?? viteVal
  return val === 'true'
}

export const MOCK = {
  /** Authentication — login, register, OTP, password reset */
  auth: read('MOCK_AUTH'),

  /** SACCO discovery and configuration */
  saccos: read('MOCK_SACCOS'),

  /** Member dashboard, memberships, transactions, applications */
  memberships: read('MOCK_MEMBERSHIPS'),

  /** Loan applications, guarantors, repayments, comparison */
  loans: read('MOCK_LOANS'),

  /** M-Pesa STK push, payment confirmation */
  payments: read('MOCK_PAYMENTS'),

  /** SACCO admin portal — members, loans, contributions, reports */
  saccoAdmin: read('MOCK_SACCO_ADMIN'),

  /** Saccosphere super admin — all SACCOs, platform metrics, config editor */
  superAdmin: read('MOCK_SUPER_ADMIN'),
} as const

export type MockDomain = keyof typeof MOCK

/**
 * Returns true if ANY mock flag is enabled.
 * Useful for showing a "mock mode" banner in development.
 */
export const isAnyMockEnabled = (): boolean => Object.values(MOCK).some(Boolean)

/**
 * Shared config constants that do not depend on a runtime environment API.
 */

// App error codes. The frontend uses these codes, not error messages, to decide
// what to show. Match these exactly with the Django backend.
export const ErrorCode = {
  // Auth
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_ROLE: 'AUTH_INSUFFICIENT_ROLE',
  AUTH_SACCO_SUSPENDED: 'AUTH_SACCO_SUSPENDED',

  // KYC
  KYC_NOT_VERIFIED: 'KYC_NOT_VERIFIED',

  // Membership
  MEMBERSHIP_NOT_ACTIVE: 'MEMBERSHIP_NOT_ACTIVE',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',

  // Loans
  LOAN_LIMIT_EXCEEDED: 'LOAN_LIMIT_EXCEEDED',
  LOAN_GUARANTORS_INSUFFICIENT: 'LOAN_GUARANTORS_INSUFFICIENT',

  // Payments
  PAYMENT_INITIATION_FAILED: 'PAYMENT_INITIATION_FAILED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// Centralized React Query key factory so invalidation is consistent.
export const QueryKeys = {
  // Member app
  dashboard: () => ['dashboard'] as const,
  saccos: (filters?: object) => ['saccos', filters] as const,
  saccoConfig: (slug: string) => ['sacco-config', slug] as const,
  membership: (id: string) => ['membership', id] as const,
  memberships: () => ['memberships'] as const,
  transactions: (filters?: object) => ['transactions', filters] as const,
  loans: (filters?: object) => ['loans', filters] as const,
  loanDetail: (id: string) => ['loan', id] as const,
  loanComparison: (amount: number, months: number) =>
    ['loan-comparison', amount, months] as const,
  notifications: () => ['notifications'] as const,
  applications: () => ['applications'] as const,
  profile: () => ['profile'] as const,
  kycStatus: () => ['kyc-status'] as const,
  paymentStatus: (reference: string) => ['payment-status', reference] as const,
  guarantorSearch: (loanId: string, query: string) => ['guarantor-search', loanId, query] as const,

  // SACCO admin
  saccoAdminDashboard: () => ['sacco-admin-dashboard'] as const,
  adminMembers: (filters?: object) => ['admin-members', filters] as const,
  adminMember: (id: string) => ['admin-member', id] as const,
  adminLoans: (filters?: object) => ['admin-loans', filters] as const,
  adminApplications: () => ['admin-applications'] as const,
  adminContributions: (filters?: object) => ['admin-contributions', filters] as const,

  // Super admin
  platformOverview: () => ['platform-overview'] as const,
  allSaccos: (filters?: object) => ['all-saccos', filters] as const,
  superSaccoDetail: (id: string) => ['super-sacco', id] as const,
  allMembers: (filters?: object) => ['all-members', filters] as const,
  platformTransactions: (filters?: object) => ['platform-transactions', filters] as const,
  revenue: (period?: string) => ['revenue', period] as const,
  amlFlags: () => ['aml-flags'] as const,
} as const

export const PLATFORM_NAME = 'Saccosphere'
export const SUPPORT_EMAIL = 'support@saccosphere.co.ke'

// Stale times (ms), how long React Query considers data fresh.
export const STALE_TIMES = {
  dashboard: 60_000,
  saccoConfig: 300_000,
  transactions: 30_000,
  adminDashboard: 30_000,
  platformOverview: 60_000,
  notifications: 0,
  profile: 60_000,
  kycStatus: 30_000,
  paymentStatus: 15_000,
} as const


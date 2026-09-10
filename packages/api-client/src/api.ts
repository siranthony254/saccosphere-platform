
import { apiCall, axiosInstance, setAccessToken } from './core'
import type {
  LoginInput,
  RegisterInput,
  User,
  Sacco,
  Membership,
  MembershipApplication,
  LoanApplication,
  LoanApplicationInput,
  LoanComparisonItem,
  Transaction,
  Notification as AppNotification,
  STKPushInput,
  STKPushResponse,
  SaccoAdminDashboard,
  AdminMember,
  AdminLoan,
  SuperAdminSacco,
} from '@saccosphere/schemas'
import {
  AuthTokensSchema,
  DashboardSchema,
  LoanApplicationSchema,
  MembershipSchema,
  NotificationSchema,
  RegisterInputSchema,
  SaccoConfigSchema,
  SaccoAdminDashboardSchema,
  SaccoSchema,
  STKPushInputSchema,
  AdminMemberSchema,
  AdminLoanSchema,
  SuperAdminSaccoSchema,
  TransactionSchema,
  UserSchema,
  RevenueChartSchema,
  TopSaccosSchema,
  PlatformAlertSchema,
} from '@saccosphere/schemas'

import { z } from 'zod'

const RefreshResponseSchema = z.object({
  access: z.string(),
  refresh: z.string().optional(),
})
const PasswordResetResponseSchema = z.object({ message: z.string() })
const PasswordResetConfirmResponseSchema = z.object({ reset_token: z.string() })
const OTPResponseSchema = z.object({ message: z.string() })

// Version stamped on consent records the member app collects. Bump when the
// terms / privacy copy shown in the app materially changes.
const CONSENT_VERSION = 'v1.0'
const KycDocumentTypeSchema = z.enum(['id_front', 'id_back', 'passport', 'huduma'])
type KycDocumentType = z.infer<typeof KycDocumentTypeSchema>
type KycUploadFile = Blob | {
  uri: string
  name: string
  type: string
  file?: Blob
}

const parseInput = <T>(schema: z.ZodType<T>, data: unknown): T => schema.parse(data)
const uuid = (value: string) => z.string().uuid().parse(value)
const isUuid = (value: string) => z.string().uuid().safeParse(value).success
const requiredString = (value: string) => z.string().min(1).parse(value)
const unwrapResults = <T>(value: T[] | PaginatedResponse<T>): T[] =>
  Array.isArray(value) ? value : value.results

// Shared invoice shape for both consoles. No invoice endpoint returns a SACCO
// name, so callers can only attribute rows by filtering on ?sacco_id=.
const normalizeInvoice = (item: any) => ({
  id: String(item.id),
  invoice_number: item.invoice_number ?? '',
  period: item.billing_month ?? item.period ?? '',
  amount: Number(item.total_amount ?? item.amount ?? 0),
  status: String(item.status ?? 'pending').toLowerCase(),
  due_date: item.due_date ?? '',
  sent_at: item.sent_at ?? null,
  paid_date: item.paid_at ?? item.paid_date ?? null,
  line_items_count: Number(item.line_items_count ?? 0),
  days_overdue: Number(item.days_overdue ?? 0),
  pdf_url: item.pdf_url ?? '',
})

const normalizeStkPushResponse = (payload: any): STKPushResponse => ({
  checkout_request_id: String(payload.checkout_request_id ?? ''),
  merchant_request_id: payload.merchant_request_id ?? undefined,
  transaction_id: payload.transaction_id ?? undefined,
  message: String(payload.message ?? 'Check your phone to enter your M-Pesa PIN.'),
})


const normalizeUser = (user: any, roleOverrides?: { role?: User['role']; sacco_id?: string | null; sacco_slug?: string | null }): User => {
  const createdAt = user.created_at ?? user.date_joined ?? new Date().toISOString()
  const kycStatus = String(user.kyc_status ?? user.status ?? 'not_started').toLowerCase()

  // Map backend roles (uppercase) to frontend roles (lowercase)
  const rawRole = (roleOverrides?.role ?? user.role ?? 'member').toLowerCase()
  let role: User['role'] = 'member'
  if (rawRole === 'superadmin' || rawRole === 'super_admin') role = 'superadmin'
  else if (rawRole === 'sacco_admin') role = 'sacco_admin'
  else if (rawRole === 'member') role = 'member'

  return UserSchema.parse({
    ...user,
    phone: user.phone ?? user.phone_number ?? '',
    phone_number: user.phone_number ?? user.phone ?? '',
    role,
    kyc_status: kycStatus === 'approved' ? 'verified' : kycStatus,
    iprs_verified: Boolean(user.iprs_verified),
    national_id: user.national_id ?? null,
    sacco_id: roleOverrides?.sacco_id ?? user.sacco_id ?? null,
    sacco_slug: roleOverrides?.sacco_slug ?? user.sacco_slug ?? null,
    created_at: createdAt,
  })
}


const normalizeKenyanPhoneNumber = (phone: string) => {
  let cleaned = String(phone).trim().replace(/[\s-()]+/g, '')

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }

  // Remove non-digits
  cleaned = cleaned.replace(/[^0-9]/g, '')

  // Handle 25407... or 2547...
  if (cleaned.startsWith('254')) {
    const rest = cleaned.slice(3)
    if (rest.startsWith('0')) {
      return `+254${rest.slice(1)}`
    }
    return `+254${rest}`
  }

  // Handle 07...
  if (cleaned.startsWith('0')) {
    return `+254${cleaned.slice(1)}`
  }

  // Handle 7...
  if (cleaned.length === 9) {
    return `+254${cleaned}`
  }

  return `+${cleaned}`
}

const normalizeSacco = (sacco: any): Sacco => {
  const membershipType = String(sacco.membership_type ?? (sacco.membership_open === false ? 'closed' : 'open')).toLowerCase()
  const slug =
    sacco.slug ??
    String(sacco.name ?? sacco.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const rawLogoUrl = sacco.logo_url ?? sacco.logo
  const logo_url = rawLogoUrl && typeof rawLogoUrl === 'string' && rawLogoUrl.trim() !== '' ? rawLogoUrl : undefined

  return SaccoSchema.parse({
    ...sacco,
    id: String(sacco.id),
    slug,
    initials:
      sacco.initials ??
      String(sacco.name ?? 'SA')
        .split(/\s+/)
        .map((part: string) => part[0])
        .join('')
        .slice(0, 3)
        .toUpperCase(),
    color: sacco.color ?? '#6D28D9',
    membership_type: membershipType === 'closed' ? 'invitation_only' : membershipType,
    status: String(sacco.status ?? (sacco.is_active === false ? 'suspended' : 'active')).toLowerCase(),
    sasra_reg_no: sacco.sasra_reg_no ?? '',
    sector: sacco.sector ?? 'SACCO',
    county: sacco.county ?? '',
    logo_url,
    member_count: Number(sacco.member_count ?? 0),
    default_interest_rate: Number(sacco.default_interest_rate ?? sacco.loan_rate_pct ?? 0),
    loan_multiplier: Number(sacco.loan_multiplier ?? 0),
    description: sacco.description ?? undefined,
    established_year: sacco.established_year != null ? Number(sacco.established_year) : undefined,
    min_age: sacco.min_age != null ? Number(sacco.min_age) : undefined,
    min_monthly_contribution: sacco.min_monthly_contribution != null ? Number(sacco.min_monthly_contribution) : undefined,
    registration_fee: sacco.registration_fee != null ? Number(sacco.registration_fee) : undefined,
    min_share_capital: sacco.min_share_capital != null ? Number(sacco.min_share_capital) : undefined,
    membership_open: sacco.membership_open ?? sacco.is_open_to_new_members ?? undefined,
    application_review_days: sacco.application_review_days ?? undefined,
  })
}

const normalizeSuperAdminSacco = (sacco: any): SuperAdminSacco => {
  const base = normalizeSacco(sacco)
  const status = String(sacco.status ?? (sacco.is_active === false ? 'suspended' : 'active')).toLowerCase()
  const healthStatus = String(sacco.health_status ?? 'GOOD').toUpperCase()
  const normalizedHealthStatus = healthStatus === 'API_ISSUE' || healthStatus === 'REVIEW' ? healthStatus : 'GOOD'

  return SuperAdminSaccoSchema.parse({
    id: base.id,
    slug: base.slug,
    name: base.name,
    sector: base.sector ?? 'unknown',
    initials: base.initials,
    color: base.color,
    sasra_reg_no: base.sasra_reg_no,
    status: status === 'suspended' ? 'suspended' : 'active',
    is_active: sacco.is_active ?? true,
    member_count: Number(base.member_count ?? 0),
    members_on_app: Number(base.member_count ?? 0),
    health_status: normalizedHealthStatus,
    health: normalizedHealthStatus === 'GOOD' ? 'healthy' : normalizedHealthStatus === 'API_ISSUE' ? 'critical' : 'warning',
    joined_platform_at: (base as Sacco & { created_at?: string }).created_at ?? new Date().toISOString(),
    created_at: (base as Sacco & { created_at?: string }).created_at ?? new Date().toISOString(),
    last_transaction_at: sacco.last_transaction_at ?? null,
  })
}

const normalizeMembership = (membership: any): Membership => {
  const sacco = membership.sacco ?? {}
  const status = String(membership.status ?? 'applied').toLowerCase()
  const normalizedStatus =
    status === 'pending' || status === 'submitted'
      ? 'under_review'
      : status === 'approved'
        ? 'active'
        : status === 'rejected' || status === 'left'
          ? 'withdrawn'
          : status

  // Extract sacco_id - handle all possible formats
  let saccoId = membership.sacco_id
  if (!saccoId && typeof sacco === 'object' && sacco.id) {
    saccoId = sacco.id
  }
  if (!saccoId) {
    saccoId = membership.id
  }
  // Convert to string, handling nested objects
  if (typeof saccoId === 'object') {
    saccoId = saccoId.id ?? saccoId.uuid ?? JSON.stringify(saccoId)
  }
  const saccoIdStr = String(saccoId ?? '')

  // Handle applied_at - ensure valid datetime format
  let appliedAt = membership.applied_at ?? membership.application_date
  if (!appliedAt || typeof appliedAt !== 'string') {
    appliedAt = new Date().toISOString()
  } else if (!appliedAt.includes('T') && !appliedAt.includes('Z')) {
    // Try to parse non-ISO dates
    const parsed = new Date(appliedAt)
    appliedAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
  }

  return MembershipSchema.parse({
    id: membership.id,
    sacco_id: saccoIdStr,
    sacco_slug:
      membership.sacco_slug ??
      String(sacco.name ?? membership.sacco_name ?? membership.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    sacco_name: membership.sacco_name ?? sacco.name ?? 'SACCO',
    sacco_color: membership.sacco_color ?? '#6D28D9',
    sacco_initials:
      membership.sacco_initials ??
      String(sacco.name ?? membership.sacco_name ?? 'SA')
        .split(/\s+/)
        .map((part: string) => part[0])
        .join('')
        .slice(0, 3)
        .toUpperCase(),
    member_number: membership.member_number ?? '',
    status: normalizedStatus,
    bosa_balance: Number(membership.bosa_balance ?? 0),
    fosa_balance: Number(membership.fosa_balance ?? 0),
    share_capital: Number(membership.share_capital ?? 0),
    total_dividends: Number(membership.total_dividends ?? 0),
    monthly_contribution: Number(membership.monthly_contribution ?? 0),
    loan_limit: Number(membership.loan_limit ?? 0),
    joined_at: membership.joined_at ?? membership.approved_date ?? null,
    applied_at: appliedAt,
  })
}

const normalizeAdminDashboard = (dashboard: any): SaccoAdminDashboard => {
  return SaccoAdminDashboardSchema.parse({
    total_members: Number(dashboard.total_members ?? 0),
    total_savings_kes: Number(dashboard.total_savings_portfolio ?? 0),
    active_loans_count: Number(dashboard.active_loans_count ?? 0),
    active_loans_kes: Number(dashboard.total_loans_portfolio ?? dashboard.active_loans_portfolio ?? 0),
    default_rate_pct: Number(dashboard.default_rate ?? dashboard.default_rate_pct ?? 0),
    contributions_mtd_kes: Number(dashboard.monthly_contributions ?? 0),
    pending_applications: Number(dashboard.pending_applications ?? 0),
    pending_loan_approvals: Number(dashboard.pending_loan_approvals ?? 0),
    members_in_arrears: Number(dashboard.default_count ?? 0),
  })
}

const normalizeAdminMember = (member: any): AdminMember => {
  const user = member.user ?? member
  const fullName = String(user.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ')).trim()
  const [first_name, ...rest] = fullName.split(' ')
  const last_name = rest.join(' ') || (user.last_name || first_name)
  const statusMap: Record<string, AdminMember['membership_status']> = {
    PENDING: 'applied',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'active',
    REJECTED: 'withdrawn',
    SUSPENDED: 'suspended',
    LEFT: 'withdrawn',
  }
  const kycStatus = String(user.kyc_status ?? member.kyc_status ?? 'pending').toLowerCase()
  const membershipStatus = statusMap[String(member.status ?? user.status ?? 'PENDING').toUpperCase()] ?? 'applied'
  const recentTransactions = Array.isArray(member.recent_transactions) ? member.recent_transactions : []
  const savingsBreakdown = Array.isArray(member.savings_breakdown) ? member.savings_breakdown : []
  const activeLoans = Array.isArray(member.active_loans) ? member.active_loans : []

  return AdminMemberSchema.parse({
    id: String(member.id ?? user.id ?? ''),
    user_id: member.user?.id ? String(member.user.id) : member.user_id ? String(member.user_id) : user.id ? String(user.id) : null,
    saccosphere_id: member.member_number ? `SS-${member.member_number}` : String(member.id ?? ''),
    member_number: String(member.member_number ?? user.member_number ?? ''),
    first_name: String(first_name || user.first_name || ''),
    last_name: String(last_name || user.last_name || ''),
    email: String(user.email ?? member.email ?? ''),
    phone: String(user.phone_number ?? user.phone ?? member.phone_number ?? member.phone ?? ''),
    national_id: user.national_id ?? member.national_id ?? null,
    kyc_status:
      kycStatus === 'verified' || kycStatus === 'approved'
        ? 'verified'
        : kycStatus === 'rejected'
          ? 'rejected'
          : kycStatus === 'under_review'
            ? 'under_review'
            : 'pending',
    membership_status: membershipStatus,
    bosa_balance: Number(member.savings_total ?? member.bosa_balance ?? 0),
    fosa_balance: Number(member.fosa_balance ?? 0),
    share_capital: Number(member.share_capital ?? 0),
    active_loans_count: Number(activeLoans.length ?? member.active_loans_count ?? 0),
    active_loans_kes: Number(member.outstanding_loans ?? member.active_loans_kes ?? 0),
    monthly_contribution: Number(member.monthly_contribution ?? 0),
    repayment_rate_pct: Number(member.repayment_rate_pct ?? 0),
    joined_at: member.approved_date ?? member.application_date ?? member.joined_at ?? null,
    last_active: recentTransactions[0]?.created_at ?? null,
    // Backend AdminMemberDetailSerializer fields
    sacco: member.sacco ? { id: String(member.sacco.id), name: member.sacco.name } : null,
    application_date: member.application_date ?? null,
    approved_date: member.approved_date ?? null,
    savings_breakdown: savingsBreakdown.map((s: any) => ({
      savings_type: s.savings_type,
      amount: Number(s.amount ?? 0),
      total_contributions: Number(s.total_contributions ?? 0),
      total_withdrawals: Number(s.total_withdrawals ?? 0),
      status: s.status,
    })),
    active_loans: activeLoans.map((l: any) => ({
      id: String(l.id),
      loan_type: l.loan_type,
      amount: Number(l.amount ?? 0),
      interest_rate: Number(l.interest_rate ?? 0),
      term_months: l.term_months,
      outstanding_balance: Number(l.outstanding_balance ?? 0),
      status: l.status,
      created_at: l.created_at,
    })),
    recent_transactions: recentTransactions.map((t: any) => ({
      id: String(t.id),
      reference: t.reference,
      transaction_type: t.transaction_type,
      amount: Number(t.amount ?? 0),
      status: t.status,
      description: t.description,
      created_at: t.created_at,
    })),
  })
}

const normalizeAdminLoan = (loan: any): AdminLoan => {
  const membership = loan.membership ?? {}
  const user = membership.user ?? loan.user ?? {}
  const fullName = String(user.full_name ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim())
  const statusMap: Record<string, AdminLoan['status']> = {
    pending: 'submitted',
    submitted: 'submitted',
    guarantors_pending: 'guarantors_pending',
    under_review: 'under_review',
    board_review: 'under_review',
    approved: 'approved',
    rejected: 'rejected',
    disbursed: 'disbursed',
    active: 'disbursed',
    closed: 'closed',
    completed: 'closed',
  }
  const rawStatus = String(loan.status ?? 'pending').toLowerCase()

  return AdminLoanSchema.parse({
    id: loan.id,
    ref: loan.reference ?? loan.id,
    member_name: fullName || 'Unknown member',
    member_number: membership.member_number ?? '',
    member_id: membership.id ?? membership.user_id ?? user.id ?? loan.id,
    loan_product_label: loan.loan_type?.name ?? loan.loan_type ?? 'Loan',
    amount_requested: Number(loan.amount ?? 0),
    period_months: Number(loan.term_months ?? 0),
    interest_rate: Number(loan.interest_rate ?? 0),
    monthly_instalment: Number(loan.monthly_instalment ?? 0),
    status: statusMap[rawStatus] ?? 'submitted',
    guarantors_confirmed: Number(loan.guarantors_confirmed ?? loan.confirmed_guarantors ?? 0),
    guarantors_required: Number(loan.guarantors_required ?? loan.min_guarantors ?? 0),
    disbursement_method: 'mpesa',
    disbursement_account: loan.disbursement_account ?? '',
    submitted_at: loan.created_at ?? new Date().toISOString(),
    approved_at: loan.approved_at ?? null,
    disbursed_at: loan.disbursement_date ?? null,
  })
}


const normalizeTransaction = (item: any): Transaction => {
  const rawType = String(item.txn_type ?? item.transaction_type ?? item.type ?? 'contribution').toLowerCase()
  const txnType =
    rawType === 'saving_deposit' || rawType === 'deposit'
      ? 'contribution'
      : rawType === 'registration'
        ? 'registration_fee'
        : rawType
  const amount = Number(item.amount ?? 0)

  const providerName = String(item.provider_name ?? item.provider?.name ?? item.payment_method ?? '').toLowerCase()
  const paymentMethod = providerName.includes('m-pesa') || providerName.includes('mpesa')
    ? 'mpesa'
    : String(item.payment_method ?? 'internal').toLowerCase()

  return {
    id: item.id,
    ref: item.ref ?? item.reference ?? item.id,
    description: item.description ?? item.narration ?? String(txnType).replace(/_/g, ' '),
    txn_type: TransactionSchema.shape.txn_type.parse(txnType),
    amount,
    direction: item.direction ?? (amount < 0 ? 'debit' : 'credit'),
    status: TransactionSchema.shape.status.parse(String(item.status ?? 'completed').toLowerCase()),
    payment_method: TransactionSchema.shape.payment_method.parse(paymentMethod),
    payment_ref: item.payment_ref ?? item.external_reference ?? null,
    platform_fee: Number(item.platform_fee ?? item.fee_amount ?? 0),
    balance_after: Number(item.balance_after ?? 0),
    sacco_name: item.sacco_name ?? item.sacco?.name ?? '',
    sacco_slug:
      item.sacco_slug ??
      String(item.sacco_name ?? item.sacco?.name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    date: item.date ?? item.created_at ?? item.completed_at ?? new Date().toISOString(),
    completed_at: item.completed_at ?? item.created_at ?? null,
  }
}

const normalizeLoanStatus = (status: unknown): LoanApplication['status'] => {
  const normalized = String(status ?? 'PENDING').toLowerCase()
  const statusMap: Record<string, LoanApplication['status']> = {
    pending: 'submitted',
    guarantors_pending: 'guarantors_pending',
    pending_approval: 'under_review',
    board_review: 'under_review',
    approved: 'approved',
    disbursement_pending: 'disbursement_pending',
    disbursed: 'disbursed',
    active: 'active',
    completed: 'closed',
    rejected: 'rejected',
    defaulted: 'defaulted',
  }
  return statusMap[normalized] ?? 'submitted'
}

const normalizeSaving = (saving: any) => ({
  id: String(saving.id),
  membership_id: String(saving.membership?.id ?? ''),
  sacco_id: String(saving.membership?.sacco_id ?? saving.membership?.sacco?.id ?? ''),
  sacco_name: String(saving.membership?.sacco_name ?? saving.membership?.sacco?.name ?? ''),
  savings_type: String(saving.savings_type?.name ?? saving.savings_type ?? 'Savings'),
  amount: Number(saving.amount ?? 0),
  total_contributions: Number(saving.total_contributions ?? 0),
  total_withdrawals: Number(saving.total_withdrawals ?? 0),
  status: String(saving.status ?? '').toLowerCase(),
})


export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

//  AUTH 

export const api = {
  auth: {
    login: async (data: LoginInput) => {
      const payload = await apiCall<any>('POST', '/accounts/login/', {
        email: data.email,
        password: data.password,
      })

      setAccessToken(payload.access)

      // Fetch KYC status immediately after login to ensure store accuracy
      const kyc = await apiCall<any>('GET', '/accounts/kyc/status/').catch(() => ({ status: 'not_started' }))

      return AuthTokensSchema.parse({
        access: payload.access,
        refresh: payload.refresh,
        user: normalizeUser({ ...payload.user, kyc_status: kyc.status }),
      })
    },

    googleAuth: async (data: { token?: string; id_token?: string; code?: string; flow: 'login' | 'signup' }) => {
      const payload = await apiCall<any>('POST', '/accounts/oauth/google/callback/', {
        code: data.code || data.token || data.id_token,
        flow: data.flow,
      })

      setAccessToken(payload.access)

      // Fetch KYC status immediately after login
      const kyc = await apiCall<any>('GET', '/accounts/kyc/status/').catch(() => ({ status: 'not_started' }))

      return AuthTokensSchema.parse({
        access: payload.access,
        refresh: payload.refresh,
        user: normalizeUser({ ...payload.user, kyc_status: kyc.status }),
      })
    },


    register: async (data: RegisterInput) => {
      const input = parseInput(RegisterInputSchema, data)
      const normalizedPhone = normalizeKenyanPhoneNumber(input.phone_number)
      const user = await apiCall<any>('POST', '/accounts/register/', {
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone_number: normalizedPhone,
        password: input.password,
        password2: input.password2,
      })
      const tokens = await apiCall<any>('POST', '/accounts/login/', {
        email: input.email,
        password: input.password,
      })
      setAccessToken(tokens.access)
      return AuthTokensSchema.parse({
        access: tokens.access,
        refresh: tokens.refresh,
        user: normalizeUser(tokens.user ?? user),
      })
    },

    refresh: (refresh?: string) =>
      apiCall<{ access: string }>('POST', '/accounts/token/refresh/', refresh ? { refresh } : undefined, {
        responseSchema: RefreshResponseSchema,
      }),

    logout: (refreshToken?: string) =>
      apiCall<void>('POST', '/accounts/logout/', refreshToken ? { refresh: refreshToken } : undefined),

    sendOTP: (phone: string, options?: { purpose?: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN'; channel?: 'PHONE' | 'EMAIL' }) => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/send/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          purpose: z.enum(['PHONE_VERIFY', 'PASSWORD_RESET', 'LOGIN']).parse(options?.purpose ?? 'PHONE_VERIFY'),
          channel: z.enum(['PHONE', 'EMAIL']).parse(options?.channel ?? 'PHONE'),
        },
        {
          responseSchema: OTPResponseSchema,
        }
      )
    },

    verifyOTP: async (phone: string, code: string, options?: { purpose?: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' }) => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/verify/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          code: z.string().length(6).parse(code),
          purpose: z.enum(['PHONE_VERIFY', 'PASSWORD_RESET', 'LOGIN']).parse(options?.purpose ?? 'PHONE_VERIFY'),
        },
        { responseSchema: OTPResponseSchema }
      )
    },

    resendOTP: (phone: string, options?: { purpose?: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN'; channel?: 'PHONE' | 'EMAIL' }) => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/resend/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          purpose: z.enum(['PHONE_VERIFY', 'PASSWORD_RESET', 'LOGIN']).parse(options?.purpose ?? 'PHONE_VERIFY'),
          channel: z.enum(['PHONE', 'EMAIL']).parse(options?.channel ?? 'PHONE'),
        },
        { responseSchema: OTPResponseSchema }
      )
    },

    requestPasswordReset: (emailOrPhone: string) =>
      apiCall<{ message: string }>(
        'POST',
        '/accounts/password/reset/request/',
        {
          phone_number: z.string().min(10).parse(normalizeKenyanPhoneNumber(emailOrPhone)),
        },
        { responseSchema: PasswordResetResponseSchema }
      ),

    // Backend splits this into two calls: `confirm/` verifies the OTP and hands
    // back a short-lived `reset_token`, then `complete/` sets the new password.
    confirmPasswordReset: async (data: {
      phone_number: string
      code: string
      new_password: string
      new_password2: string
    }) => {
      const phone_number = z.string().min(10).parse(normalizeKenyanPhoneNumber(data.phone_number))
      const code = z.string().length(6).parse(data.code)
      const new_password = z.string().min(8).parse(data.new_password)
      const new_password2 = z.string().min(8).parse(data.new_password2)

      const { reset_token } = await apiCall<{ reset_token: string }>(
        'POST',
        '/accounts/password/reset/confirm/',
        { phone_number, code },
        { responseSchema: PasswordResetConfirmResponseSchema }
      )

      return apiCall<{ message: string }>(
        'POST',
        '/accounts/password/reset/complete/',
        { reset_token, new_password, new_password2 },
        { responseSchema: PasswordResetResponseSchema }
      )
    },

    changePassword: (data: {
      old_password: string
      new_password: string
      new_password2: string
    }) =>
      apiCall<{ message: string }>(
        'POST',
        '/accounts/password/change/',
        {
          old_password: z.string().min(6).parse(data.old_password),
          new_password: z.string().min(6).parse(data.new_password),
          new_password2: z.string().min(6).parse(data.new_password2),
        },
        { responseSchema: PasswordResetResponseSchema }
      ),

    registerDevice: (data: { device_id: string; platform: 'ios' | 'android'; device_name?: string; push_token?: string; biometric_enabled: boolean }) =>
      apiCall<any>('POST', '/accounts/device/register/', data),

    getDevices: () =>
      apiCall<any[]>('GET', '/accounts/devices/'),

    revokeDevice: (deviceId: string) =>
      apiCall<void>('DELETE', `/accounts/device/${deviceId}/`),

    // Attach a Google identity to the already-authenticated account.
    linkGoogle: (data: { id_token: string; nonce?: string }) =>
      apiCall<{ message?: string; email?: string }>('POST', '/accounts/oauth/google/link/', {
        id_token: data.id_token,
        ...(data.nonce ? { nonce: data.nonce } : {}),
      }),
  },

  // ─── ACCOUNT / PRIVACY (ODPC) ──────────────────────────────────────────────

  account: {
    // Current consent status for every consent type (backend returns a plain
    // array, one row per type, with a `never_given` placeholder where none
    // has been recorded).
    getConsents: () =>
      apiCall<Array<{
        id?: string
        consent_type: string
        consent_type_display?: string
        version: string | null
        consented: boolean
        status?: string
        timestamp?: string
      }>>('GET', '/accounts/consents/list/'),

    getConsentHistory: () =>
      apiCall<Array<{
        id: string
        consent_type: string
        consent_type_display?: string
        version: string
        consented: boolean
        status?: string
        timestamp: string
      }>>('GET', '/accounts/consents/history/'),

    giveConsent: (data: { consent_type: string; consented: boolean; version?: string }) =>
      apiCall<any>('POST', '/accounts/consents/', {
        consent_type: data.consent_type,
        consented: data.consented,
        version: data.version ?? CONSENT_VERSION,
      }),

    withdrawConsent: (consentType: string) =>
      apiCall<any>('POST', `/accounts/consents/${encodeURIComponent(consentType)}/withdraw/`),

    // Downloadable JSON: the user's consent history + the ODPC audit-log
    // entries recorded about them. Returned inside the standard envelope.
    exportMyData: () =>
      apiCall<{
        exported_at: string
        consents: { count: number; results: any[] }
        audit_logs: { count: number; results: any[] }
      }>('GET', '/accounts/consents/export/'),

    // Right-to-erasure. Returns immediately when no regulatory/dispute hold
    // applies, otherwise the request is queued (`status` reflects which).
    requestDataErasure: (reason: string) =>
      apiCall<{ id: string; status: string; message?: string; hold_reason?: string | null; hold_until?: string | null }>(
        'POST',
        '/accounts/me/erasure-requests/',
        { reason: z.string().min(1).parse(reason) }
      ),
  },

  //  MEMBER PROFILE and DASHBOARD

  member: {
    getProfile: async () => {
      const [user, kyc] = await Promise.all([
        apiCall<any>('GET', '/accounts/me/'),
        apiCall<any>('GET', '/accounts/kyc/status/').catch(() => ({ status: 'not_started' })),
      ])
      return normalizeUser({ ...user, kyc_status: kyc.status })
    },


    updateProfile: (data: Partial<User>) =>
      apiCall<User>('PATCH', '/accounts/me/', data, { responseSchema: UserSchema }),

    getDashboard: async () => {
      const portfolio = await apiCall<any>('GET', '/dashboard/portfolio/')
      const memberships = await api.member.getMemberships()

      const totalSavings = Number(portfolio.total_savings ?? 0)
      const shareCapital = Number(portfolio.total_share_capital ?? 0)

      return DashboardSchema.parse({
        total_balance: totalSavings + shareCapital,
        total_savings: totalSavings,
        active_loans_balance: Number(portfolio.total_active_loans ?? 0),
        sacco_count: Number(portfolio.total_saccos ?? memberships.length),
        memberships,
        recent_transactions: (portfolio.recent_transactions ?? []).map(normalizeTransaction),
      })
    },


    getMemberships: async () => {
      const [membershipsResp, portfolio] = await Promise.all([
        apiCall<any[] | PaginatedResponse<any>>('GET', '/members/memberships/'),
        apiCall<any>('GET', '/dashboard/portfolio/').catch(() => ({ saccos: [] })),
      ])

      const memberships = unwrapResults(membershipsResp)
      const portfolioSaccos = portfolio.saccos ?? []

      return memberships.map((m: any) => {
        const saccoInfo = portfolioSaccos.find((s: any) => s.sacco_id === String(m.sacco?.id ?? m.sacco))
        return normalizeMembership({
          ...m,
          bosa_balance: saccoInfo?.bosa_total ?? 0,
          fosa_balance: saccoInfo?.fosa_total ?? 0,
          share_capital: saccoInfo?.share_capital_total ?? 0,
          loan_limit: saccoInfo?.loan_limit ?? 0, 
        })
      })
    },


    getMembership: async (id: string) => {
      const membership = await apiCall<any>('GET', `/members/memberships/${uuid(id)}/`)
      const saccoId = membership.sacco?.id ?? (typeof membership.sacco === 'string' ? membership.sacco : null)
      const isApproved = String(membership.status ?? '').toUpperCase() === 'APPROVED'

      // /services/savings/breakdown/ and /services/loans/eligibility/ both
      // require an APPROVED membership — for a pending application they 400/404,
      // so skip them rather than swallow the errors and show misleading zeros.
      if (!saccoId || !isApproved) {
        return normalizeMembership({
          ...membership,
          bosa_balance: 0,
          fosa_balance: 0,
          share_capital: membership.share_capital ?? 0,
          loan_limit: 0,
        })
      }

      const [breakdown, eligibility] = await Promise.all([
        apiCall<any>('GET', '/services/savings/breakdown/', undefined, { params: { sacco_id: String(saccoId) } }).catch(() => null),
        apiCall<any>('GET', '/services/loans/eligibility/', undefined, { params: { sacco_id: String(saccoId) } }).catch(() => null),
      ])

      const bd = breakdown?.data ?? breakdown ?? {}

      return normalizeMembership({
        ...membership,
        bosa_balance: bd.bosa_total ?? 0,
        fosa_balance: bd.fosa_total ?? 0,
        share_capital: bd.share_capital_total ?? 0,
        loan_limit: eligibility?.max_amount ?? 0,
      })
    },


    leaveMembership: async (id: string) =>
      apiCall<void>('POST', `/members/memberships/${uuid(id)}/leave/`),

    getTransactions: async (params?: {
      sacco?: string
      type?: string
      from?: string
      to?: string
    }) => {
      // TransactionListView ignores every query param and returns all of the
      // user's transactions, so filter the normalised results client-side to
      // honour the requested view.
      const response = await apiCall<PaginatedResponse<any>>('GET', '/payments/transactions/')
      let results = unwrapResults(response).map(normalizeTransaction)

      if (params?.sacco) {
        const key = params.sacco.toLowerCase()
        results = results.filter(
          (t) => t.sacco_slug === key || t.sacco_name.toLowerCase() === key
        )
      }
      if (params?.type) {
        const wanted = params.type.toLowerCase()
        results = results.filter((t) => t.txn_type.toLowerCase() === wanted)
      }
      if (params?.from) {
        const fromMs = new Date(params.from).getTime()
        if (!Number.isNaN(fromMs)) results = results.filter((t) => new Date(t.date).getTime() >= fromMs)
      }
      if (params?.to) {
        const toMs = new Date(params.to).getTime()
        if (!Number.isNaN(toMs)) results = results.filter((t) => new Date(t.date).getTime() <= toMs)
      }

      return { ...response, count: results.length, results }
    },

    getTransaction: async (id: string) => {
      const t = await apiCall<any>('GET', `/payments/transactions/${uuid(id)}/`)
      return normalizeTransaction(t)
    },

    getSaccoFields: async (saccoId: string) =>
      apiCall<any>('GET', `/members/saccos/${saccoId}/fields/`),

    getStatement: async (params: { sacco_id: string; from_date: string; to_date: string }) =>
      apiCall<{
        member_name: string
        member_number: string
        sacco_name: string
        from_date: string
        to_date: string
        opening_balance: number
        closing_balance: number
        total_credits: number
        total_debits: number
        entries: any[]
        currency: string
      }>('GET', '/ledger/statement/', undefined, { params }),

    downloadStatementPdf: async (params: { sacco_id: string; from_date: string; to_date: string }) => {
      const response = await axiosInstance.get('/ledger/statement/pdf/', {
        params,
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `statement_${params.from_date}_${params.to_date}.pdf`,
      }
    },

    // The backend has no member-scoped dividend endpoint (the payouts view is
    // SACCO-admin only). A member's actual received dividends land as CREDIT
    // ledger entries with category DIVIDEND_PAYOUT (see DividendDisburseView),
    // which /ledger/entries/ exposes per approved membership. Aggregate those
    // across the member's SACCOs. Only the net amount that was credited is
    // available here — gross / withholding-tax / rate / share-capital breakdown
    // lives on the admin-only payout records.
    getDividendPayouts: async () => {
      const memberships = await api.member.getMemberships().catch(() => [])
      const active = memberships.filter((m) => m.status === 'active' && !!m.sacco_id)

      const byMembership = await Promise.all(
        active.map((m) =>
          api.member
            .getEntries({ sacco_id: m.sacco_id, category: 'DIVIDEND_PAYOUT' })
            .then((entries) =>
              (entries as any[]).map((entry) => {
                const disbursed_at: string | null = entry.created_at ?? null
                const yearMatch = String(entry.description ?? '').match(/(\d{4})(?!.*\d{4})/)
                return {
                  id: String(entry.id),
                  sacco_name: m.sacco_name,
                  financial_year: yearMatch
                    ? Number(yearMatch[1])
                    : disbursed_at
                      ? new Date(disbursed_at).getFullYear()
                      : new Date().getFullYear(),
                  net_dividend: Number(entry.amount ?? 0),
                  reference: String(entry.reference ?? ''),
                  disbursed_at,
                  status: 'DISBURSED' as const,
                }
              })
            )
            .catch(() => [] as Array<{
              id: string
              sacco_name: string
              financial_year: number
              net_dividend: number
              reference: string
              disbursed_at: string | null
              status: 'DISBURSED'
            }>)
        )
      )

      return byMembership
        .flat()
        .sort((a, b) => String(b.disbursed_at ?? '').localeCompare(String(a.disbursed_at ?? '')))
    },

    getNotifications: async (): Promise<AppNotification[]> => {
      const items = await apiCall<PaginatedResponse<any> | any[]>('GET', '/notifications/').then(unwrapResults)
      return items.map((n: any) =>
        NotificationSchema.parse({
          id: String(n.id),
          title: String(n.title ?? ''),
          message: String(n.message ?? ''),
          category: String(n.category ?? 'SYSTEM').toUpperCase(),
          is_read: Boolean(n.is_read),
          action_url: n.action_url ?? null,
          created_at: n.created_at ?? new Date().toISOString(),
        })
      )
    },

    markNotificationRead: (id: string) =>
      apiCall<void>('POST', `/notifications/${uuid(id)}/read/`),

    markAllNotificationsRead: () =>
      apiCall<void>('POST', '/notifications/read-all/'),

    registerDevice: (data: { token: string; platform: 'ios' | 'android' | 'web' | string }) =>
      apiCall<void>('POST', '/notifications/device/', {
        token: data.token,
        platform: String(data.platform).toUpperCase(),
      }),

    getEntries: async (params?: { sacco_id?: string; from_date?: string; to_date?: string; category?: string }) => {
      const response = await apiCall<any>('GET', '/ledger/entries/', undefined, { params })
      return unwrapResults(response)
    },

    getBalance: async (saccoId: string) => {
      const response = await apiCall<any>('GET', '/ledger/balance/', undefined, {
        params: { sacco_id: saccoId },
      })
      return {
        total_balance: Number(response.total_balance ?? 0),
        bosa_balance: Number(response.bosa_balance ?? 0),
        fosa_balance: Number(response.fosa_balance ?? 0),
        share_capital: Number(response.share_capital ?? 0),
      }
    },

    getState: async () => {
      const response = await apiCall<any>('GET', '/dashboard/state/')
      return response
    },

    getActivity: async (params?: { limit?: number }) => {
      const response = await apiCall<any>('GET', '/dashboard/activity/', undefined, { params })
      return unwrapResults(response)
    },

    // Approved-membership cards for the SACCO switcher. The backend already
    // computes per-SACCO savings, active-loan count and unread-notification
    // count, so use it rather than re-deriving from getMemberships + portfolio.
    getSaccoSwitcher: async () => {
      const rows = await apiCall<any[]>('GET', '/dashboard/saccos/')
      return (Array.isArray(rows) ? rows : []).map((row: any) => ({
        sacco_id: String(row.sacco_id ?? ''),
        sacco_name: String(row.sacco_name ?? 'SACCO'),
        sacco_slug: String(row.sacco_name ?? row.sacco_id ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        sacco_logo_url: row.sacco_logo_url ?? null,
        member_number: String(row.member_number ?? ''),
        savings_total: Number(row.savings_total ?? 0),
        active_loans: Number(row.active_loans ?? 0),
        unread_notifications: Number(row.unread_notifications ?? 0),
      }))
    },
  },

  //  SACCO DISCOVERY 

  saccos: {
    getPublicStats: () =>
      apiCall<{ total_saccos: number; total_members_on_app: number }>('GET', '/accounts/public-stats/'),

    list: (params?: { sector?: string; county?: string; search?: string; verified_only?: boolean }) =>
      apiCall<any[] | PaginatedResponse<any>>('GET', '/accounts/saccos/', undefined, {
        // Don't force verified_only — members should see every publicly listed
        // SACCO. Callers can still opt in via params.verified_only.
        params: { ordering: '-member_count', ...params },
      }).then((items) => unwrapResults(items).map(normalizeSacco)),

    get: async (saccoId: string) => {
      const key = requiredString(saccoId)
      if (/^[0-9a-f-]{36}$/i.test(key)) {
        return normalizeSacco(await apiCall<any>('GET', `/accounts/saccos/${key}/`))
      }

      const saccos = await api.saccos.list({ search: key.replace(/-/g, ' ') })
      const sacco = saccos.find((item) => item.slug === key) ?? saccos[0]
      if (!sacco) throw { code: 'NOT_FOUND', message: 'SACCO not found.' }
      return sacco
    },

    getConfig: async (slug: string) => {
      const sacco = await api.saccos.get(slug)
      const [fields, loanTypes] = await Promise.all([
        apiCall<any[] | PaginatedResponse<any>>('GET', `/members/saccos/${sacco.id}/fields/`).catch(() => []),
        apiCall<any[] | PaginatedResponse<any>>('GET', '/services/loan-types/', undefined, { params: { sacco_id: sacco.id } }).catch(() => []),
      ])
      const fieldItems = unwrapResults(fields)
      const loanTypeItems = unwrapResults(loanTypes)

      return SaccoConfigSchema.parse({
        membership: {
          min_age: 18,
          min_monthly_contribution_kes: 0,
          registration_fee_kes: Number((sacco as any).registration_fee ?? 0),
          min_share_capital_kes: 0,
          required_documents: [
            { key: 'id_front', label: 'National ID front', required: true },
            { key: 'id_back', label: 'National ID back', required: true },
          ],
          additional_fields: fieldItems.map((field) => ({
            key: field.id,
            label: field.label,
            type: field.field_type === 'decimal' ? 'number' : field.field_type === 'choice' ? 'select' : field.field_type ?? 'text',
            required: Boolean(field.is_required),
            options: field.options ?? undefined,
          })),
        },
        loan_products: loanTypeItems.map((loanType) => ({
          key: loanType.id,
          label: loanType.name,
          description: loanType.description ?? undefined,
          interest_rate_pct: Number(loanType.interest_rate ?? 0),
          max_multiplier: Number(loanType.max_multiplier ?? 1),
          min_months: Number(loanType.min_term_months ?? 1),
          max_months: Number(loanType.max_term_months ?? 1),
          min_guarantors: Number(loanType.min_guarantors ?? 0),
          requires_guarantors: Boolean(loanType.requires_guarantors ?? false),
          processing_fee_pct: Number(loanType.processing_fee_pct ?? 0),
          disbursement_options: ['mpesa', 'fosa', 'bank'],
        })),
        payments: {
          mpesa_paybill: '',
          accepted_methods: ['mpesa'],
        },
        contributions: {
          deduction_day: 1,
          grace_period_days: 0,
          allow_top_up: true,
        },
        display: {
          primary_color: sacco.color,
          show_bosa: true,
          show_fosa: true,
          show_share_capital: true,
          account_labels: {
            bosa: 'BOSA',
            fosa: 'FOSA',
            shares: 'Share capital',
          },
        },
      })
    },
  },

  //  MEMBERSHIP APPLICATIONS 

  applications: {
    submit: async (data: {
      sacco_slug: string
      form_data: Record<string, unknown>
    }) => {
      const sacco = await api.saccos.get(data.sacco_slug)
      const customFieldsObj = (data.form_data?.customFields as Record<string, unknown>) ?? {}
      const customFields = Object.entries(customFieldsObj).map(([field_id, value]) => ({
        field_id,
        value: String(value ?? ''),
      }))
      
      let employmentStatus = String(data.form_data?.employmentType ?? 'Employed')
      if (employmentStatus === 'Employed — salaried') employmentStatus = 'Employed'
      
      const employerName = String(data.form_data?.employer ?? '')
      const rawIncome = String(data.form_data?.monthlyIncome ?? '0').replace(/[^0-9.]/g, '')
      const monthlyIncome = Number(rawIncome) || 0
      
      const membership = await apiCall<any>('POST', '/members/memberships/', {
        sacco: sacco.id,
        custom_fields: customFields,
        employment_status: employmentStatus,
        employer_name: employerName,
        monthly_income: monthlyIncome,
      })
      return {
        id: membership.id,
        sacco_slug: sacco.slug,
        sacco_name: sacco.name,
        status: 'submitted',
        ref: membership.member_number ?? membership.id,
        form_data: data.form_data,
        registration_fee_paid: false,
        registration_fee_txn_ref: null,
        submitted_at: membership.application_date ?? new Date().toISOString(),
        reviewed_at: null,
      } as MembershipApplication
    },

    list: async () =>
      (await api.member.getMemberships()).map((membership) => ({
        id: membership.id,
        sacco_slug: membership.sacco_slug,
        sacco_name: membership.sacco_name,
        status:
          membership.status === 'active'
            ? 'approved'
            : membership.status === 'under_review'
              ? 'under_review'
              : membership.status === 'withdrawn' || membership.status === 'suspended'
                ? 'rejected'
                : 'submitted',
        ref: membership.member_number || membership.id,
        form_data: {},
        registration_fee_paid: false,
        registration_fee_txn_ref: null,
        submitted_at: membership.applied_at,
        reviewed_at: membership.joined_at,
      })),

    get: (id: string) =>
      api.applications.list().then((items) => items.find((item) => item.id === id) as MembershipApplication),

    // NOTE: there is no way to collect a membership registration fee through
    // this API. The STK-push endpoint only accepts purpose SAVING_DEPOSIT
    // (requires an existing saving_id, which does not exist pre-approval) or
    // LOAN_REPAYMENT — there is no REGISTRATION_FEE purpose. The registration
    // fee is settled with the SACCO directly.

    uploadDocument: async (applicationId: string, documentType: string, file: File | Blob | any, notes?: string) => {
      const formData = new FormData()
      formData.append('application_id', uuid(applicationId))
      formData.append('document_type', documentType)

      if (file && typeof file === 'object' && 'uri' in file) {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any)
      } else {
        formData.append('file', file)
      }

      if (notes) {
        formData.append('notes', notes)
      }

      return apiCall<any>('POST', `/members/applications/${uuid(applicationId)}/documents/`, formData)
    },

    listDocuments: async (applicationId: string) =>
      unwrapResults(await apiCall<any>('GET', `/members/applications/${uuid(applicationId)}/documents/`)),

    deleteDocument: async (applicationId: string, documentId: string) =>
      apiCall<void>('DELETE', `/members/applications/${uuid(applicationId)}/documents/${uuid(documentId)}/`),
  },

  savings: {
    list: async (params?: { sacco?: string; status?: string }) => {
      const requestParams: Record<string, string> = {}
      if (params?.sacco) {
        requestParams.sacco = isUuid(params.sacco) ? params.sacco : (await api.saccos.get(params.sacco)).id
      }
      const items = unwrapResults(
        await apiCall<any[] | PaginatedResponse<any>>('GET', '/services/savings/', undefined, {
          params: requestParams,
        })
      ).map(normalizeSaving)
      return params?.status ? items.filter((item) => item.status === params.status?.toLowerCase()) : items
    },

    getTypes: async (saccoId: string) => {
      const items = unwrapResults(
        await apiCall<any[] | PaginatedResponse<any>>('GET', '/services/savings-types/', undefined, {
          params: { sacco_id: saccoId },
        })
      )
      return items.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        interest_rate_pct: Number(item.interest_rate ?? 0),
        min_balance: Number(item.min_balance ?? 0),
        withdrawal_terms: item.withdrawal_terms ?? '',
      }))
    },

    getBreakdown: async (saccoId: string) => {
      const response = await apiCall<any>('GET', '/services/savings/breakdown/', undefined, {
        params: { sacco_id: saccoId },
      })
      const data = response.data ?? response
      return {
        sacco_id: data.sacco_id ?? '',
        sacco_name: data.sacco_name ?? '',
        bosa_total: Number(data.bosa_total ?? 0),
        fosa_total: Number(data.fosa_total ?? 0),
        share_capital_total: Number(data.share_capital_total ?? 0),
        dividend_eligible_total: Number(data.dividend_eligible_total ?? 0),
        total: Number(data.total ?? 0),
      }
    },
  },

  // LOANS

  loans: {
    list: async (params?: { sacco?: string; status?: string }) => {
      const requestParams: Record<string, string> = {}
      let selectedSacco: Sacco | null = null
      if (params?.sacco) {
        if (isUuid(params.sacco)) {
          requestParams.sacco = params.sacco
        } else {
          selectedSacco = await api.saccos.get(params.sacco)
          requestParams.sacco = selectedSacco.id
        }
      }
      if (params?.status) requestParams.status = params.status.toUpperCase()

      const [items, memberships] = await Promise.all([
        apiCall<any[] | PaginatedResponse<any>>('GET', '/services/loans/list/', undefined, { params: requestParams }),
        api.member.getMemberships().catch(() => []),
      ])

      return unwrapResults(items).map((loan) => {
        const loanSaccoName = loan.membership?.sacco_name ?? loan.sacco_name ?? selectedSacco?.name ?? ''
        const matchedMembership = memberships.find(
          (membership) =>
            membership.sacco_name === loanSaccoName ||
            membership.sacco_id === selectedSacco?.id ||
            membership.sacco_slug === selectedSacco?.slug
        )
        return LoanApplicationSchema.parse({
          id: loan.id,
          ref: loan.reference ?? loan.id,
          sacco_name: loanSaccoName,
          sacco_slug: loan.sacco_slug ?? matchedMembership?.sacco_slug ?? selectedSacco?.slug ?? '',
          loan_product_key: loan.loan_type?.name ?? loan.loan_type ?? '',
          loan_product_label: loan.loan_type?.name ?? loan.loan_type ?? 'Loan',
          amount_requested: Number(loan.amount ?? 0),
          period_months: Number(loan.term_months ?? 0),
          interest_rate: Number(loan.interest_rate ?? 0),
          monthly_instalment: Number(loan.monthly_instalment ?? 0),
          total_repayable: Number(loan.total_repayable ?? loan.amount ?? 0),
          purpose: loan.application_notes ?? '',
          disbursement_method: 'mpesa',
          disbursement_account: '',
          status: normalizeLoanStatus(loan.status),
          submitted_at: loan.created_at ?? null,
          approved_at: loan.approved_at ?? null,
          disbursed_at: loan.disbursement_date ?? null,
          balance_remaining: Number(loan.outstanding_balance ?? 0),
        })
      })
    },

    get: async (id: string) => {
      // LoanDetailView returns disbursement_date, application_notes and
      // rejection_reason — fields the list endpoint omits, so a member can see
      // why a loan was rejected. Falls back to the list if the detail 404s.
      const loan = await apiCall<any>('GET', `/services/loans/${uuid(id)}/`).catch(() => null)
      if (!loan) {
        return api.loans.list().then((loans) => loans.find((l) => l.id === id) as LoanApplication)
      }
      const saccoName = loan.membership?.sacco_name ?? loan.sacco_name ?? ''
      return LoanApplicationSchema.parse({
        id: String(loan.id),
        ref: loan.reference ?? String(loan.id),
        sacco_name: saccoName,
        sacco_slug: String(saccoName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        loan_product_key: loan.loan_type?.name ?? loan.loan_type ?? '',
        loan_product_label: loan.loan_type?.name ?? loan.loan_type ?? 'Loan',
        amount_requested: Number(loan.amount ?? 0),
        period_months: Number(loan.term_months ?? 0),
        interest_rate: Number(loan.interest_rate ?? 0),
        monthly_instalment: Number(loan.monthly_instalment ?? 0),
        total_repayable: Number(loan.total_repayable ?? loan.amount ?? 0),
        purpose: loan.application_notes ?? '',
        status: normalizeLoanStatus(loan.status),
        submitted_at: loan.created_at ?? null,
        approved_at: loan.approved_at ?? null,
        disbursed_at: loan.disbursement_date ?? null,
        balance_remaining: Number(loan.outstanding_balance ?? 0),
        rejection_reason: loan.rejection_reason ?? null,
      })
    },

    getSchedule: async (id: string) => {
      const response = await apiCall<any>('GET', `/services/loans/${uuid(id)}/schedule/`)
      const items = unwrapResults(response)
      return items.map((item: any) => ({
        instalment_number: Number(item.instalment_number ?? item.installment_number ?? 0),
        due_date: item.due_date ?? item.date ?? '',
        principal: Number(item.principal ?? 0),
        interest: Number(item.interest ?? 0),
        amount: Number(item.amount ?? item.total_due ?? 0),
        balance_after: Number(item.balance_after ?? item.remaining_balance ?? 0),
        status: String(item.status ?? 'PENDING').toUpperCase(),
      }))
    },

    getEligibility: async (saccoId: string) => {
      const response = await apiCall<any>('GET', '/services/loans/eligibility/', undefined, {
        params: { sacco_id: saccoId },
      })
      return {
        eligible: Boolean(response.eligible ?? false),
        max_amount: Number(response.max_amount ?? 0),
        total_savings: Number(response.total_savings ?? 0),
        existing_balance: Number(response.existing_balance ?? 0),
        months_active: Number(response.months_active ?? 0),
        guarantors_required: Number(response.guarantors_required ?? 0),
        reason: response.reason ?? null,
      }
    },

    apply: async (data: LoanApplicationInput) => {
      const membership = await api.member.getMembership(data.membership_id).catch(() => null)
      const amount = Number(data.amount_requested)
      const termMonths = Number(data.period_months)

      // The backend's LoanApplySerializer echoes back only
      // {loan_type, amount, term_months, application_notes} — no id / status /
      // reference — and the view is not wrapped in {success,data}. So fire the
      // POST, then read the freshly created loan back from the member's own
      // loan list (which does carry id, status, created_at, …).
      await apiCall<unknown>('POST', '/services/loans/apply/', {
        loan_type: data.loan_product_key,
        amount,
        term_months: termMonths,
        application_notes: data.purpose || '',
      })

      const loans = await api.loans
        .list(membership?.sacco_id ? { sacco: membership.sacco_id } : undefined)
        .catch(() => [] as LoanApplication[])

      const byNewest = (a: LoanApplication, b: LoanApplication) =>
        String(b.submitted_at ?? '').localeCompare(String(a.submitted_at ?? ''))

      const created =
        loans
          .filter((l) => l.amount_requested === amount && l.period_months === termMonths)
          .sort(byNewest)[0] ?? [...loans].sort(byNewest)[0]

      if (!created?.id) {
        throw {
          code: 'LOAN_CREATED_NOT_READABLE',
          message:
            'Your loan application was submitted, but we could not load it back. Open “My loans” to continue.',
        }
      }

      return LoanApplicationSchema.parse({
        ...created,
        // The list serializer exposes loan_type by name only — keep the product
        // key the caller submitted so downstream product lookups still resolve.
        loan_product_key: data.loan_product_key,
        purpose: created.purpose || data.purpose,
        sacco_slug: created.sacco_slug || membership?.sacco_slug || '',
        sacco_name: created.sacco_name || membership?.sacco_name || '',
      })
    },

    repay: (id: string, amount: number, data: { sacco_id: string; phone_number: string; instalment_number?: number }) =>
      apiCall<any>('POST', '/payments/mpesa/stk-push/', {
        loan_id: uuid(id),
        sacco_id: uuid(data.sacco_id),
        amount,
        phone_number: data.phone_number,
        purpose: 'LOAN_REPAYMENT',
        instalment_number: data?.instalment_number ?? 1,
      }, {
        idempotent: true,
      }).then(normalizeStkPushResponse),

    compare: async (params: { amount: number; months: number }) => {
      const [items, memberships] = await Promise.all([
        apiCall<any[]>('GET', '/dashboard/loans/compare/', undefined, {
        params: { amount: params.amount, term: params.months },
        }),
        api.member.getMemberships().catch(() => []),
      ])
      return items.map((item) => {
        const membership = memberships.find(
          (candidate) => candidate.sacco_id === item.sacco_id || candidate.sacco_name === item.sacco_name
        )
        return {
          sacco_slug:
            membership?.sacco_slug ??
            String(item.sacco_name ?? item.sacco_id)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          sacco_name: item.sacco_name ?? membership?.sacco_name ?? 'SACCO',
          sacco_color: membership?.sacco_color ?? '#6D28D9',
          sacco_initials:
            membership?.sacco_initials ??
            String(item.sacco_name ?? 'SA')
              .split(/\s+/)
              .map((part: string) => part[0])
              .join('')
              .slice(0, 3)
              .toUpperCase(),
          loan_product_label: item.loan_product_label ?? item.loan_type_name ?? 'Loan',
          interest_rate_pct: Number(item.interest_rate_pct ?? item.interest_rate ?? 0),
          monthly_instalment: Number(item.monthly_instalment ?? item.monthly_payment ?? 0),
          total_repayable: Number(item.total_repayable ?? item.total_payable ?? 0),
          total_interest: Number(item.total_interest ?? 0),
          max_amount: Number(item.max_amount ?? 0),
          is_eligible: Boolean(item.is_eligible ?? true),
        } satisfies LoanComparisonItem
      })
    },

    searchGuarantors: (loanId: string, query: string) =>
      apiCall<any[]>('GET', `/services/loans/${uuid(loanId)}/guarantors/search/`, undefined, {
        // Backend matches on phone first, then member number — send the raw
        // query as both so either identifier the member types resolves.
        params: { phone: query, member_number: query },
      }),

    requestGuarantor: (loanId: string, guarantorId: string, amount?: number) =>
      apiCall<void>('POST', `/services/loans/${uuid(loanId)}/guarantors/`, {
        guarantor_user_id: uuid(guarantorId),
        guarantee_amount: amount,
      }),

    submitExternalGuarantor: (loanId: string, data: { full_name: string; phone_number: string; id_number: string; employment_status?: string; monthly_income?: number; guarantee_amount?: number }) =>
      apiCall<void>('POST', `/services/loans/${uuid(loanId)}/external-guarantors/`, {
        full_name: data.full_name,
        phone_number: data.phone_number,
        id_number: data.id_number,
        employment_status: data.employment_status,
        monthly_income: data.monthly_income,
        guarantee_amount: data.guarantee_amount,
      }),

    getExternalGuarantors: (loanId: string) =>
      apiCall<any[]>('GET', `/services/loans/${uuid(loanId)}/external-guarantors/`),

    // The external guarantor is unauthenticated and only holds a response
    // token. The backend exposes exactly one token-scoped endpoint — this POST.
    // There is no GET to look up borrower / amount details by token; those come
    // to the guarantor in the SMS body (and, for an in-app open, via route
    // params on the deep link).
    respondToExternalGuarantorRequest: (responseToken: string, action: 'accept' | 'decline', notes?: string) =>
      apiCall<{ message: string }>('POST', `/guarantors/external/respond/${responseToken}/`, {
        action: action === 'accept' ? 'ACCEPT' : 'DECLINE',
        notes: notes,
      }),

    respondToGuarantorRequest: (loanId: string, guarantorId: string, action: 'approve' | 'decline') =>
      apiCall<void>('POST', `/services/loans/${uuid(loanId)}/guarantors/${uuid(guarantorId)}/respond/`, {
        action: action === 'approve' ? 'APPROVE' : 'DECLINE',
      }),

    // These are unauthenticated GET endpoints keyed on a server-signed token
    // that the backend delivers by SMS / push as
    // `{FRONTEND_BASE_URL}/confirm-disbursement/?token=…`. The token embeds the
    // loan id and expires after 24h — there is no loan_id / POST form.
    // Backend is POST-only (link-prefetch bots must not trigger it) and reads
    // `token` (and `reason`) from the request body, not the query string.
    confirmDisbursement: (token: string) =>
      apiCall<{ status: string; message: string }>(
        'POST',
        '/services/loans/confirm-disbursement/',
        { token: requiredString(token) }
      ),

    disputeDisbursement: (token: string, reason?: string) =>
      apiCall<{ status: string; message: string }>(
        'POST',
        '/services/loans/dispute-disbursement/',
        { token: requiredString(token), ...(reason ? { reason } : {}) }
      ),
  },

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────

  payments: {
    stkPush: (data: STKPushInput) =>
      apiCall<any>('POST', '/payments/mpesa/stk-push/', parseInput(STKPushInputSchema, data), {
        idempotent: true,
      }).then(normalizeStkPushResponse),

    // STKStatusView returns {checkout_request_id, merchant_request_id, status,
    // result_code, result_description, callback_received} — no completed_at.
    // `status` is a Transaction.Status value; collapse the terminal ones so
    // pollers know when to stop.
    checkStatus: async (ref: string) => {
      const r = await apiCall<any>('GET', `/payments/mpesa/stk/${requiredString(ref)}/status/`)
      const raw = String(r.status ?? '').toUpperCase()
      const is_success = raw === 'COMPLETED'
      const is_final =
        is_success || ['FAILED', 'INITIATION_FAILED', 'AMOUNT_MISMATCH', 'REVERSED'].includes(raw)
      return {
        checkout_request_id: r.checkout_request_id ?? ref,
        merchant_request_id: (r.merchant_request_id ?? null) as string | null,
        status: raw.toLowerCase(),
        is_success,
        is_final,
        result_code: (r.result_code ?? null) as string | number | null,
        result_description: String(r.result_description ?? ''),
        callback_received: Boolean(r.callback_received),
      }
    },

    getMpesaDetails: (id: string) =>
      apiCall<any>('GET', `/payments/mpesa/${uuid(id)}/`),

    b2cDisburse: (data: { loan_id: string; amount: number; phone_number: string; remarks?: string }) =>
      apiCall<any>('POST', '/payments/mpesa/b2c/disburse/', {
        loan_id: uuid(data.loan_id),
        amount: data.amount,
        phone_number: data.phone_number,
        remarks: data.remarks ?? 'Loan disbursement',
      }, { idempotent: true }).then(normalizeStkPushResponse),

    // B2CStatusView returns {conversation_id, originator_conversation_id,
    // status, result_code, result_description, mpesa_receipt_number,
    // callback_received, loan_id, amount, created_at} — no completed_at.
    checkB2cStatus: async (conversationId: string) => {
      const r = await apiCall<any>('GET', `/payments/mpesa/b2c/${requiredString(conversationId)}/status/`)
      const raw = String(r.status ?? '').toUpperCase()
      const is_success = raw === 'COMPLETED'
      const is_final =
        is_success || ['FAILED', 'INITIATION_FAILED', 'AMOUNT_MISMATCH', 'REVERSED'].includes(raw)
      return {
        conversation_id: r.conversation_id ?? conversationId,
        status: raw.toLowerCase(),
        is_success,
        is_final,
        result_code: (r.result_code ?? null) as string | number | null,
        result_description: String(r.result_description ?? ''),
        mpesa_receipt_number: (r.mpesa_receipt_number ?? null) as string | null,
        callback_received: Boolean(r.callback_received),
        amount: Number(r.amount ?? 0),
      }
    },

    getB2cHistory: async (saccoId?: string) => {
      const params = saccoId ? { sacco_id: saccoId } : undefined
      const response = await apiCall<any>('GET', '/payments/mpesa/b2c/history/', undefined, { params })
      return Array.isArray(response) ? response : response.results ?? []
    },

    // Pre-confirmation fee breakdown: "you pay / platform fee / you receive".
    getFeePreview: async (data: { type: 'deposit' | 'repayment' | 'withdrawal'; amount: number }) => {
      const r = await apiCall<any>('GET', '/payments/fee-preview/', undefined, {
        params: { type: data.type, amount: data.amount },
      })
      return {
        gross_amount: Number(r.gross_amount ?? data.amount),
        net_amount: Number(r.net_amount ?? data.amount),
        platform_fee: Number(r.platform_fee ?? 0),
        fee_rate: Number(r.fee_rate ?? 0),
        summary: (r.summary ?? {}) as Record<string, string>,
      }
    },

    // Member-initiated M-Pesa B2C withdrawal from a savings account.
    withdrawSavings: (data: { sacco_id: string; saving_id: string; amount: number; phone_number: string }) =>
      apiCall<any>('POST', '/payments/mpesa/b2c/withdraw/', {
        sacco_id: uuid(data.sacco_id),
        saving_id: uuid(data.saving_id),
        amount: data.amount,
        phone_number: data.phone_number,
      }, { idempotent: true }),
  },

  // ─── KYC ───────────────────────────────────────────────────────────────────

  kyc: {
    // Mirrors the Django KYCStatusSerializer. The backend sends `status`
    // (not `kyc_status`) and individual `id_front` / `id_back` / `passport`
    // file fields — there is no `documents` array.
    getStatus: async () => {
      const kyc = await apiCall<any>('GET', '/accounts/kyc/status/')
      const rawStatus = String(kyc.status ?? 'not_started').toLowerCase()
      return {
        id: kyc.id ? String(kyc.id) : null,
        // Normalised the same way as the user profile: `approved` -> `verified`.
        status: rawStatus === 'approved' ? 'verified' : rawStatus,
        status_display: String(kyc.status_display ?? ''),
        iprs_verified: Boolean(kyc.iprs_verified),
        iprs_attempted_at: (kyc.iprs_attempted_at ?? null) as string | null,
        iprs_error: String(kyc.iprs_error ?? ''),
        admin_review_reason: String(kyc.admin_review_reason ?? ''),
        manual_verification_reason: String(kyc.manual_verification_reason ?? ''),
        submitted_at: (kyc.submitted_at ?? null) as string | null,
        rejection_reason: String(kyc.rejection_reason ?? ''),
        id_front: (kyc.id_front ?? null) as string | null,
        id_back: (kyc.id_back ?? null) as string | null,
        passport: (kyc.passport ?? null) as string | null,
        // The backend exposes no member-facing signed URL to view these images
        // back, so surface only whether each side has been received.
        has_id_front: Boolean(kyc.id_front),
        has_id_back: Boolean(kyc.id_back),
        has_passport: Boolean(kyc.passport),
      }
    },

    // KYCSubmitIDView returns {outcome, iprs_verified, status, id_number, name,
    // iprs_reference, error} — not a {message} envelope. (The old
    // responseSchema:OTPResponseSchema made this throw on every call.)
    submitId: async (data: { id_number: string; date_of_birth: string }) => {
      const r = await apiCall<any>('POST', '/accounts/kyc/submit-id/', {
        id_number: z.string().min(1).parse(data.id_number),
        date_of_birth: z.string().min(1).parse(data.date_of_birth),
      })
      return {
        outcome: (r.outcome ?? null) as string | null,
        iprs_verified: Boolean(r.iprs_verified),
        status: String(r.status ?? '').toLowerCase(),
        id_number: (r.id_number ?? null) as string | null,
        name: (r.name ?? null) as string | null,
        iprs_reference: String(r.iprs_reference ?? ''),
        error: (r.error ?? null) as string | null,
      }
    },

    requestUploadUrl: (data: {
      doc_type: string
      file_name: string
      file_size: number
      content_type: string
    }) =>
      apiCall<{
        document_id: string
        upload_url: string
        expires_in: number
      }>('POST', '/accounts/kyc/upload/', data),

    uploadDocument: (data: { document_type: KycDocumentType; file: KycUploadFile }) => {
      const documentType = KycDocumentTypeSchema.parse(data.document_type)
      const form = new FormData()
      form.append('document_type', documentType)

      if ('uri' in data.file) {
        // Native or Web object fallback
        const fileObj = data.file
        if (fileObj.file) {
          // Web File/Blob
          form.append('file', fileObj.file, fileObj.name)
        } else {
          // Native object
          form.append('file', {
            uri: fileObj.uri,
            name: fileObj.name,
            type: fileObj.type,
          } as any)
        }
      } else {
        // Direct Blob/File
        form.append('file', data.file)
      }

      return apiCall<any>('POST', '/accounts/kyc/upload/', form).then((payload) => ({
        ...payload,
        id: payload.id ?? payload.document_id,
      }))
    },
  },

  // ─── SACCO ADMIN ───────────────────────────────────────────────────────────

  saccoAdmin: {
    getDashboard: async () => normalizeAdminDashboard(await apiCall<any>('GET', '/management/stats/')),

    getDisbursementsDashboard: async () => {
      const response = await apiCall<any>('GET', '/management/dashboard/disbursements/')
      return {
        disbursed_today: {
          count: Number(response.disbursed_today?.count ?? 0),
          total_amount: Number(response.disbursed_today?.total_amount ?? 0),
        },
        pending_disbursement: {
          count: Number(response.pending_disbursement?.count ?? 0),
          total_amount: Number(response.pending_disbursement?.total_amount ?? 0),
        },
        total_disbursements: {
          count: Number(response.total_disbursements?.count ?? 0),
          total_amount: Number(response.total_disbursements?.total_amount ?? 0),
        },
        recent_disbursements: Array.isArray(response.recent_disbursements)
          ? response.recent_disbursements.map((item: any) => ({
              member_name: item.member_name,
              member_number: item.member_number,
              loan_id: item.loan_id,
              amount: Number(item.amount ?? 0),
              disbursed_at: item.disbursed_at,
              phone_number: item.phone_number,
            }))
          : [],
      }
    },

    getContributionsDashboard: async () => {
      const response = await apiCall<any>('GET', '/management/dashboard/contributions/')
      return {
        received_today: {
          count: Number(response.received_today?.count ?? 0),
          total_amount: Number(response.received_today?.total_amount ?? 0),
        },
        expected_this_month: {
          count: Number(response.expected_this_month?.count ?? 0),
          total_amount: Number(response.expected_this_month?.total_amount ?? 0),
        },
        received_so_far_this_month: {
          count: Number(response.received_so_far_this_month?.count ?? 0),
          total_amount: Number(response.received_so_far_this_month?.total_amount ?? 0),
        },
        missed_overdue: {
          count: Number(response.missed_overdue?.count ?? 0),
          total_amount: Number(response.missed_overdue?.total_amount ?? 0),
        },
        contribution_rate_pct: Number(response.contribution_rate_pct ?? 0),
        recent_contributions: Array.isArray(response.recent_contributions)
          ? response.recent_contributions.map((item: any) => ({
              member_name: item.member_name,
              member_number: item.member_number,
              amount: Number(item.amount ?? 0),
              date: item.date,
              savings_type: item.savings_type,
            }))
          : [],
      }
    },

    getSettings: async () => {
      const response = await apiCall<any>('GET', '/management/settings/')
      return response.data ?? response
    },

    updateSettings: async (data: any) => {
      return apiCall<any>('PATCH', '/management/settings/', data)
    },

    getMembers: async (params?: {
      status?: string
      search?: string
      kyc_status?: string
      cursor?: string
    }) => {
      const response = await apiCall<any>('GET', '/management/members/', undefined, {
        params,
      })
      const items = unwrapResults(response)
      return {
        count: Number(response.count ?? response.total_members ?? response.total ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map(normalizeAdminMember),
      }
    },

    getMember: async (id: string) => normalizeAdminMember(await apiCall<any>('GET', `/management/members/${uuid(id)}/`)),

    // Add one member by submitting a single-row CSV to the member-import
    // pipeline — /management/members/ is GET-only, there is no admin
    // create-member endpoint. Import columns: first_name, last_name, email
    // (required) + phone_number, employment_status, monthly_income (optional).
    addMemberViaImport: (data: {
      first_name: string
      last_name: string
      email: string
      phone_number?: string
      employment_status?: string
      monthly_income?: number
    }) => {
      const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const headers = ['first_name', 'last_name', 'email', 'phone_number', 'employment_status', 'monthly_income']
      const row = [
        data.first_name,
        data.last_name,
        data.email,
        data.phone_number ?? '',
        data.employment_status ?? '',
        data.monthly_income ?? '',
      ]
      const csv = `${headers.join(',')}\n${row.map(cell).join(',')}\n`
      const file =
        typeof File !== 'undefined'
          ? new File([csv], 'add-member.csv', { type: 'text/csv' })
          : (new Blob([csv], { type: 'text/csv' }) as unknown as File)
      return api.saccoAdmin.importMembers(file)
    },

    // Membership applications
    getApplications: async (params?: { status?: string }) => {
      const statusFilter = params?.status ? params.status.toUpperCase() : 'PENDING'
      const response = await apiCall<any>('GET', '/management/members/', undefined, {
        params: { ...params, status: statusFilter }
      })
      const items = unwrapResults(response)
      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => {
          const member = normalizeAdminMember(item)
          const rawStatus = String(item.status || 'PENDING').toUpperCase()
          const statusMap: Record<string, string> = {
            PENDING: 'applied',
            SUBMITTED: 'applied',
            UNDER_REVIEW: 'under_review',
            APPROVED: 'active',
            REJECTED: 'withdrawn',
            WITHDRAWN: 'withdrawn',
          }
          const normalizedStatus = statusMap[rawStatus] || 'applied'
          return {
            id: member.id,
            application_id: item.application_id ?? item.id ?? member.id, 
            user_id: member.user_id,
            full_name: `${member.first_name} ${member.last_name}`.trim(),
            email: member.email,
            phone_number: member.phone,
            national_id: member.national_id,
            employment_status: item.employment_status ?? '—',
            employer_name: item.employer_name ?? '—',
            monthly_income: Number(item.monthly_income ?? 0),
            monthly_contribution: member.monthly_contribution,
            status: rawStatus,
            normalized_status: normalizedStatus,
            submitted_at: member.joined_at || new Date().toISOString(),
            review_notes: item.review_notes ?? '',
          }
        }),
      }
    },

    // NOTE: /management/applications/{id}/review/ is keyed on the
    // SaccoApplication id, which no list endpoint exposes — the only id the
    // admin console can obtain here is the Membership id, which 404s. Until a
    // SaccoApplication list (or a membership-status endpoint) exists, there is
    // no working approve/reject call to wrap.

    // Custom member-profile fields.
    // SaccoFieldDefinitionAdminListCreateView / ...DetailView (IsSaccoAdmin).
    // The SACCO is derived server-side from the admin's role, so no id is sent.
    getMemberFieldDefinitions: async () => {
      const response = await apiCall<any>('GET', '/members/admin/field-definitions/')
      const items: any[] = Array.isArray(response) ? response : response.results ?? response.data ?? []
      return items.map((f: any) => ({
        id: String(f.id),
        label: f.label ?? '',
        field_type: String(f.field_type ?? 'TEXT') as
          | 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'FILE',
        is_required: Boolean(f.is_required),
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        display_order: Number(f.display_order ?? 0),
      }))
    },

    createMemberFieldDefinition: (data: {
      label: string
      field_type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'FILE'
      is_required?: boolean
      options?: string[] | null
      display_order?: number
    }) =>
      apiCall<any>('POST', '/members/admin/field-definitions/', {
        label: data.label,
        field_type: data.field_type,
        is_required: data.is_required ?? true,
        // The serializer only accepts a non-empty string list for SELECT.
        options: data.field_type === 'SELECT' ? (data.options ?? []) : null,
        display_order: data.display_order ?? 0,
      }),

    deleteMemberFieldDefinition: (id: string) =>
      apiCall<void>('DELETE', `/members/admin/field-definitions/${uuid(id)}/`),

    // Role management
    // UserRolesView is IsSaccoAdminOrSuperAdmin (read OK), paginated, and
    // RoleSerializer returns role_name (display label), user_email, sacco_name,
    // created_at — no machine `name` and no sacco id.
    getRoles: async (userId: string) => {
      const response = await apiCall<any>('GET', '/management/roles/', undefined, {
        params: { user_id: userId },
      })
      const items = Array.isArray(response) ? response : response.results ?? response.data ?? []
      return items.map((r: any) => ({
        id: String(r.id),
        role_label: r.role_name ?? r.name ?? '—',
        user_email: r.user_email ?? r.user?.email ?? '',
        sacco_name: r.sacco_name ?? r.sacco?.name ?? null,
        created_at: r.created_at ?? null,
      }))
    },

    // NOTE: RoleAssignView / RoleRevokeView are IsSuperAdmin — a SACCO admin
    // gets 403. Role changes are done from the platform (super-admin) app.


    // Loan approval queue (admin view)
    getLoanApprovals: async () => {
      const response = await apiCall<any>('GET', '/management/loans/approvals/')
      const items = Array.isArray(response.results) ? response.results : []
      return {
        count: Number(response.count ?? items.length),
        results: items.map((item: any) => ({
          loan_id: item.loan_id,
          member_name: item.member_name,
          member_number: item.member_number,
          loan_type_name: item.loan_type_name,
          amount: Number(item.amount ?? 0),
          term_months: item.term_months,
          application_notes: item.application_notes,
          applied_at: item.applied_at,
          status: item.status,
          // /management/loans/approvals/ does not return the member's phone —
          // the disburse dialog collects it manually.
          phone_number: '',
          guarantors_summary: item.guarantors_summary ? {
            internal_approved: Number(item.guarantors_summary.internal_approved ?? 0),
            external_approved: Number(item.guarantors_summary.external_approved ?? 0),
            total_coverage: Number(item.guarantors_summary.total_coverage ?? 0),
          } : null,
          required_documents: item.required_documents,
          crb_status: item.crb_status ?? null,
          crb_score: item.crb_score != null ? Number(item.crb_score) : null,
          crb_checked_at: item.crb_checked_at ?? null,
          crb_listed_negative: Boolean(item.crb_listed_negative),
        })),
      }
    },

    // General loan list 
    getLoans: async (params?: { status?: string; cursor?: string }) => {
      const requestParams: Record<string, string> = {}
      if (params?.status) requestParams.status = params.status.toUpperCase()
      if (params?.cursor) requestParams.cursor = params.cursor

      const response = await apiCall<any>('GET', '/services/loans/list/', undefined, {
        params: requestParams,
      })
      const items = unwrapResults(response)

      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map(normalizeAdminLoan),
      }
    },

    reviewLoan: (id: string, data: { action: 'under_review' | 'approve' | 'reject' | 'disburse'; notes?: string; override_reason?: string }) => {
      const statusMap: Record<string, string> = {
        under_review: 'UNDER_REVIEW',
        approve: 'APPROVED',
        reject: 'REJECTED',
        disburse: 'DISBURSED',
      }
      return apiCall<void>('PATCH', `/management/loans/${uuid(id)}/status/`, {
        status: statusMap[data.action],
        notes: data.notes,
        override_reason: data.override_reason,
      })
    },


    disburseLoan: (loanId: string, data: { amount: number; phone_number: string; remarks?: string }) =>
      apiCall<STKPushResponse>('POST', '/payments/mpesa/b2c/disburse/', {
        loan_id: uuid(loanId),
        amount: data.amount,
        phone_number: data.phone_number,
        remarks: data.remarks ?? 'Loan disbursement',
      }, {
        idempotent: true,
      }),

    // CRBCheckView (IsSaccoAdmin). Runs a Metropol credit check and stores the
    // result; a cached result within 30 days is returned unless force_refresh.
    // A CRB check record MUST exist before a loan can be moved to APPROVED.
    runCRBCheck: (loanId: string, opts?: { force_refresh?: boolean }) =>
      apiCall<{
        id: string
        score: number | null
        band: string | null
        listed_negative: boolean
        provider: string | null
        reference: string | null
        checked_at: string
        cached: boolean
      }>('POST', `/services/loans/${uuid(loanId)}/crb-check/`, undefined, {
        params: opts?.force_refresh ? { force_refresh: 'true' } : undefined,
      }),

    // LoanDisbursementAuditView (IsSaccoAdminOrSuperAdmin). Full M-Pesa B2C
    // audit trail for one loan.
    getLoanDisbursementAudit: async (loanId: string) => {
      const response = await apiCall<any>(
        'GET',
        `/services/loans/${uuid(loanId)}/disbursement-audit/`,
      )
      return {
        loan_id: String(response.loan_id ?? loanId),
        current_status: response.current_status ?? '',
        mpesa_conversation_id: response.mpesa_conversation_id ?? '',
        mpesa_transaction_id: response.mpesa_transaction_id ?? '',
        audit_log: Array.isArray(response.audit_log)
          ? (response.audit_log as any[]).map((e: any) => ({
              event: e.event ?? '',
              actor_role: e.actor_role ?? '',
              details: e.details ?? null,
              mpesa_ref: e.mpesa_ref ?? '',
              created_at: e.created_at ?? null,
            }))
          : [],
      }
    },

    getContributions: async (_params?: { date?: string; member?: string }) => {
      const dashboard = await api.saccoAdmin.getContributionsDashboard()
      const results = (dashboard.recent_contributions || []).map((item: any, idx: number) => ({
        id: item.id || `contrib-${idx}`,
        date: item.date,
        amount: Number(item.amount ?? 0),
        member_name: item.member_name ?? '—',
        member_number: item.member_number ?? '—',
        savings_type: item.savings_type ?? 'Savings',
        status: 'completed',
      }))
      return {
        count: results.length,
        received_today: dashboard.received_today,
        expected_this_month: dashboard.expected_this_month,
        received_so_far_this_month: dashboard.received_so_far_this_month,
        missed_overdue: dashboard.missed_overdue,
        contribution_rate_pct: dashboard.contribution_rate_pct,
        results,
      }
    },

    getDisbursements: async () => {
      const [dash, b2cHistory] = await Promise.all([
        api.saccoAdmin.getDisbursementsDashboard().catch(() => null),
        apiCall<any>('GET', '/payments/mpesa/b2c/history/').catch(() => []),
      ])
      const items = Array.isArray(b2cHistory) ? b2cHistory : b2cHistory.results ?? []
      return {
        count: items.length,
        disbursed_today: dash?.disbursed_today,
        pending_disbursement: dash?.pending_disbursement,
        total_disbursements: dash?.total_disbursements,
        results: items.map((item: any) => ({
          id: item.id,
          date: item.created_at,
          amount: Number(item.amount ?? 0),
          phone_number: item.phone_number ?? '',
          status: String(item.status ?? 'pending').toUpperCase(),
          conversation_id: item.conversation_id ?? '',
        })),
      }
    },

    getB2CStatus: async (conversationId: string) => {
      const response = await apiCall<any>('GET', `/payments/mpesa/b2c/${conversationId}/status/`)
      return {
        conversation_id: response.conversation_id,
        status: String(response.status ?? 'pending').toLowerCase(),
        amount: Number(response.amount ?? 0),
        phone_number: response.phone_number ?? '',
        result_code: response.result_code,
        result_desc: response.result_desc,
        transaction_date: response.transaction_date,
      }
    },

    getReports: async (params: { type: 'loans' | 'contributions' | 'members'; from_date?: string; to_date?: string }) =>
      apiCall<any>('GET', '/management/reports/', undefined, { params }),

    // SaccoReportView only returns JSON (it ignores `format` and never streams a
    // file), so build the CSV client-side from that JSON.
    downloadReport: async (params: { type: 'loans' | 'contributions' | 'members'; from_date?: string; to_date?: string }) => {
      const report = await api.saccoAdmin.getReports(params)
      const body = report?.data ?? report ?? {}
      const cell = (v: unknown) => {
        const s = String(v ?? '')
        return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const rows: unknown[][] = [
        ['Report', report?.type ?? params.type],
        ['From', report?.from_date ?? params.from_date ?? ''],
        ['To', report?.to_date ?? params.to_date ?? ''],
        [],
      ]
      for (const [k, v] of Object.entries(body)) {
        if (v == null || typeof v === 'object') continue
        rows.push([k, v])
      }
      const arrKey = ['status_breakdown', 'by_month', 'growth_by_month'].find(
        (k) => Array.isArray((body as any)[k]) && (body as any)[k].length
      )
      if (arrKey) {
        const arr = (body as any)[arrKey] as Record<string, unknown>[]
        const cols = Object.keys(arr[0])
        rows.push([], cols)
        for (const item of arr) rows.push(cols.map((c) => item[c]))
      }
      const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n')
      const stamp = `${params.from_date ?? ''}_${params.to_date ?? ''}`.replace(/^_|_$/g, '')
      return {
        blob: new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
        filename: `sacco_${params.type}_report${stamp ? `_${stamp}` : ''}.csv`,
      }
    },

    // KYC management
    getKycQueue: async (params?: { status?: string }) => {
      const response = await apiCall<any>('GET', '/management/kyc/queue/', undefined, { params })
      return Array.isArray(response) ? response : response.results ?? []
    },

    reviewKyc: (id: string, data: { status: 'APPROVED' | 'REJECTED'; rejection_reason?: string }) =>
      apiCall<void>('PATCH', `/management/kyc/${uuid(id)}/review/`, data),

    // Member import
    importMembers: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return apiCall<{ job_id: string }>('POST', '/management/import/', form)
    },

    getImportJobStatus: async (jobId: string) => {
      const response = await apiCall<any>('GET', `/management/import/${uuid(jobId)}/`)
      return {
        job_id: response.id,
        status: response.status,
        progress_pct: Number(response.progress_pct ?? 0),
        total_rows: Number(response.total_rows ?? 0),
        processed_rows: Number(response.processed_rows ?? 0),
        success_rows: Number(response.success_rows ?? 0),
        error_rows: Number(response.error_rows ?? 0),
        errors: response.errors ?? [],
        errors_summary: response.errors_summary ?? { count: 0, items: [] },
        started_at: response.started_at,
        completed_at: response.completed_at,
        created_at: response.created_at,
      }
    },

    // External guarantors
    getExternalGuarantors: async (params?: { status?: string }) => {
      // ExternalGuarantorDetailSerializer exposes the model fields: full_name /
      // phone_number / id_number / guarantee_amount / monthly_income / status /
      // guarantor_response + requested_by_name (the loan applicant) + sacco_name
      // + id_front_url / id_back_url. `loan` / `requested_by` are bare UUIDs.
      const response = await apiCall<any>('GET', '/management/external-guarantors/', undefined, { params })
      const items = Array.isArray(response.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : []
      const LABELS: Record<string, string> = {
        PENDING_SMS: 'Sending SMS',
        SMS_SENT: 'Awaiting guarantor',
        ACCEPTED: 'Awaiting admin review',
        DECLINED: 'Declined by guarantor',
        UNDER_ADMIN_REVIEW: 'Under admin review',
        APPROVED_BY_ADMIN: 'Approved',
        REJECTED_BY_ADMIN: 'Rejected',
      }
      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => {
          const status = String(item.status ?? 'PENDING_SMS')
          return {
            id: String(item.id),
            loan_id: String(item.loan ?? item.loan_id ?? ''),
            member_name: item.requested_by_name ?? item.member_name ?? '—',
            guarantor_name: item.full_name ?? item.guarantor_name ?? '—',
            guarantor_phone: item.phone_number ?? item.guarantor_phone ?? '—',
            guarantor_national_id: item.id_number ?? item.guarantor_national_id ?? '—',
            amount: Number(item.guarantee_amount ?? item.amount ?? 0),
            monthly_income: Number(item.monthly_income ?? 0),
            employment_status: item.employment_status ?? '',
            guarantor_response: item.guarantor_response ?? null,
            status,
            status_label: LABELS[status] ?? status,
            can_approve: status === 'ACCEPTED' || status === 'UNDER_ADMIN_REVIEW',
            is_final:
              status === 'APPROVED_BY_ADMIN' ||
              status === 'REJECTED_BY_ADMIN' ||
              status === 'DECLINED',
            admin_notes: item.admin_notes ?? '',
            sacco_name: item.sacco_name ?? '',
            id_front_url: item.id_front_url ?? null,
            id_back_url: item.id_back_url ?? null,
            reviewed_at: item.reviewed_at ?? null,
            created_at: item.created_at ?? new Date().toISOString(),
          }
        }),
      }
    },

    reviewExternalGuarantor: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
      apiCall<void>('PATCH', `/management/external-guarantors/${uuid(id)}/review/`, {
        action: data.action === 'approve' ? 'APPROVE' : 'REJECT',
        admin_notes: data.notes,
      }),

    // NOTE: there is no backend for "internal guarantor holds" — no list
    // endpoint, no hold/lien model, no release action. Internal guarantee
    // capacity is recomputed automatically (services.engines.guarantor_logic)
    // and frees up when the loan or guarantor status changes.

    // Audit logs (IsSuperAdmin, paginated). Passed through with the real
    // SystemAuditLogSerializer field names — created_at, user_email,
    // ip_address, old_values / new_values.
    getAuditLogs: async (params?: { action?: string; resource_type?: string; user?: string; page?: number }) => {
      const response = await apiCall<any>('GET', '/management/audit-logs/', undefined, { params })
      const items = Array.isArray(response) ? response : response.results ?? response.data ?? []
      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => ({
          id: String(item.id),
          created_at: item.created_at ?? null,
          user_email:
            item.user_email ??
            (typeof item.user === 'object' ? item.user?.email : null) ??
            null,
          action: item.action ?? '',
          resource_type: item.resource_type ?? '',
          resource_id: item.resource_id ?? null,
          ip_address: item.ip_address ?? null,
          user_agent: item.user_agent ?? null,
          old_values: item.old_values ?? null,
          new_values: item.new_values ?? null,
        })),
      }
    },

    // Billing/Invoices. InvoiceListSerializer: billing_month / total_amount /
    // paid_at / sent_at (no `period` / `amount` / `paid_date`, and no SACCO name
    // on any invoice endpoint). InvoiceListView accepts ?status=, ?billing_month=
    // and — for a super admin — ?sacco_id=.
    getInvoices: async (params?: { status?: string; billing_month?: string; sacco_id?: string }) => {
      const response = await apiCall<any>('GET', '/billing/invoices/', undefined, { params })
      const items = Array.isArray(response) ? response : response.data ?? response.results ?? []
      return {
        count: items.length,
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map(normalizeInvoice),
      }
    },

    getInvoice: async (id: string) => {
      // InvoiceDetailSerializer extends the list serializer with line_items /
      // by_type. Map it to the same shape as the list rows so the two agree.
      const item = await apiCall<any>('GET', `/billing/invoices/${uuid(id)}/`)
      return {
        ...normalizeInvoice(item),
        line_items: Array.isArray(item.line_items) ? item.line_items : [],
        by_type: item.by_type ?? {},
      }
    },

    // CurrentMonthTransactionPreviewView (IsSaccoAdmin). Running total of this
    // month's uninvoiced platform fees; the final invoice is cut on the 1st.
    getCurrentMonthBilling: async () => {
      const response = await apiCall<any>('GET', '/billing/transactions/current-month/')
      return {
        billing_month: response.billing_month ?? '',
        projected_invoice_total: Number(response.projected_invoice_total ?? 0),
        transactions_count: Number(response.transactions_count ?? 0),
        by_type: (response.by_type ?? {}) as Record<
          string,
          { count: number; total_fee: number | string; total_gross_amount: number | string }
        >,
        note: response.note ?? '',
      }
    },

    // NOTE: no invoice "resend" wrapper. /billing/invoices/{id}/resend/ resolves
    // a MonthlySaccoInvoice, but every invoice list/detail endpoint returns
    // Invoice rows (a different table) and nothing exposes MonthlySaccoInvoice
    // ids — so the call can never be made with a valid id from either console.

    downloadInvoice: async (id: string, format: 'csv' | 'pdf' = 'pdf') => {
      const response = await axiosInstance.get(`/billing/invoices/${uuid(id)}/download/`, {
        params: { format },
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `invoice_${id}.${format}`,
      }
    },

    // Liquidity & NPL Analytics
    getLiquidityStatus: () =>
      apiCall<any>('GET', '/management/liquidity/'),

    getNPLDashboard: () =>
      apiCall<any>('GET', '/management/npl/'),

    // Dividends Management
    getDividendDeclarations: async () => {
      const response = await apiCall<any>('GET', '/management/dividends/declarations/')
      const items = Array.isArray(response) ? response : response.data ?? response.results ?? []
      return items.map((item: any) => ({
        id: item.id,
        // financial_year is a CharField on the backend (e.g. "2024/2025").
        financial_year: String(item.financial_year ?? ''),
        savings_type_name: item.savings_type_name ?? '',
        rate_pct: Number(item.declared_rate ?? item.rate_pct ?? 0),
        total_dividend_pool: Number(item.total_dividend_amount ?? item.total_dividend_pool ?? 0),
        status: item.status ?? 'DRAFT',
        period_start: item.period_start ?? null,
        period_end: item.period_end ?? null,
        created_at: item.created_at ?? new Date().toISOString(),
        approved_at: item.approved_at ?? null,
        disbursed_at: item.disbursed_at ?? null,
      }))
    },

    // DividendDeclarationSerializer writable fields: savings_type (a SavingsType
    // UUID belonging to this SACCO), financial_year (string), declared_rate,
    // period_start, period_end (YYYY-MM-DD). SACCO is derived server-side.
    createDividendDeclaration: (data: {
      savings_type: string
      financial_year: string
      declared_rate: number
      period_start: string
      period_end: string
    }) => apiCall<any>('POST', '/management/dividends/declarations/', data),

    getSavingsTypes: async (saccoId: string) => {
      const items = unwrapResults(
        await apiCall<any[] | PaginatedResponse<any>>('GET', '/services/savings-types/', undefined, {
          params: { sacco_id: saccoId },
        })
      )
      return items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name ?? ''),
        description: item.description ?? '',
        interest_rate: Number(item.interest_rate ?? 0),
        minimum_contribution: Number(item.minimum_contribution ?? 0),
        is_active: item.is_active !== false,
        allows_multiple_accounts: !!item.allows_multiple_accounts,
      }))
    },

    // SavingsTypeViewSet write ops (IsSaccoAdmin). `sacco` is read-only —
    // the backend scopes it from the caller's SACCO_ADMIN role.
    createSavingsType: (data: {
      name: string
      description?: string
      interest_rate: number
      minimum_contribution: number
      is_active?: boolean
      allows_multiple_accounts?: boolean
    }) => apiCall<any>('POST', '/services/savings-types/', data),

    updateSavingsType: (
      id: string,
      data: Partial<{
        name: string
        description: string
        interest_rate: number
        minimum_contribution: number
        is_active: boolean
        allows_multiple_accounts: boolean
      }>,
    ) => apiCall<any>('PATCH', `/services/savings-types/${uuid(id)}/`, data),

    deleteSavingsType: (id: string) =>
      apiCall<void>('DELETE', `/services/savings-types/${uuid(id)}/`),

    getDividendDeclaration: (id: string) =>
      apiCall<any>('GET', `/management/dividends/declarations/${uuid(id)}/`),

    calculateDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/calculate/`),

    approveDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/approve/`),

    disburseDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/disburse/`),

    getDividendPayouts: async () => {
      // DividendPayoutSerializer: member_name / member_email /
      // declaration_financial_year / average_balance / dividend_amount /
      // status / created_at. No gross / WHT / share-capital / member_number.
      const response = await apiCall<any>('GET', '/management/dividends/payouts/')
      const items = Array.isArray(response) ? response : response.data ?? response.results ?? []
      return items.map((item: any) => ({
        id: String(item.id),
        member_name: item.member_name ?? '—',
        member_email: item.member_email ?? '',
        financial_year: String(item.declaration_financial_year ?? item.financial_year ?? ''),
        average_balance: Number(item.average_balance ?? 0),
        dividend_amount: Number(item.dividend_amount ?? 0),
        status: String(item.status ?? 'PENDING'),
        created_at: item.created_at ?? new Date().toISOString(),
      }))
    },

    // Bulk SMS Campaigns
    getSMSCampaigns: async () => {
      const response = await apiCall<any>('GET', '/management/sms/campaigns/')
      const items = Array.isArray(response) ? response : response.data ?? response.results ?? []
      const audienceLabel = (f: any): string => {
        if (!f || typeof f !== 'object') return 'All approved members'
        if (f.savings_type) return `${f.savings_type} savers`
        if (f.member_number) return `Member ${f.member_number}`
        if (f.status) return `${String(f.status).toLowerCase()} members`
        return 'All approved members'
      }
      return items.map((item: any) => ({
        id: String(item.id),
        message: String(item.message ?? ''),
        audience_label: audienceLabel(item.audience_filter),
        total_recipients: Number(item.total_recipients ?? 0),
        sent_count: Number(item.sent_count ?? 0),
        failed_count: Number(item.failed_count ?? 0),
        status: String(item.status ?? 'DRAFT'),
        created_at: item.created_at ?? new Date().toISOString(),
      }))
    },

    // Backend reads only `message` + `audience_filter` ({ status | savings_type
    // | member_number }). title / recipient_type / channels are not supported.
    // Only members with active MARKETING consent are eligible recipients.
    createSMSCampaign: (data: {
      message: string
      audience_filter?: { status?: string; savings_type?: string; member_number?: string }
    }) =>
      apiCall<any>('POST', '/management/sms/campaigns/', {
        message: data.message,
        audience_filter: data.audience_filter ?? { status: 'APPROVED' },
      }),

    getSMSCampaign: (id: string) =>
      apiCall<any>('GET', `/management/sms/campaigns/${uuid(id)}/`),

    sendSMSCampaign: (id: string) =>
      apiCall<any>('POST', `/management/sms/campaigns/${uuid(id)}/send/`),

    // NOTE: there is no multi-channel broadcast, delivery-log, or gateway-
    // settings API for a SACCO admin. `/notifications/` returns only the
    // caller's own notifications and `/management/notifications/settings/`
    // does not exist. Member-facing messaging is bulk SMS only — see
    // createSMSCampaign / getSMSCampaigns above (the Bulk SMS page).

    // SASRA Returns. Backend params: type (par|financial_position|membership),
    // as_of_date (par / financial_position), period_start + period_end
    // (membership). Returns the raw report JSON — shape varies by type.
    getSASRAReturns: (params: {
      type: 'par' | 'financial_position' | 'membership'
      as_of_date?: string
      period_start?: string
      period_end?: string
    }) => apiCall<any>('GET', '/management/reports/sasra/', undefined, { params }),

    downloadSASRAReturn: async (params: {
      type: 'par' | 'financial_position' | 'membership'
      as_of_date?: string
      period_start?: string
      period_end?: string
    }) => {
      const response = await axiosInstance.get('/management/reports/sasra/', {
        params: { ...params, format: 'xlsx' },
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `sasra_${params.type}.xlsx`,
      }
    },

    // General Ledger
    getLedgerEntries: async (params: { sacco_id: string; from_date?: string; to_date?: string; category?: string; page?: number }) => {
      const response = await apiCall<any>('GET', '/ledger/entries/', undefined, { params })
      const items = unwrapResults(response)
      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => ({
          id: item.id,
          entry_type: String(item.entry_type || 'CREDIT').toUpperCase(),
          category: item.category,
          amount: Number(item.amount ?? 0),
          reference: item.reference,
          description: item.description,
          balance_after: Number(item.balance_after ?? 0),
          membership_id: item.membership,
          transaction_id: item.transaction,
          created_at: item.created_at ?? new Date().toISOString(),
        })),
      }
    },

    getLedgerBalance: async (saccoId: string) =>
      apiCall<{ sacco_id: string; sacco_name: string; current_balance: number; as_of_date: string | null }>(
        'GET',
        '/ledger/balance/',
        undefined,
        { params: { sacco_id: saccoId } }
      ),

    getLedgerStatement: async (params: { sacco_id: string; from_date: string; to_date: string; page?: number }) =>
      apiCall<any>('GET', '/ledger/statement/', undefined, { params }),

    downloadLedgerStatementPDF: async (params: { sacco_id: string; from_date: string; to_date: string }) => {
      const response = await axiosInstance.get('/ledger/statement/pdf/', {
        params,
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `ledger_statement_${params.from_date}_${params.to_date}.pdf`,
      }
    },
  },

  // ─── SUPER ADMIN ───────────────────────────────────────────────────────────

  superAdmin: {
    getDashboard: async () => {
      const overview = await apiCall<any>('GET', '/management/superadmin/overview/')
      return {
        total_saccos: Number(overview?.active_saccos_count ?? 0),
        active_saccos: Number(overview?.active_saccos_count ?? 0),
        total_members: Number(overview?.total_members ?? 0),
        total_members_on_app: Number(overview?.total_members ?? 0),
        transaction_volume_mtd_kes: Number(overview?.platform_transaction_volume_mtd ?? 0),
        transaction_volume_change_pct: overview?.platform_transaction_volume_change_pct != null
          ? Number(overview.platform_transaction_volume_change_pct)
          : null,
        active_saccos_change_this_month: Number(overview?.active_saccos_change_this_month ?? 0),
        total_members_change_this_month: Number(overview?.total_members_change_this_month ?? 0),
        platform_revenue_mtd_kes: Number(overview?.platform_revenue_mtd ?? 0),
        all_systems_operational: Boolean(overview?.all_systems_operational ?? true),
      }
    },

    // AllSaccosListView has pagination_class = None and accepts no query params,
    // so this always returns the full list — callers filter client-side from
    // one cached fetch rather than refetching per keystroke.
    getSaccos: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/saccos/')
      const items = Array.isArray(response) ? response : response.results ?? []

      return {
        count: items.length,
        next: null,
        previous: null,
        results: items.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug ?? item.name.toLowerCase().replace(/ /g, '-'),
          member_count: item.member_count ?? 0,
          is_active: item.is_active ?? true,
          status: item.is_active ? 'active' : 'suspended',
          health_status: item.health_status ?? 'GOOD',
          last_transaction_at: item.last_transaction_at,
          created_at: item.created_at,
        })),
      }
    },

    getSacco: async (id: string) => {
      // The superadmin SACCO list is the only source that includes suspended /
      // non-publicly-listed SACCOs. The public detail endpoint 404s on those
      // for a role-only super admin, so it is best-effort enrichment only.
      // /management/stats/ is IsSaccoAdmin + SACCO-scoped — it 403s here and is
      // not used.
      const [detail, list] = await Promise.all([
        api.saccos.get(id).catch(() => null),
        api.superAdmin.getSaccos(),
      ])
      const row = list.results.find((s: any) => s.id === id) ?? null

      if (!detail && !row) {
        throw { code: 'NOT_FOUND', message: 'SACCO not found.' }
      }

      const merged = {
        id,
        ...(detail ?? {}),
        ...(row ?? {}),
        name: (detail as any)?.name ?? row?.name ?? 'SACCO',
        is_active: row?.is_active ?? (detail as any)?.is_active ?? true,
        member_count: row?.member_count ?? (detail as any)?.member_count ?? 0,
        health_status: row?.health_status ?? 'GOOD',
        created_at: row?.created_at ?? (detail as any)?.created_at ?? null,
        last_transaction_at: row?.last_transaction_at ?? null,
      }

      const normalized = normalizeSuperAdminSacco(merged)
      return {
        ...normalized,
        created_at: merged.created_at ?? normalized.created_at,
        joined_platform_at: merged.created_at ?? normalized.joined_platform_at,
        admin_team: [],
      }
    },

    assignRole: (data: { user_id: string; role_name: string; sacco_id?: string | null }) =>
      apiCall<any>('POST', '/management/roles/assign/', data),

    revokeRole: (roleId: string) =>
      apiCall<void>('DELETE', `/management/roles/${uuid(roleId)}/`),

    // UserRolesView is paginated and RoleSerializer returns role_name (display
    // label), user_email, sacco_name, created_at — no machine `name`, no nested
    // user / sacco objects.
    getUserRoles: async (userId: string) => {
      const response = await apiCall<any>('GET', '/management/roles/', undefined, {
        params: { user_id: userId },
      })
      const items = Array.isArray(response) ? response : response.results ?? response.data ?? []
      return items.map((r: any) => ({
        id: String(r.id),
        role_label: r.role_name ?? r.name ?? '—',
        user_email: r.user_email ?? r.user?.email ?? '',
        sacco_name: r.sacco_name ?? r.sacco?.name ?? null,
        created_at: r.created_at ?? null,
      }))
    },

    // AllMembersListView uses PageNumberPagination (?page= / ?page_size=),
    // not cursor pagination. next / previous come back as full URLs or null.
    getAllMembers: async (params?: { sacco?: string; search?: string; page?: number }) => {
      const response = await apiCall<any>('GET', '/management/superadmin/members/', undefined, {
        params: {
          sacco_id: params?.sacco,
          search: params?.search,
          page: params?.page,
        }
      })
      const items = response.results ?? []

      return {
        count: Number(response.count ?? items.length),
        next: response.next || null,
        previous: response.previous || null,
        page: Number(params?.page ?? 1),
        results: items.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          email: item.email,
          phone_number: item.phone_number,
          kyc_status: item.kyc_status,
          member_since: item.member_since,
        })),
      }
    },

    getTransactions: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/transactions/live/')
      const results = Array.isArray(response) ? response : response.results || []

      // M-Pesa result codes: 0 = success, 1032 = cancelled, 1037 = duplicate, etc.
      const isSuccess = (stkStatus: string | undefined) => {
        if (!stkStatus) return false
        return stkStatus === '0' || stkStatus === 'SUCCESS' || stkStatus === '200'
      }

      return {
        count: results.length,
        next: null,
        previous: null,
        results: results.map((item: any, i: number) => ({
          id: item.id || `txn-${i}-${item.created_at}`,
          date: item.created_at,
          member_name: item.user_name,
          sacco_name: item.sacco_name,
          txn_type: item.transaction_type || 'transaction',
          amount: Number(item.amount || 0),
          status: isSuccess(item.stk_status) ? 'completed' : 'failed',
          payment_method: 'M-Pesa',
        })),
      }
    },


    getRevenueChart: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/revenue-chart/')
      const items = Array.isArray(response) ? response : response.results || []
      return items.map((item: any) =>
        RevenueChartSchema.parse({
          month: item.month,
          saas_fees: Number(item.saas_fees || 0),
          transaction_fees: Number(item.transaction_fees || 0),
          total_mrr: Number(item.total_mrr || 0),
        })
      )
    },

    // RevenueSummaryView (IsSuperAdmin). Platform-wide invoiced/paid totals,
    // outstanding + overdue counts, suspended SACCOs, and per-SACCO / per-month
    // breakdowns. DecimalFields serialize as strings.
    getRevenueSummary: async () => {
      const r = await apiCall<any>('GET', '/billing/revenue/summary/')
      return {
        total_revenue_all_time: Number(r.total_revenue_all_time ?? 0),
        revenue_this_month: Number(r.revenue_this_month ?? 0),
        revenue_last_month: Number(r.revenue_last_month ?? 0),
        outstanding_invoices_count: Number(r.outstanding_invoices_count ?? 0),
        outstanding_invoices_total: Number(r.outstanding_invoices_total ?? 0),
        overdue_invoices_count: Number(r.overdue_invoices_count ?? 0),
        suspended_saccos_count: Number(r.suspended_saccos_count ?? 0),
        by_sacco: (Array.isArray(r.by_sacco) ? r.by_sacco : []).map((s: any) => ({
          sacco_name: s.sacco_name ?? '—',
          total_invoiced: Number(s.total_invoiced ?? 0),
          total_paid: Number(s.total_paid ?? 0),
          outstanding: Number(s.outstanding ?? 0),
        })),
        by_month: (Array.isArray(r.by_month) ? r.by_month : []).map((m: any) => ({
          month: m.month ?? '',
          total_invoiced: Number(m.total_invoiced ?? 0),
          total_paid: Number(m.total_paid ?? 0),
        })),
      }
    },

    // InvoiceMarkPaidView (IsSuperAdmin). Resolves an Invoice (not
    // MonthlySaccoInvoice) so the id from getInvoices is valid. Records the
    // payment and immediately clears the SACCO's billing suspension.
    // payment_method ∈ mpesa | bank | internal; amount must be >= invoice total.
    markInvoicePaid: (id: string, data: { amount: number; payment_ref: string; payment_method: 'mpesa' | 'bank' | 'internal' }) =>
      apiCall<{ detail: string; invoice_id: string; payment_id: string; status: string }>(
        'POST',
        `/billing/invoices/${uuid(id)}/mark-paid/`,
        { amount: data.amount, payment_ref: data.payment_ref, payment_method: data.payment_method },
      ),

    getTopSaccos: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/top-saccos/')
      const items = Array.isArray(response) ? response : response.results || []
      // Backend TopSaccosSerializer emits health_status as GOOD / REVIEW /
      // API_ISSUE (uppercase). Keep it uppercase to match TopSaccosSchema.
      const HEALTH = new Set(['GOOD', 'REVIEW', 'API_ISSUE'])
      return items.map((item: any) => {
        const health = String(item.health_status ?? 'GOOD').toUpperCase()
        return TopSaccosSchema.parse({
          sacco_id: item.sacco_id,
          sacco_name: item.sacco_name,
          member_count: Number(item.member_count || 0),
          txn_volume_this_month: Number(item.txn_volume_this_month || 0),
          platform_fee_this_month: Number(item.platform_fee_this_month || 0),
          health_status: HEALTH.has(health) ? health : 'GOOD',
        })
      })
    },

    getPlatformAlerts: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/alerts/')
      const items = Array.isArray(response) ? response : response.results || []
      // PlatformAlertSerializer returns { sacco_name, flag_type, description,
      // severity, created_at } and NO id — synthesize a stable key from the
      // content so React keys don't churn between refetches.
      return items.map((item: any) =>
        PlatformAlertSchema.parse({
          id:
            item.id != null
              ? String(item.id)
              : `${item.sacco_name ?? 'alert'}·${item.flag_type ?? ''}·${item.created_at ?? ''}`,
          sacco_name: item.sacco_name ?? '—',
          flag_type: item.flag_type ?? '',
          description: item.description ?? '',
          severity: String(item.severity ?? ''),
          created_at: item.created_at ?? '',
        })
      )
    },

    getKycQueue: async () => {
      const response = await apiCall<any>('GET', '/management/kyc/queue/')
      return unwrapResults(response)
    },

    // NOTE: no AML / transaction-monitoring API exists. ComplianceFlag is
    // exposed only as the read-only /management/superadmin/alerts/ list
    // (see getPlatformAlerts) with no detail / resolve / investigate action.

    getSystemHealth: async () => {
      // The only platform-health source available to a super admin is the
      // unauthenticated readiness probe ({ status, checks: { database, cache } }).
      // There is no per-service registry endpoint, so `services` is always empty.
      // validateStatus lets us read the body on a 503 (degraded) response.
      let readiness: { status: string; checks?: Record<string, boolean> } = {
        status: 'unknown',
        checks: {},
      }
      try {
        const res = await axiosInstance.get('/health/ready/', { validateStatus: () => true })
        if (res.data && typeof res.data === 'object') {
          readiness = res.data as { status: string; checks?: Record<string, boolean> }
        }
      } catch {
        readiness = { status: 'unavailable', checks: {} }
      }
      return {
        services: [] as Array<{ name: string; status: string }>,
        readiness,
      }
    },

    // LoanDisbursementDisputeListView (IsSuperAdmin). Loans a member has
    // reported as "not received" — DISPUTED / UNDER_REVIEW. Read-only queue;
    // resolution happens via the member's confirm-disbursement token or a
    // re-disbursement, not from here.
    getDisbursementDisputes: async () => {
      const response = await apiCall<any>('GET', '/services/loans/disputes/')
      const items = Array.isArray(response) ? response : response?.results ?? []
      return items.map((item: any) => ({
        loan_id: String(item.loan_id ?? ''),
        sacco: String(item.sacco ?? '—'),
        member: String(item.member ?? '').trim() || '—',
        amount: Number(item.amount ?? 0),
        status: String(item.status ?? ''),
        disputed_at: item.disputed_at ?? null,
        dispute_reason: String(item.dispute_reason ?? ''),
        mpesa_conversation_id: String(item.mpesa_conversation_id ?? ''),
        audit_log_count: Number(item.audit_log_count ?? 0),
      }))
    },

    // Delegates to the shared LoanDisbursementAuditView
    // (IsSaccoAdminOrSuperAdmin) — the drill-down for one dispute row.
    getDisbursementAudit: (loanId: string) =>
      api.saccoAdmin.getLoanDisbursementAudit(loanId),
  },
}

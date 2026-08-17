
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
  RegisterInputSchema,
  SaccoConfigSchema,
  SaccoAdminDashboardSchema,
  SaccoSchema,
  STKPushInputSchema,
  AdminMemberSchema,
  AdminLoanSchema,
  AMLFlagSchema,
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
const OTPResponseSchema = z.object({ message: z.string() })
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
    disbursements_mtd_kes: Number(dashboard.disbursements_mtd_kes ?? 0),
    pending_applications: Number(dashboard.pending_applications ?? 0),
    pending_loan_approvals: Number(dashboard.pending_loan_approvals ?? 0),
    pending_kyc_reviews: Number(dashboard.pending_kyc_reviews ?? 0),
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

    sendOTP: (phone: string, purpose: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' = 'PHONE_VERIFY') => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/send/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          purpose: z.enum(['PHONE_VERIFY', 'PASSWORD_RESET', 'LOGIN']).parse(purpose),
        },
        {
          responseSchema: OTPResponseSchema,
        }
      )
    },

    verifyOTP: async (phone: string, code: string, _purpose: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' = 'PHONE_VERIFY') => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/verify/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          code: z.string().length(6).parse(code),
        },
        { responseSchema: OTPResponseSchema }
      )
    },

    resendOTP: (phone: string, purpose: 'PHONE_VERIFY' | 'PASSWORD_RESET' | 'LOGIN' = 'PHONE_VERIFY') => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      return apiCall<{ message: string }>(
        'POST',
        '/accounts/otp/resend/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          purpose: z.enum(['PHONE_VERIFY', 'PASSWORD_RESET', 'LOGIN']).parse(purpose),
        },
        { responseSchema: OTPResponseSchema }
      )
    },

    requestPasswordReset: (emailOrPhone: string) =>
      apiCall<{ message: string }>(
        'POST',
        '/accounts/password/reset/',
        {
          phone_number: z.string().min(10).parse(normalizeKenyanPhoneNumber(emailOrPhone)),
        },
        { responseSchema: PasswordResetResponseSchema }
      ),

    confirmPasswordReset: (data: {
      phone_number: string
      code: string
      new_password: string
      new_password2: string
    }) =>
      apiCall<{ message: string }>(
        'POST',
        '/accounts/password/reset/confirm/',
        {
          phone_number: z.string().min(10).parse(data.phone_number),
          code: z.string().length(6).parse(data.code),
          new_password: z.string().min(6).parse(data.new_password),
          new_password2: z.string().min(6).parse(data.new_password2),
        },
        { responseSchema: PasswordResetResponseSchema }
      ),

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

    registerDevice: (data: { device_id: string; platform: string; push_token?: string; biometric_enabled: boolean }) =>
      apiCall<any>('POST', '/accounts/device/register/', data),

    getDevices: () =>
      apiCall<any[]>('GET', '/accounts/devices/'),

    revokeDevice: (deviceId: string) =>
      apiCall<void>('DELETE', `/accounts/device/${deviceId}/`),
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

      if (!saccoId) {
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
      cursor?: string
    }) => {
      const response = await apiCall<PaginatedResponse<any>>('GET', '/payments/transactions/', undefined, {
        params,
      })
      return {
        ...response,
        results: unwrapResults(response).map(normalizeTransaction),
      }
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

    getDividendPayouts: async () => {
      const response = await apiCall<any>('GET', '/management/dividends/payouts/').catch(() => [])
      const items = Array.isArray(response) ? response : response.results ?? []
      return items.map((item: any) => ({
        id: item.id,
        financial_year: Number(item.financial_year ?? item.declaration?.financial_year ?? new Date().getFullYear() - 1),
        share_capital: Number(item.share_capital ?? 0),
        rate_pct: Number(item.rate_pct ?? item.declaration?.rate_pct ?? 0),
        gross_dividend: Number(item.gross_dividend ?? 0),
        withholding_tax: Number(item.withholding_tax ?? 0),
        net_dividend: Number(item.net_dividend ?? 0),
        status: String(item.status ?? 'PENDING').toUpperCase(),
        disbursed_at: item.disbursed_at ?? null,
      }))
    },

    getNotifications: () =>
      apiCall<PaginatedResponse<AppNotification> | AppNotification[]>('GET', '/notifications/').then(unwrapResults),

    markNotificationRead: (id: string) =>
      apiCall<void>('POST', `/notifications/${uuid(id)}/read/`),

    markAllNotificationsRead: () =>
      apiCall<void>('POST', '/notifications/read-all/'),

    registerDevice: (data: { token: string; platform: 'ios' | 'android' | 'web' | string }) =>
      apiCall<void>('POST', '/notifications/device/', {
        token: data.token,
        platform: String(data.platform).toUpperCase(),
      }),

    getEntries: async (params?: { sacco_id?: string; from_date?: string; to_date?: string }) => {
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
  },

  //  SACCO DISCOVERY 

  saccos: {
    getPublicStats: () =>
      apiCall<{ total_saccos: number; total_members_on_app: number }>('GET', '/accounts/public-stats/'),

    list: (params?: { sector?: string; county?: string; search?: string }) =>
      apiCall<any[] | PaginatedResponse<any>>('GET', '/accounts/saccos/', undefined, {
        params: { verified_only: true, ordering: '-member_count', ...params },
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

    payRegistrationFee: (data: { application_id: string; amount: number; phone_number: string }) =>
      apiCall<any>('POST', '/payments/mpesa/stk-push/', {
        phone_number: data.phone_number,
        amount: data.amount,
        sacco_id: uuid(data.application_id),
        purpose: 'SAVING_DEPOSIT',
      }),

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

    get: (id: string) =>
      api.loans.list().then((loans) => loans.find((loan) => loan.id === id) as LoanApplication),

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
      const loan = await apiCall<any>('POST', '/services/loans/apply/', {
        loan_type: data.loan_product_key,
        amount: Number(data.amount_requested),
        term_months: Number(data.period_months),
        application_notes: data.purpose || '',
      })

      return LoanApplicationSchema.parse({
        id: loan.id,
        ref: loan.reference ?? loan.id,
        sacco_name: loan.membership?.sacco_name ?? membership?.sacco_name ?? '',
        sacco_slug: membership?.sacco_slug ?? '',
        loan_product_key: loan.loan_type?.name ?? data.loan_product_key,
        loan_product_label: loan.loan_type?.name ?? data.loan_product_key,
        amount_requested: Number(loan.amount ?? data.amount_requested),
        period_months: Number(loan.term_months ?? data.period_months),
        interest_rate: Number(loan.interest_rate ?? 0),
        monthly_instalment: Number(loan.monthly_instalment ?? 0),
        total_repayable: Number(loan.total_repayable ?? loan.amount ?? data.amount_requested),
        purpose: loan.application_notes ?? data.purpose,
        status: normalizeLoanStatus(loan.status),
        submitted_at: loan.created_at ?? new Date().toISOString(),
        approved_at: null,
        disbursed_at: null,
        balance_remaining: Number(loan.outstanding_balance ?? loan.amount ?? data.amount_requested),
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
        params: { phone: query },
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

    respondToExternalGuarantorRequest: (responseToken: string, action: 'accept' | 'decline', notes?: string) =>
      apiCall<void>('POST', `/guarantors/external/respond/${responseToken}/`, {
        action: action === 'accept' ? 'ACCEPT' : 'DECLINE',
        notes: notes,
      }),

    getGuarantorRequestDetails: async (responseToken: string) => {
      const response = await apiCall<any>('GET', `/guarantors/external/respond/${responseToken}/`).catch(() => null)
      return {
        token: responseToken,
        borrower_name: response?.borrower_name ?? response?.borrower ?? 'Borrower',
        borrower_phone: response?.borrower_phone ?? '—',
        loan_product_name: response?.loan_product_name ?? response?.loan_type ?? 'Loan',
        guarantee_amount: Number(response?.guarantee_amount ?? response?.amount ?? 0),
        savings_balance: Number(response?.savings_balance ?? response?.guarantor_savings ?? 0),
        status: String(response?.status ?? 'PENDING').toUpperCase(),
      }
    },

    respondToGuarantorRequest: (id: string, action: 'approve' | 'decline') => {
      const [loanId, guarantorId] = id.split(':')
      return apiCall<void>('POST', `/services/loans/${uuid(loanId)}/guarantors/${uuid(guarantorId)}/respond/`, {
        action: action === 'approve' ? 'APPROVE' : 'DECLINE',
      })
    },

    confirmDisbursement: (loanId: string) =>
      apiCall<void>('POST', '/services/loans/confirm-disbursement/', { loan_id: uuid(loanId) }),

    disputeDisbursement: (loanId: string, reason: string) =>
      apiCall<void>('POST', '/services/loans/dispute-disbursement/', { loan_id: uuid(loanId), reason }),
  },

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────

  payments: {
    stkPush: (data: STKPushInput) =>
      apiCall<any>('POST', '/payments/mpesa/stk-push/', parseInput(STKPushInputSchema, data), {
        idempotent: true,
      }).then(normalizeStkPushResponse),

    checkStatus: (ref: string) =>
      apiCall<{ status: string; completed_at: string | null }>(
        'GET',
        `/payments/mpesa/stk/${requiredString(ref)}/status/`
      ),

    getMpesaDetails: (id: string) =>
      apiCall<any>('GET', `/payments/mpesa/${uuid(id)}/`),

    b2cDisburse: (data: { loan_id: string; amount: number; phone_number: string; remarks?: string }) =>
      apiCall<any>('POST', '/payments/mpesa/b2c/disburse/', {
        loan_id: uuid(data.loan_id),
        amount: data.amount,
        phone_number: data.phone_number,
        remarks: data.remarks ?? 'Loan disbursement',
      }, { idempotent: true }).then(normalizeStkPushResponse),

    checkB2cStatus: (conversationId: string) =>
      apiCall<{ status: string; completed_at: string | null }>(
        'GET',
        `/payments/mpesa/b2c/${requiredString(conversationId)}/status/`
      ),

    getB2cHistory: async (saccoId?: string) => {
      const params = saccoId ? { sacco_id: saccoId } : undefined
      const response = await apiCall<any>('GET', '/payments/mpesa/b2c/history/', undefined, { params })
      return Array.isArray(response) ? response : response.results ?? []
    },
  },

  // ─── KYC ───────────────────────────────────────────────────────────────────

  kyc: {
    getStatus: () =>
      apiCall<{
        kyc_status: string
        documents: Array<{ doc_type: string; status: string }>
      }>('GET', '/accounts/kyc/status/'),

    submitId: (data: { id_number: string; date_of_birth: string }) =>
      apiCall<{ message: string; status: string }>(
        'POST',
        '/accounts/kyc/submit-id/',
        {
          id_number: z.string().min(1).parse(data.id_number),
          date_of_birth: z.string().min(1).parse(data.date_of_birth),
        },
        { responseSchema: OTPResponseSchema }
      ),

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

    createMember: async (data: { first_name: string; last_name: string; email: string; phone_number: string; national_id: string }) =>
      apiCall<any>('POST', '/management/members/', data),

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

    getApplicationDetail: async (id: string) =>
      apiCall<any>('GET', `/management/applications/${uuid(id)}/review/`),

    reviewApplication: (id: string, data: { status: 'APPROVED' | 'REJECTED'; review_notes?: string }) => {
      return apiCall<void>('PATCH', `/management/applications/${uuid(id)}/review/`, data)
    },


    // Role management
    getRoles: async (userId: string) => apiCall<any>('GET', '/management/roles/', undefined, {
      params: { user_id: userId }
    }),

    assignRole: async (data: { user_id: string; role_name: string; sacco_id?: string }) =>
      apiCall<any>('POST', '/management/roles/assign/', data),

    revokeRole: async (roleId: string) =>
      apiCall<any>('DELETE', `/management/roles/${uuid(roleId)}/`),


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
          phone_number: item.phone_number || item.member_phone || '',
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

    downloadReport: async (params: { type: 'loans' | 'contributions' | 'members'; from_date?: string; to_date?: string; format?: 'csv' | 'pdf' }) => {
      const response = await axiosInstance.get('/management/reports/', {
        params: { ...params, format: params.format || 'pdf' },
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `sacco_report_${params.type}.${params.format || 'pdf'}`,
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
    getExternalGuarantors: async () => {
      const response = await apiCall<any>('GET', '/management/external-guarantors/')
      const items = Array.isArray(response.results) ? response.results : []
      return {
        count: Number(response.count ?? items.length),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => ({
          id: item.id,
          loan_id: item.loan_id,
          member_name: item.member_name,
          guarantor_name: item.guarantor_name,
          guarantor_phone: item.guarantor_phone,
          guarantor_national_id: item.guarantor_national_id,
          amount: Number(item.amount ?? 0),
          status: item.status,
          created_at: item.created_at,
        })),
      }
    },

    reviewExternalGuarantor: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
      apiCall<void>('PATCH', `/management/external-guarantors/${uuid(id)}/review/`, {
        action: data.action === 'approve' ? 'APPROVE' : 'REJECT',
        admin_notes: data.notes,
      }),

    // Internal guarantors & savings holds
    getInternalGuarantors: async (params?: { status?: string }) => {
      const response = await apiCall<any>('GET', '/management/guarantors/internal/', undefined, { params }).catch(() => null)
      const items = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : []
      return {
        count: Number(response?.count ?? items.length),
        next: response?.next ?? null,
        previous: response?.previous ?? null,
        results: items.map((item: any) => ({
          id: item.id,
          loan_id: item.loan_id ?? item.loan?.id,
          borrower_name: item.borrower_name ?? item.loan?.membership?.user?.full_name ?? '—',
          guarantor_name: item.guarantor_name ?? item.guarantor_user?.full_name ?? '—',
          guarantor_number: item.guarantor_number ?? item.guarantor_user?.phone_number ?? '—',
          guarantee_amount: Number(item.guarantee_amount ?? item.amount ?? 0),
          savings_balance: Number(item.savings_balance ?? item.guarantor_savings?.amount ?? 0),
          frozen_hold_amount: Number(item.frozen_hold_amount ?? item.guarantee_amount ?? 0),
          status: String(item.status ?? 'APPROVED').toUpperCase(),
          created_at: item.created_at ?? new Date().toISOString(),
        })),
      }
    },

    releaseGuarantorHold: (id: string, notes?: string) =>
      apiCall<void>('POST', `/management/guarantors/internal/${uuid(id)}/release/`, { notes }),

    // Audit logs
    getAuditLogs: async (params?: { action?: string; resource_type?: string; cursor?: string }) => {
      const response = await apiCall<any>('GET', '/management/audit-logs/', undefined, { params })
      const items = Array.isArray(response) ? response : response.results ?? []
      return {
        count: items.length,
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          user: item.user?.full_name ?? item.user_id,
          action: item.action,
          resource_type: item.resource_type,
          resource_id: item.resource_id,
          details: item.details,
        })),
      }
    },

    // Billing/Invoices
    getInvoices: async () => {
      const response = await apiCall<any>('GET', '/billing/invoices/')
      const items = Array.isArray(response) ? response : response.results ?? []
      return {
        count: items.length,
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: items.map((item: any) => ({
          id: item.id,
          invoice_number: item.invoice_number,
          period: item.period,
          amount: Number(item.amount ?? 0),
          status: String(item.status ?? 'pending').toLowerCase(),
          due_date: item.due_date,
          paid_date: item.paid_date,
          sacco: item.sacco,
        })),
      }
    },

    getInvoice: (id: string) =>
      apiCall<any>('GET', `/billing/invoices/${uuid(id)}/`),

    resendInvoice: (id: string) =>
      apiCall<void>('POST', `/billing/invoices/${uuid(id)}/resend/`),

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
      const items = Array.isArray(response) ? response : response.results ?? []
      return items.map((item: any) => ({
        id: item.id,
        financial_year: Number(item.financial_year ?? new Date().getFullYear()),
        rate_pct: Number(item.rate_pct ?? item.dividend_rate ?? 0),
        total_dividend_pool: Number(item.total_dividend_pool ?? item.total_amount ?? 0),
        status: item.status ?? 'DRAFT',
        created_at: item.created_at ?? new Date().toISOString(),
        approved_at: item.approved_at ?? null,
        disbursed_at: item.disbursed_at ?? null,
      }))
    },

    createDividendDeclaration: (data: { financial_year: number; rate_pct: number }) =>
      apiCall<any>('POST', '/management/dividends/declarations/', data),

    getDividendDeclaration: (id: string) =>
      apiCall<any>('GET', `/management/dividends/declarations/${uuid(id)}/`),

    calculateDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/calculate/`),

    approveDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/approve/`),

    disburseDividend: (id: string) =>
      apiCall<any>('POST', `/management/dividends/declarations/${uuid(id)}/disburse/`),

    getDividendPayouts: async () => {
      const response = await apiCall<any>('GET', '/management/dividends/payouts/')
      const items = Array.isArray(response) ? response : response.results ?? []
      return items.map((item: any) => ({
        id: item.id,
        member_name: item.member_name ?? item.member?.full_name ?? '—',
        member_number: item.member_number ?? item.member?.member_number ?? '—',
        share_capital: Number(item.share_capital ?? 0),
        gross_dividend: Number(item.gross_dividend ?? 0),
        withholding_tax: Number(item.withholding_tax ?? 0),
        net_dividend: Number(item.net_dividend ?? 0),
        status: item.status ?? 'PENDING',
        disbursed_at: item.disbursed_at ?? null,
      }))
    },

    // Bulk SMS Campaigns
    getSMSCampaigns: async () => {
      const response = await apiCall<any>('GET', '/management/sms/campaigns/')
      const items = Array.isArray(response) ? response : response.results ?? []
      return items.map((item: any) => ({
        id: item.id,
        title: item.title ?? 'Campaign',
        message: item.message ?? '',
        recipient_type: item.recipient_type ?? 'ALL_MEMBERS',
        total_recipients: Number(item.total_recipients ?? item.recipient_count ?? 0),
        status: item.status ?? 'DRAFT',
        created_at: item.created_at ?? new Date().toISOString(),
        sent_at: item.sent_at ?? null,
      }))
    },

    createSMSCampaign: (data: { title: string; message: string; recipient_type: string }) =>
      apiCall<any>('POST', '/management/sms/campaigns/', data),

    getSMSCampaign: (id: string) =>
      apiCall<any>('GET', `/management/sms/campaigns/${uuid(id)}/`),

    sendSMSCampaign: (id: string) =>
      apiCall<any>('POST', `/management/sms/campaigns/${uuid(id)}/send/`),

    // Multi-Channel Notifications Control
    getNotificationLogs: async (params?: { channel?: string; category?: string; status?: string }) => {
      const response = await apiCall<any>('GET', '/notifications/', undefined, { params }).catch(() => null)
      const items = unwrapResults(response ?? [])
      return {
        count: Number(response?.count ?? items.length),
        results: items.map((item: any) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          category: item.category ?? 'SYSTEM',
          channel: item.channel ?? (item.push_sent ? 'PUSH' : 'SMS'),
          user_email: item.user?.email ?? item.user_email ?? '—',
          is_read: Boolean(item.is_read),
          push_sent: Boolean(item.push_sent),
          created_at: item.created_at ?? new Date().toISOString(),
        })),
      }
    },

    getNotificationSettings: async () =>
      apiCall<any>('GET', '/management/notifications/settings/').catch(() => ({
        sms_enabled: true,
        email_enabled: true,
        push_enabled: true,
        at_username: 'sandbox',
        at_api_key_configured: true,
        fcm_project_id_configured: true,
        triggers: {
          loan_approval: true,
          loan_overdue: true,
          guarantor_request: true,
          liquidity_warning: true,
          dividend_declaration: true,
        },
      })),

    updateNotificationSettings: (data: any) =>
      apiCall<any>('PATCH', '/management/notifications/settings/', data).catch(() => data),

    sendMultiChannelBroadcast: (data: {
      title: string
      message: string
      channels: Array<'SMS' | 'EMAIL' | 'PUSH'>
      recipient_type: string
    }) =>
      apiCall<any>('POST', '/management/sms/campaigns/', {
        title: data.title,
        message: data.message,
        recipient_type: data.recipient_type,
        channels: data.channels,
      }),

    // SASRA Returns
    getSASRAReturns: async (params?: { report_type?: 'form1' | 'form2'; period?: string }) =>
      apiCall<any>('GET', '/management/reports/sasra/', undefined, { params }),

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

    getSaccos: async (params?: { status?: string; search?: string }) => {
      const response = await apiCall<any>('GET', '/management/superadmin/saccos/')
      let items = Array.isArray(response) ? response : response.results ?? []

      if (params?.search) {
        items = items.filter((item: any) =>
          item.name?.toLowerCase().includes(params.search!.toLowerCase())
        )
      }
      if (params?.status) {
        items = items.filter((item: any) =>
          (params.status === 'active' && item.is_active) ||
          (params.status === 'suspended' && !item.is_active)
        )
      }

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
      const sacco = await api.saccos.get(id)
      const stats = await apiCall<any>('GET', '/management/stats/', undefined, {
        params: { sacco_id: sacco.id }
      }).catch(() => null)

      return {
        ...normalizeSuperAdminSacco({
          ...sacco,
          transaction_volume_mtd_kes: stats?.transaction_volume_mtd_kes ?? stats?.monthly_contributions ?? 0,
          platform_fee_kes: stats?.platform_fee_kes ?? 0,
        }),
        admin_team: [],
      }
    },

    assignRole: (data: { user_id: string; role_name: string; sacco_id?: string | null }) =>
      apiCall<any>('POST', '/management/roles/assign/', data),

    revokeRole: (roleId: string) =>
      apiCall<void>('DELETE', `/management/roles/${uuid(roleId)}/`),

    getUserRoles: (userId: string) =>
      apiCall<any[]>('GET', '/management/roles/', undefined, { params: { user_id: userId } }),

    getAllMembers: async (params?: { sacco?: string; search?: string; cursor?: string }) => {
      const response = await apiCall<any>('GET', '/management/superadmin/members/', undefined, {
        params: {
          sacco_id: params?.sacco,
          search: params?.search,
          cursor: params?.cursor,
        }
      })
      const items = response.results ?? []

      return {
        count: Number(response.count ?? items.length),
        next: response.next || null,
        previous: response.previous || null,
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

    getTopSaccos: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/top-saccos/')
      const items = Array.isArray(response) ? response : response.results || []
      return items.map((item: any) =>
        TopSaccosSchema.parse({
          sacco_id: item.sacco_id,
          sacco_name: item.sacco_name,
          member_count: Number(item.member_count || 0),
          txn_volume_this_month: Number(item.txn_volume_this_month || 0),
          platform_fee_this_month: Number(item.platform_fee_this_month || 0),
          health_status: String(item.health_status ?? 'GOOD').toLowerCase(),
        })
      )
    },

    getPlatformAlerts: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/alerts/')
      const items = Array.isArray(response) ? response : response.results || []
      return items.map((item: any) =>
        PlatformAlertSchema.parse({
          id: item.id ?? `${item.sacco_name ?? 'alert'}-${Date.now()}-${Math.random()}`,
          sacco_name: item.sacco_name,
          flag_type: item.flag_type,
          description: item.description,
          severity: item.severity,
          created_at: item.created_at,
        })
      )
    },

    getKycQueue: async () => {
      const response = await apiCall<any>('GET', '/management/kyc/queue/')
      return unwrapResults(response)
    },

    getAMLFlags: async () => {
      try {
        const queue = await api.superAdmin.getKycQueue()
        const normalizeRisk = (value: unknown): 'low' | 'medium' | 'high' => {
          const level = String(value ?? 'medium').toLowerCase()
          if (level === 'low' || level === 'high') return level
          return 'medium'
        }
        const normalizeStatus = (value: unknown): 'open' | 'under_review' | 'resolved' | 'escalated' => {
          const status = String(value ?? 'open').toLowerCase()
          if (status === 'under_review' || status === 'resolved' || status === 'escalated') return status
          return 'open'
        }

        return queue.map((item: any) =>
          AMLFlagSchema.parse({
            id: item.id,
            member_name:
              item.user?.full_name ??
              `${item.user?.first_name ?? ''} ${item.user?.last_name ?? ''}`.trim(),
            sacco_name: item.sacco?.name ?? item.membership?.sacco_name ?? '',
            transaction_ref: item.reference ?? '',
            flag_reason: item.review_notes ?? item.status ?? 'KYC review required',
            amount: Number(item.amount ?? 0),
            risk_level: normalizeRisk(item.risk_level),
            status: normalizeStatus(item.status),
            flagged_at: item.created_at ?? item.flagged_at ?? new Date().toISOString(),
          })
        )
      } catch {
        return []
      }
    },

    resolveAMLFlag: (_id: string, _notes: string) =>
      apiCall<void>('PATCH', `/management/kyc/${uuid(_id)}/review/`, {
        status: 'APPROVED',
        review_notes: _notes,
      }),

    getSystemHealth: async () => {
      const [stats, readiness] = await Promise.all([
        apiCall<Record<string, unknown>>('GET', '/management/stats/').catch(() => ({} as Record<string, unknown>)),
        apiCall<{ status: string; checks?: Record<string, boolean> }>('GET', '/health/ready/').catch(() => ({ status: 'unknown' })),
      ])
      return {
        services: Array.isArray(stats.services) ? stats.services : [],
        readiness,
      }
    },
  },
}


import { apiCall, axiosInstance, setAccessToken } from './core'
import type {
  LoginInput,
  RegisterInput,
  User,
  Sacco,
  SaccoConfig,
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
  NotificationSchema,
  PlatformMemberSchema,
  RevenueChartSchema,
  TopSaccosSchema,
  PlatformAlertSchema,
} from '@saccosphere/schemas'
import { z } from 'zod'

const RefreshResponseSchema = z.object({ access: z.string() })
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
  return UserSchema.parse({
    ...user,
    phone: user.phone ?? user.phone_number ?? '',
    phone_number: user.phone_number ?? user.phone ?? '',
    role: roleOverrides?.role ?? 'member',
    kyc_status: kycStatus === 'approved' ? 'verified' : kycStatus,
    national_id: user.national_id ?? null,
    sacco_id: roleOverrides?.sacco_id ?? user.sacco_id ?? null,
    sacco_slug: roleOverrides?.sacco_slug ?? user.sacco_slug ?? null,
    created_at: createdAt,
  })
}


const normalizeKenyanPhoneNumber = (phone: string) => {
  const cleaned = String(phone).trim().replace(/[\s-()]+/g, '')
  if (cleaned.startsWith('+')) {
    return `+${cleaned.slice(1).replace(/[^0-9]/g, '')}`
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    return `+254${cleaned.slice(1)}`
  }
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return `+254${cleaned}`
  }
  return cleaned
}

const normalizeSacco = (sacco: any): Sacco => {
  const membershipType = String(sacco.membership_type ?? (sacco.membership_open === false ? 'closed' : 'open')).toLowerCase()
  const slug =
    sacco.slug ??
    String(sacco.name ?? sacco.id)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return SaccoSchema.parse({
    ...sacco,
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
    status: sacco.status ?? (sacco.is_active === false ? 'suspended' : 'active'),
    sasra_reg_no: sacco.sasra_reg_no ?? '',
    sector: sacco.sector ?? 'SACCO',
    county: sacco.county ?? '',
    logo_url: sacco.logo_url ?? sacco.logo ?? undefined,
    member_count: Number(sacco.member_count ?? 0),
    loan_rate_pct: Number(sacco.loan_rate_pct ?? sacco.default_interest_rate ?? 0),
    loan_multiplier: Number(sacco.loan_multiplier ?? 0),
  })
}

const normalizeSuperAdminSacco = (sacco: any): SuperAdminSacco => {
  const base = normalizeSacco(sacco)
  const status = String(sacco.status ?? (sacco.is_active === false ? 'suspended' : 'active')).toLowerCase()
  const feeStatus = String(sacco.fee_status ?? 'paid').toLowerCase()
  const normalizedFeeStatus = feeStatus === 'pending' || feeStatus === 'overdue' ? feeStatus : 'paid'
  const health = String(sacco.health ?? 'healthy').toLowerCase()
  const normalizedHealth = health === 'warning' || health === 'critical' ? health : 'healthy'

  return SuperAdminSaccoSchema.parse({
    id: base.id,
    slug: base.slug,
    name: base.name,
    sector: base.sector ?? 'unknown',
    initials: base.initials,
    color: base.color,
    sasra_reg_no: base.sasra_reg_no,
    status: status === 'suspended' ? 'suspended' : status === 'onboarding' ? 'onboarding' : 'active',
    member_count: Number(base.member_count ?? 0),
    members_on_app: Number(base.member_count ?? 0),
    transaction_volume_mtd_kes: Number(sacco.transaction_volume_mtd_kes ?? 0),
    platform_fee_kes: Number(sacco.platform_fee_kes ?? 0),
    fee_status: normalizedFeeStatus,
    api_connected: Boolean(sacco.api_connected ?? true),
    health: normalizedHealth,
    joined_platform_at: sacco.joined_platform_at ?? (base as Sacco & { created_at?: string }).created_at ?? new Date().toISOString(),
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
  const user = member.user ?? {}
  const fullName = String(user.full_name ?? '').trim()
  const [first_name, ...rest] = fullName.split(' ')
  const last_name = rest.join(' ') || first_name
  const statusMap: Record<string, AdminMember['membership_status']> = {
    PENDING: 'applied',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'active',
    REJECTED: 'withdrawn',
    SUSPENDED: 'suspended',
    LEFT: 'withdrawn',
  }
  const kycStatus = String(user.kyc_status ?? 'pending').toLowerCase()
  const membershipStatus = statusMap[String(member.status ?? 'PENDING').toUpperCase()] ?? 'applied'
  const recentTransactions = Array.isArray(member.recent_transactions) ? member.recent_transactions : []

  return AdminMemberSchema.parse({
    id: member.id,
    user_id: user.id ?? null,
    saccosphere_id: member.member_number ? `SS-${member.member_number}` : member.id,
    member_number: member.member_number ?? '',
    first_name: first_name ?? '',
    last_name: last_name ?? '',
    email: user.email ?? '',
    phone: user.phone_number ?? user.phone ?? '',
    national_id: user.national_id ?? null,
    kyc_status:
      kycStatus === 'verified' || kycStatus === 'approved'
        ? 'verified'
        : kycStatus === 'rejected'
          ? 'rejected'
          : kycStatus === 'under_review'
            ? 'under_review'
            : 'pending',
    membership_status: membershipStatus,
    bosa_balance: Number(member.savings_total ?? 0),
    fosa_balance: 0,
    share_capital: 0,
    active_loans_count: Number(member.active_loans?.length ?? 0),
    active_loans_kes: Number(member.outstanding_loans ?? 0),
    monthly_contribution: 0,
    repayment_rate_pct: 0,
    joined_at: member.approved_date ?? member.application_date ?? null,
    last_active: recentTransactions[0]?.created_at ?? null,
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

const normalizeNotification = (item: any): AppNotification => {
  const category = String(item.type ?? item.category ?? 'system').toLowerCase()
  const typeMap: Record<string, AppNotification['type']> = {
    loan: 'loan_approved',
    payment: 'contribution_received',
    alert: 'system',
    guarantor: 'guarantor_request',
    dividend: 'dividend_credited',
    system: 'system',
  }
  const type = NotificationSchema.shape.type.safeParse(category).success
    ? category as AppNotification['type']
    : typeMap[category] ?? 'system'

  return NotificationSchema.parse({
    id: item.id,
    title: item.title ?? 'Notification',
    body: item.body ?? item.message ?? '',
    type,
    is_read: Boolean(item.is_read),
    deep_link: item.deep_link ?? item.action_url ?? undefined,
    sacco_name: item.sacco_name ?? undefined,
    created_at: item.created_at,
  })
}

const normalizeLoanStatus = (status: unknown): LoanApplication['status'] => {
  const normalized = String(status ?? 'PENDING').toLowerCase()
  const statusMap: Record<string, LoanApplication['status']> = {
    pending: 'submitted',
    guarantors_pending: 'guarantors_pending',
    board_review: 'under_review',
    approved: 'approved',
    disbursement_pending: 'disbursement_pending',
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

// PAGINATED RESPONSE 

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

      return AuthTokensSchema.parse({
        access: payload.access,
        refresh: payload.refresh,
        user: normalizeUser(payload.user),
      })
    },

    googleAuth: async (data: { id_token: string; flow: 'login' | 'signup' }) => {
      const payload = await apiCall<any>('POST', '/accounts/oauth/google/callback/', {
        id_token: data.id_token,
        flow: data.flow,
      })

      setAccessToken(payload.access)

      return AuthTokensSchema.parse({
        access: payload.access,
        refresh: payload.refresh,
        user: normalizeUser(payload.user),
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

    logout: () =>
      apiCall<void>('POST', '/accounts/logout/'),

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

    verifyOTP: async (phone: string, code: string) => {
      const normalizedPhone = normalizeKenyanPhoneNumber(phone)
      const payload = await apiCall<any>(
        'POST',
        '/accounts/otp/verify/',
        {
          phone_number: z.string().min(10).parse(normalizedPhone),
          code: z.string().length(6).parse(code),
        }
      )
      return normalizeUser(payload)
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
  },

  //  MEMBER PROFILE and DASHBOARD

  member: {
    getProfile: async () => normalizeUser(await apiCall<any>('GET', '/accounts/me/')),

    updateProfile: (data: Partial<User>) =>
      apiCall<User>('PATCH', '/accounts/me/', data, { responseSchema: UserSchema }),

    getDashboard: async () => {
      const portfolio = await apiCall<any>('GET', '/dashboard/portfolio/')
      const memberships = await api.member.getMemberships()
      return DashboardSchema.parse({
        total_balance: Number(portfolio.total_balance ?? portfolio.total_savings ?? 0),
        total_savings: Number(portfolio.total_savings ?? 0),
        active_loans_balance: Number(portfolio.active_loans_balance ?? portfolio.total_loans ?? portfolio.total_active_loans ?? 0),
        sacco_count: Number(portfolio.sacco_count ?? portfolio.total_saccos ?? portfolio.saccos?.length ?? memberships.length),
        memberships,
        recent_transactions: (portfolio.recent_transactions ?? []).map(normalizeTransaction),
      })
    },

    getMemberships: async () =>
      unwrapResults(await apiCall<any[] | PaginatedResponse<any>>('GET', '/members/memberships/')).map(normalizeMembership),

    getMembership: async (id: string) =>
      normalizeMembership(await apiCall<any>('GET', `/members/memberships/${uuid(id)}/`)),

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

    getNotifications: () =>
      apiCall<PaginatedResponse<AppNotification> | AppNotification[]>('GET', '/notifications/').then(unwrapResults),

    markNotificationRead: (id: string) =>
      apiCall<void>('POST', `/notifications/${uuid(id)}/read/`),

    markAllNotificationsRead: () =>
      apiCall<void>('POST', '/notifications/read-all/'),

    registerDevice: (data: { token: string; platform: 'ios' | 'android' }) =>
      apiCall<void>('POST', '/notifications/device/', data),

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
        params,
      }).then((items) => unwrapResults(items).map(normalizeSacco)),

    get: async (slug: string) => {
      const key = requiredString(slug)
      if (/^[0-9a-f-]{36}$/i.test(key)) {
        return normalizeSacco(await apiCall<any>('GET', `/accounts/saccos/${key}/`))
      }
      const saccos = await api.saccos.list({ search: key })
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
      monthly_contribution: number
    }) => {
      const sacco = await api.saccos.get(data.sacco_slug)
      
      // Map custom fields from form_data to backend format
      // Only include fields that are not the standard employment fields
      const standardFields = ['employer', 'employmentType', 'monthlyIncome']
      const customFields = Object.entries(data.form_data ?? {})
        .filter(([key]) => !standardFields.includes(key))
        .map(([field_id, value]) => ({
          field_id,
          value: String(value ?? ''),
        }))
      
      // Extract employment fields from form_data
      const employmentStatus = String(data.form_data?.employmentType ?? 'Employed — salaried')
      const employerName = String(data.form_data?.employer ?? '')
      const monthlyIncome = Number(data.form_data?.monthlyIncome ?? 0)
      
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

    payRegistrationFee: (_id: string) =>
      Promise.reject(new Error('Registration-fee STK push is not supported by the current backend contract.')),
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
      return Array.isArray(response) ? response.map((item: any) => ({
        type: item.savings_type ?? item.type,
        amount: Number(item.amount ?? 0),
        percentage: Number(item.percentage ?? 0),
      })) : []
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

    getEligibility: async (membershipId: string) => {
      const response = await apiCall<any>('GET', '/services/loans/eligibility/', undefined, {
        params: { membership_id: membershipId },
      })
      return {
        max_amount: Number(response.max_amount ?? 0),
        max_term_months: Number(response.max_term_months ?? 0),
        available_multiplier: Number(response.available_multiplier ?? 1),
        reasons: response.reasons ?? [],
      }
    },

    getSchedule: async (loanId: string) => {
      const response = await apiCall<any>('GET', `/services/loans/${uuid(loanId)}/schedule/`)
      return Array.isArray(response) ? response.map((item: any) => ({
        instalment_number: Number(item.instalment_number ?? 0),
        due_date: item.due_date,
        amount: Number(item.amount ?? 0),
        principal: Number(item.principal ?? 0),
        interest: Number(item.interest ?? 0),
        balance_after: Number(item.balance_after ?? 0),
        status: String(item.status ?? 'pending').toLowerCase(),
      })) : []
    },

    apply: async (data: LoanApplicationInput) => {
      const membership = await api.member.getMembership(data.membership_id).catch(() => null)
      const loan = await apiCall<any>('POST', '/services/loans/apply/', {
        loan_type: data.loan_product_key,
        amount: data.amount_requested,
        term_months: data.period_months,
        application_notes: data.purpose,
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
        disbursement_method: data.disbursement_method,
        disbursement_account: data.disbursement_account,
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

    respondToGuarantorRequest: (id: string, action: 'approve' | 'decline') => {
      const [loanId, guarantorId] = id.split(':')
      return apiCall<void>('POST', `/services/loans/${uuid(loanId)}/guarantors/${uuid(guarantorId)}/respond/`, {
        action: action === 'approve' ? 'APPROVE' : 'DECLINE',
      })
    },
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

    submitId: (data: { national_id: string }) =>
      apiCall<{ message: string; status: string }>(
        'POST',
        '/accounts/kyc/submit-id/',
        {
          national_id: z.string().min(1).parse(data.national_id),
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
      const file = 'file' in data.file && data.file.file ? data.file.file : data.file
      const form = new FormData()
      form.append('document_type', documentType)
      form.append('file', file as Blob)
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
          guarantors_summary: item.guarantors_summary,
          required_documents: item.required_documents,
        })),
      }
    },

    // General loan list (if needed for other views)
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

    reviewLoan: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
      apiCall<void>('PATCH', `/management/loans/${uuid(id)}/status/`, {
        status: data.action === 'approve' ? 'APPROVED' : 'REJECTED',
        notes: data.notes,
      }),

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
      const stats = await apiCall<any>('GET', '/management/stats/')
      const results = Array.isArray(stats.recent_transactions) ? stats.recent_transactions.map((item: any) => ({
        id: item.id,
        date: item.created_at,
        amount: Number(item.amount ?? 0),
        payment_method: String(item.transaction_type ?? 'internal').toLowerCase(),
        payment_ref: item.reference ?? '',
        platform_fee: 0,
        description: item.description ?? '',
        status: String(item.status ?? 'completed').toLowerCase(),
        balance_after: 0,
        ref: item.reference ?? '',
        txn_type: 'contribution',
        direction: 'credit' as const,
        sacco_name: '',
        sacco_slug: '',
        completed_at: item.created_at ?? null,
      })) : []
      return {
        count: results.length,
        next: null,
        previous: null,
        results,
      }
    },

    getDisbursements: async () => {
      const response = await apiCall<any>('GET', '/payments/mpesa/b2c/history/')
      const items = Array.isArray(response) ? response : response.results ?? []
      return {
        count: items.length,
        next: null,
        previous: null,
        results: items.map((item: any) => ({
          id: item.id,
          date: item.created_at,
          amount: Number(item.amount ?? 0),
          phone_number: item.phone_number ?? '',
          status: String(item.status ?? 'pending').toLowerCase(),
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

    getReports: async () => apiCall<Record<string, unknown>>('GET', '/management/stats/'),

    downloadReport: async (format: 'csv' | 'pdf' = 'pdf') => {
      const response = await axiosInstance.get('/management/stats/', {
        params: { format },
        responseType: 'blob',
      })
      const disposition = String(response.headers?.['content-disposition'] ?? '')
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i)
      return {
        blob: response.data as Blob,
        filename: filenameMatch?.[1] ?? `sacco_report.${format}`,
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
        job_id: response.job_id,
        status: response.status,
        progress: Number(response.progress ?? 0),
        total_records: Number(response.total_records ?? 0),
        processed_records: Number(response.processed_records ?? 0),
        failed_records: Number(response.failed_records ?? 0),
        error_summary: response.error_summary ?? [],
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
        status: data.action === 'approve' ? 'APPROVED' : 'REJECTED',
        review_notes: data.notes,
      }),

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
  },

  // ─── SUPER ADMIN ───────────────────────────────────────────────────────────

  superAdmin: {
    getDashboard: async () => {
      const overview = await apiCall<any>('GET', '/management/superadmin/overview/').catch(() => null)
      return {
        total_saccos: overview?.active_saccos_count ?? 0,
        active_saccos: overview?.active_saccos_count ?? 0,
        total_members: overview?.total_members ?? 0,
        total_members_on_app: overview?.total_members ?? 0,
        transaction_volume_mtd_kes: Number(overview?.platform_transaction_volume_mtd ?? 0),
        transaction_volume_change_pct: overview?.platform_transaction_volume_change_pct ?? null,
        active_saccos_change_this_month: overview?.active_saccos_change_this_month ?? 0,
        total_members_change_this_month: overview?.total_members_change_this_month ?? 0,
        platform_revenue_mtd_kes: Number(overview?.platform_revenue_mtd ?? 0),
        kyc_verified_pct: overview?.kyc_verified_pct ?? 0,
        aml_flags_open: overview?.aml_flags_open ?? 0,
        system_alerts: overview?.system_alerts ?? 0,
        all_systems_operational: overview?.all_systems_operational ?? true,
      }
    },

    getSaccos: async (params?: { status?: string; sector?: string; search?: string }) => {
      const response = await apiCall<any>('GET', '/management/superadmin/saccos/').catch(() => ({ results: [] }))
      let items = response.results || response
      if (params?.search) {
        items = items.filter((item: any) =>
          item.name?.toLowerCase().includes(params.search!.toLowerCase())
        )
      }
      if (params?.status) {
        items = items.filter((item: any) =>
          (params.status === 'active' && item.is_active) ||
          (params.status === 'suspended' && !item.is_active) ||
          (params.status === 'onboarding' && item.status?.toLowerCase() === 'onboarding')
        )
      }
      if (params?.sector) {
        items = items.filter((item: any) =>
          String(item.sector ?? '').toLowerCase() === params.sector!.toLowerCase()
        )
      }
      return {
        count: items.length,
        next: null,
        previous: null,
        results: items.map((item: any) => normalizeSuperAdminSacco(item)),
      }
    },

    getSacco: async (id: string) => {
      let sacco: Sacco | null = null
      try {
        sacco = await api.saccos.get(id)
      } catch {
        // Fallback to super-admin SACCO list if public detail fails
        const all = await api.superAdmin.getSaccos()
        sacco = (all.results.find((s) => s.id === id || s.slug === id) as Sacco | undefined) ?? null
      }
      if (!sacco) throw { code: 'NOT_FOUND', message: 'SACCO not found.' }

      const stats = await apiCall<any>('GET', '/management/stats/', undefined, { params: { sacco_id: id } }).catch(() => null)
      return {
        ...normalizeSuperAdminSacco({
          ...sacco,
          transaction_volume_mtd_kes: stats?.transaction_volume_mtd_kes ?? stats?.monthly_contributions ?? 0,
          platform_fee_kes: stats?.platform_fee_kes ?? 0,
        }),
        admin_team: [],
      }
    },

    // NOTE: These endpoints are not present in the documented API collection.
    // They are retained for API compatibility but will return 404 until the backend exposes them.
    suspendSacco: (id: string) =>
      apiCall<void>('PATCH', `/super-admin/saccos/${uuid(id)}/suspend/`),

    unsuspendSacco: (id: string) =>
      apiCall<void>('PATCH', `/super-admin/saccos/${uuid(id)}/unsuspend/`),

    assignRole: (data: { user_id: string; role_name: string; sacco_id?: string | null }) =>
      apiCall<any>('POST', '/management/roles/assign/', data),

    revokeRole: (roleId: string) =>
      apiCall<void>('DELETE', `/management/roles/${uuid(roleId)}/`),

    getUserRoles: (userId: string) =>
      apiCall<any[]>('GET', '/management/roles/', undefined, { params: { user_id: userId } }),

    getAllMembers: async (params?: { sacco?: string; kyc_status?: string; search?: string; cursor?: string }) => {
      const queryParams: Record<string, string> = {}
      if (params?.sacco) queryParams.sacco_id = params.sacco
      if (params?.search) queryParams.search = params.search
      if (params?.cursor) queryParams.cursor = params.cursor
      if (params?.kyc_status) queryParams.kyc_status = params.kyc_status

      const response = await apiCall<any>('GET', '/management/superadmin/members/', undefined, { params: queryParams })
      const items = response.results || []
      return {
        count: Number(response.count || items.length),
        next: response.next || null,
        previous: response.previous || null,
        results: items.map((item: any) =>
          PlatformMemberSchema.parse({
            id: item.id,
            full_name: item.full_name ?? `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim(),
            email: item.email,
            phone_number: item.phone_number ?? null,
            kyc_status: item.kyc_status ?? null,
            member_since: item.member_since ?? item.date_joined ?? item.created_at ?? null,
            sacco_name: item.sacco_name ?? item.sacco?.name ?? null,
            member_number: item.member_number ?? null,
            status: item.status ?? 'active',
          })
        ),
      }
    },

    getTransactions: async () => {
      const response = await apiCall<any>('GET', '/management/superadmin/transactions/live/')
      const results = Array.isArray(response) ? response : response.results || []
      return {
        count: results.length,
        next: null,
        previous: null,
        results: results.map((item: any) =>
          normalizeTransaction({
            ...item,
            id: item.id ?? `${item.created_at ?? Date.now()}-${Math.random()}`,
            txn_type: item.transaction_type ?? item.txn_type ?? 'contribution',
            description: item.description ?? item.transaction_type ?? 'Transaction',
            payment_method: item.payment_method ?? 'mpesa',
            payment_ref: item.payment_ref ?? item.mpesa_receipt ?? item.reference ?? null,
            platform_fee: item.platform_fee ?? 0,
            sacco_name: item.sacco_name,
            date: item.created_at ?? item.date,
            completed_at: item.completed_at ?? item.created_at ?? null,
          })
        ),
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
          health_status: item.health_status ?? 'GOOD',
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
          risk_level: item.severity === 'CRITICAL' ? 'high' : item.severity === 'HIGH' ? 'medium' : 'low',
          flag_reason: item.description,
          member_name: item.member_name ?? '—',
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

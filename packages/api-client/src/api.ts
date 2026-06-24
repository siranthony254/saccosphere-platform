
import { apiCall } from './core'
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
  PlatformOverviewSchema,
  RegisterInputSchema,
  SaccoConfigSchema,
  SaccoAdminDashboardSchema,
  SaccoSchema,
  STKPushInputSchema,
  AdminMemberSchema,
  SuperAdminSaccoSchema,
  TransactionSchema,
  UserSchema,
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

const normalizeUserRole = (role: unknown): User['role'] => {
  const normalized = String(role ?? 'member').trim().toUpperCase()
  if (normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') return 'superadmin'
  if (normalized === 'SACCO_ADMIN' || normalized === 'SACCOADMIN') return 'sacco_admin'
  return 'member'
}

const normalizeUser = (user: any): User => {
  const createdAt = user.created_at ?? user.date_joined ?? new Date().toISOString()
  const kycStatus = String(user.kyc_status ?? user.status ?? 'not_started').toLowerCase()
  return UserSchema.parse({
    ...user,
    phone: user.phone ?? user.phone_number ?? '',
    phone_number: user.phone_number ?? user.phone ?? '',
    role: normalizeUserRole(user.role),
    kyc_status: kycStatus === 'approved' ? 'verified' : kycStatus,
    national_id: user.national_id ?? null,
    sacco_id: user.sacco_id ?? null,
    sacco_slug: user.sacco_slug ?? null,
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
    membership_type: String(sacco.membership_type ?? 'open').toLowerCase(),
    status: sacco.status ?? (sacco.is_active === false ? 'suspended' : 'active'),
    sasra_reg_no: sacco.sasra_reg_no ?? '',
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

  return MembershipSchema.parse({
    id: membership.id,
    sacco_id: membership.sacco_id ?? sacco.id ?? membership.sacco,
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
    applied_at: membership.applied_at ?? membership.application_date ?? new Date().toISOString(),
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

const normalizeAdminApplication = (member: any): MembershipApplication => {
  const status = String(member.status ?? 'PENDING').toUpperCase()
  return {
    id: member.id,
    sacco_slug:
      member.sacco?.slug ??
      String(member.sacco?.name ?? 'unknown-sacco')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    sacco_name: member.sacco?.name ?? 'Unknown SACCO',
    ref: member.member_number ?? member.id,
    status: status === 'PENDING' ? 'submitted' : 'under_review',
    submitted_at: member.application_date ?? member.created_at ?? new Date().toISOString(),
    reviewed_at: member.reviewed_at ?? null,
    form_data: {
      sacco_name: member.sacco?.name ?? 'Unknown SACCO',
      applicant_name: member.user?.full_name ?? `${member.user?.first_name ?? ''} ${member.user?.last_name ?? ''}`.trim(),
      applicant_email: member.user?.email ?? '',
    },
    registration_fee_paid: false,
    registration_fee_txn_ref: null,
  }
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

  return {
    id: item.id,
    ref: item.ref ?? item.reference ?? item.id,
    description: item.description ?? item.narration ?? String(txnType).replace(/_/g, ' '),
    txn_type: TransactionSchema.shape.txn_type.parse(txnType),
    amount,
    direction: item.direction ?? (amount < 0 ? 'debit' : 'credit'),
    status: TransactionSchema.shape.status.parse(String(item.status ?? 'completed').toLowerCase()),
    payment_method: TransactionSchema.shape.payment_method.parse(String(item.payment_method ?? 'internal').toLowerCase()),
    payment_ref: item.payment_ref ?? item.reference ?? null,
    platform_fee: Number(item.platform_fee ?? 0),
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

    getNotifications: () =>
      apiCall<PaginatedResponse<AppNotification> | AppNotification[]>('GET', '/notifications/').then(unwrapResults),

    markNotificationRead: (id: string) =>
      apiCall<void>('POST', `/notifications/${uuid(id)}/read/`),

    markAllNotificationsRead: () =>
      apiCall<void>('POST', '/notifications/read-all/'),
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
        apiCall<any[]>('GET', `/members/saccos/${sacco.id}/fields/`).catch(() => []),
        apiCall<any[]>('GET', '/services/loan-types/', undefined, { params: { sacco_id: sacco.id } }).catch(() => []),
      ])

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
          additional_fields: fields.map((field) => ({
            key: field.id,
            label: field.label,
            type: field.field_type === 'decimal' ? 'number' : field.field_type === 'choice' ? 'select' : field.field_type ?? 'text',
            required: Boolean(field.is_required),
            options: field.options ?? undefined,
          })),
        },
        loan_products: loanTypes.map((loanType) => ({
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
      const customFields = Object.entries(data.form_data ?? {}).map(([field_id, value]) => ({
        field_id,
        value: String(value ?? ''),
      }))
      const membership = await apiCall<any>('POST', '/members/memberships/', {
        sacco: sacco.id,
        custom_fields: customFields,
        monthly_income: data.monthly_contribution,
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

    attachDocuments: (id: string, documentIds: string[]) =>
      apiCall<void>('PATCH', `/members/memberships/${uuid(id)}/documents/`, {
        document_ids: documentIds,
      }),

    payRegistrationFee: (id: string) =>
      apiCall<STKPushResponse>('POST', '/payments/mpesa/stk-push/', { membership_id: id, purpose: 'REGISTRATION_FEE' }, {
        idempotent: true,
      }),
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

    apply: (data: LoanApplicationInput) =>
      apiCall<any>('POST', '/services/loans/apply/', {
        loan_type: data.loan_product_key,
        amount: data.amount_requested,
        term_months: data.period_months,
        application_notes: data.purpose,
      }).then((loan) => LoanApplicationSchema.parse({
        id: loan.id,
        ref: loan.reference ?? loan.id,
        sacco_name: loan.membership?.sacco_name ?? '',
        sacco_slug: '',
        loan_product_key: loan.loan_type?.name ?? data.loan_product_key,
        loan_product_label: loan.loan_type?.name ?? data.loan_product_key,
        amount_requested: Number(loan.amount ?? data.amount_requested),
        period_months: Number(loan.term_months ?? data.period_months),
        interest_rate: Number(loan.interest_rate ?? 0),
        monthly_instalment: 0,
        total_repayable: Number(loan.amount ?? data.amount_requested),
        purpose: loan.application_notes ?? data.purpose,
        disbursement_method: data.disbursement_method,
        disbursement_account: data.disbursement_account,
        status: 'submitted',
        submitted_at: loan.created_at ?? new Date().toISOString(),
        approved_at: null,
        disbursed_at: null,
      })),

    repay: (id: string, amount: number, data: { sacco_id: string; phone_number: string; instalment_number?: number }) =>
      apiCall<STKPushResponse>('POST', '/payments/mpesa/stk-push/', {
        loan_id: uuid(id),
        sacco_id: uuid(data.sacco_id),
        amount,
        phone_number: data.phone_number,
        purpose: 'LOAN_REPAYMENT',
        instalment_number: data?.instalment_number ?? 1,
      }, {
        idempotent: true,
      }),

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

    getGuarantorRequests: () =>
      apiCall<
        Array<{
          id: string
          loan_id?: string
          guarantor_id?: string
          loan_ref: string
          applicant_name: string
          amount: number
          guarantee_amount?: number
          sacco_name: string
          status: string
        }>
      >('GET', '/services/loans/guarantor-requests/').then((requests) =>
        requests.map((request) => ({
          ...request,
          id: request.loan_id && request.guarantor_id ? `${request.loan_id}:${request.guarantor_id}` : request.id,
          amount: Number(request.amount ?? 0),
          guarantee_amount: Number(request.guarantee_amount ?? request.amount ?? 0),
        }))
      ),

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
      apiCall<STKPushResponse>('POST', '/payments/mpesa/stk-push/', parseInput(STKPushInputSchema, data), {
        idempotent: true, 
      }),

    checkStatus: (ref: string) =>
      apiCall<{ status: string; completed_at: string | null }>(
        'GET',
        `/payments/mpesa/stk/${requiredString(ref)}/status/`
      ),
  },

  // ─── KYC ───────────────────────────────────────────────────────────────────

  kyc: {
    getStatus: () =>
      apiCall<{
        kyc_status: string
        documents: Array<{ doc_type: string; status: string }>
      }>('GET', '/accounts/kyc/status/'),

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

    confirmUpload: (documentId: string) =>
      apiCall<void>('PATCH', `/accounts/kyc/documents/${documentId}/`, {
        upload_complete: true,
      }),

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

    getMembers: async (params?: {
      status?: string
      search?: string
      kyc_status?: string
      cursor?: string
    }) => {
      const response = await apiCall<any>('GET', '/management/members/', undefined, {
        params,
      })
      return {
        count: Number(response.count ?? 0),
        next: response.next ?? null,
        previous: response.previous ?? null,
        results: Array.isArray(response.results ? response.results : [])
          ? response.results.map(normalizeAdminMember)
          : [],
      }
    },

    getMember: async (id: string) => normalizeAdminMember(await apiCall<any>('GET', `/management/members/${uuid(id)}/`)),

    updateMemberStatus: (id: string, status: 'active' | 'suspended') =>
      apiCall<void>('PATCH', `/management/members/${id}/status/`, { status }),

    getApplications: async () => {
      const response = await apiCall<any>('GET', '/management/members/', undefined, {
        params: { status: 'PENDING' },
      })
      const members = Array.isArray(response.results ? response.results : [])
        ? response.results
        : []
      return members.map(normalizeAdminApplication)
    },

    reviewApplication: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
      apiCall<void>('PATCH', `/management/applications/${uuid(id)}/review/`, {
        status: data.action === 'approve' ? 'APPROVED' : 'REJECTED',
        review_notes: data.notes,
      }),

    getLoans: async (_params?: { status?: string; cursor?: string }): Promise<PaginatedResponse<AdminLoan>> => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }),

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

    getDisbursements: async () => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }),

    getReports: async () => apiCall<Record<string, unknown>>('GET', '/management/stats/'),
  },

  // ─── SUPER ADMIN ───────────────────────────────────────────────────────────

  superAdmin: {
    getDashboard: async () => {
      const saccos = await api.saccos.list()
      return PlatformOverviewSchema.parse({
        total_saccos: saccos.length,
        active_saccos: saccos.filter((s) => s.status === 'active').length,
        total_members: saccos.reduce((sum, s) => sum + (s.member_count ?? 0), 0),
        total_members_on_app: saccos.reduce((sum, s) => sum + (s.member_count ?? 0), 0),
        transaction_volume_mtd_kes: 0,
        platform_revenue_mtd_kes: 0,
        saas_revenue_mtd_kes: 0,
        transaction_fees_mtd_kes: 0,
        kyc_verified_pct: 0,
        aml_flags_open: 0,
        system_alerts: 0,
      })
    },

    getSaccos: (params?: { status?: string; sector?: string; search?: string }) =>
      api.saccos.list({ sector: params?.sector, search: params?.search }).then((items) => {
        const filtered = params?.status ? items.filter((item) => item.status === params.status) : items
        return {
          count: filtered.length,
          next: null,
          previous: null,
          results: filtered.map((item) => normalizeSuperAdminSacco(item)),
        }
      }),

    getSacco: async (id: string) => {
      const sacco = await api.saccos.get(id)
      return {
        ...normalizeSuperAdminSacco(sacco),
        admin_team: [],
      }
    },

    getSaccoConfig: (id: string) =>
      apiCall<SaccoConfig>('GET', `/super-admin/saccos/${id}/configuration/`),

    updateSaccoConfig: (id: string, partial: Partial<SaccoConfig>) =>
      apiCall<SaccoConfig>('PATCH', `/super-admin/saccos/${id}/configuration/`, partial),

    suspendSacco: (id: string) =>
      apiCall<void>('PATCH', `/super-admin/saccos/${id}/suspend/`),

    unsuspendSacco: (id: string) =>
      apiCall<void>('PATCH', `/super-admin/saccos/${id}/unsuspend/`),

    getAllMembers: (_params?: { sacco?: string; kyc_status?: string; search?: string }) =>
      Promise.resolve({ count: 0, next: null, previous: null, results: [] }),

    getTransactions: (_params?: { cursor?: string }) =>
      Promise.resolve({ count: 0, next: null, previous: null, results: [] }),

    getRevenue: (_params?: { period?: string }) =>
      Promise.resolve({}),

    getAMLFlags: () =>
      Promise.resolve([]),

    resolveAMLFlag: (_id: string, _notes: string) =>
      Promise.reject(new Error('Resolve AML flags is not supported by the current backend contract.')),

    getSystemHealth: () =>
      Promise.resolve({ services: [] }),
  },
}

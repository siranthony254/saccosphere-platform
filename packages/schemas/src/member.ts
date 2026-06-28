import { z } from 'zod'

// ─── MEMBERSHIP ───────────────────────────────────────────────────────────────

export const MembershipStatusSchema = z.enum([
  'applied',
  'under_review',
  'active',
  'suspended',
  'withdrawn',
])
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  sacco_id: z.any().transform((val) => {
    // Handle any input type and convert to string
    if (typeof val === 'object' && val !== null) {
      return String(val.id ?? val.uuid ?? val.sacco_id ?? JSON.stringify(val))
    }
    return String(val ?? '')
  }),
  sacco_slug: z.string(),
  sacco_name: z.string(),
  sacco_color: z.string(),
  sacco_initials: z.string(),
  member_number: z.string(),
  status: MembershipStatusSchema,
  bosa_balance: z.number(),
  fosa_balance: z.number(),
  share_capital: z.number(),
  total_dividends: z.number(),
  monthly_contribution: z.number(),
  loan_limit: z.number(),
  joined_at: z.string().datetime().nullable(),
  applied_at: z.any().transform((val) => {
    // Handle any input type and convert to ISO datetime string
    if (!val) return new Date().toISOString()
    if (typeof val === 'string') {
      if (val.includes('T') || val.includes('Z')) return val
      const parsed = new Date(val)
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
    }
    if (typeof val === 'number') return new Date(val).toISOString()
    return new Date().toISOString()
  }),
})
export type Membership = z.infer<typeof MembershipSchema>

// Application for joining a new SACCO
export const MembershipApplicationSchema = z.object({
  id: z.string().uuid(),
  sacco_slug: z.string(),
  sacco_name: z.string(),
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected']),
  ref: z.string(),
  form_data: z.record(z.unknown()), // dynamic additional_fields answers
  registration_fee_paid: z.boolean(),
  registration_fee_txn_ref: z.string().nullable(),
  submitted_at: z.string().datetime(),
  reviewed_at: z.string().datetime().nullable(),
  review_notes: z.string().optional(),
})
export type MembershipApplication = z.infer<typeof MembershipApplicationSchema>

// ─── LOANS ────────────────────────────────────────────────────────────────────

export const LoanStatusSchema = z.enum([
  'draft',
  'submitted',
  'guarantors_pending',
  'under_review',
  'approved',
  'disbursement_pending',
  'active',
  'rejected',
  'disbursed',
  'closed',
  'defaulted',
])
export type LoanStatus = z.infer<typeof LoanStatusSchema>

export const LoanApplicationSchema = z.object({
  id: z.string().uuid(),
  ref: z.string(),
  sacco_name: z.string(),
  sacco_slug: z.string(),
  loan_product_key: z.string(),
  loan_product_label: z.string(),
  amount_requested: z.number(),
  period_months: z.number(),
  interest_rate: z.number(),
  monthly_instalment: z.number(),
  total_repayable: z.number(),
  purpose: z.string(),
  disbursement_method: z.enum(['mpesa', 'fosa', 'bank']),
  disbursement_account: z.string(),
  status: LoanStatusSchema,
  submitted_at: z.string().datetime().nullable(),
  approved_at: z.string().datetime().nullable(),
  disbursed_at: z.string().datetime().nullable(),
  balance_remaining: z.number().optional(),
  next_payment_date: z.string().optional(),
  next_payment_amount: z.number().optional(),
})
export type LoanApplication = z.infer<typeof LoanApplicationSchema>

export const LoanApplicationInputSchema = z.object({
  membership_id: z.string().uuid(),
  loan_product_key: z.string(),
  amount_requested: z.number().positive(),
  period_months: z.number().int().positive(),
  purpose: z.string().min(10),
  disbursement_method: z.enum(['mpesa', 'fosa', 'bank']),
  disbursement_account: z.string(),
  guarantor_membership_ids: z.array(z.string().uuid()),
})
export type LoanApplicationInput = z.infer<typeof LoanApplicationInputSchema>

export const GuarantorSchema = z.object({
  id: z.string().uuid(),
  membership_id: z.string().uuid(),
  member_name: z.string(),
  member_number: z.string(),
  status: z.enum(['pending', 'approved', 'declined']),
  responded_at: z.string().datetime().nullable(),
})
export type Guarantor = z.infer<typeof GuarantorSchema>

export const LoanComparisonItemSchema = z.object({
  sacco_slug: z.string(),
  sacco_name: z.string(),
  sacco_color: z.string(),
  sacco_initials: z.string(),
  loan_product_label: z.string(),
  interest_rate_pct: z.number(),
  monthly_instalment: z.number(),
  total_repayable: z.number(),
  total_interest: z.number(),
  max_amount: z.number(),
  is_eligible: z.boolean(),
})
export type LoanComparisonItem = z.infer<typeof LoanComparisonItemSchema>

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const TransactionTypeSchema = z.enum([
  'contribution',
  'loan_disbursement',
  'loan_repayment',
  'share_capital',
  'registration_fee',
  'dividend',
  'withdrawal',
])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  ref: z.string(),
  description: z.string(),
  txn_type: TransactionTypeSchema,
  amount: z.number(),
  direction: z.enum(['credit', 'debit']),
  status: z.enum(['pending', 'completed', 'failed', 'reversed']),
  payment_method: z.enum(['mpesa', 'airtel', 'bank', 'internal']),
  payment_ref: z.string().nullable(), // M-Pesa confirmation code
  platform_fee: z.number(),
  balance_after: z.number(),
  sacco_name: z.string(),
  sacco_slug: z.string(),
  date: z.string().datetime({ offset: true }),
  completed_at: z.string().datetime({ offset: true }).nullable(),
})
export type Transaction = z.infer<typeof TransactionSchema>

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const DashboardSchema = z.object({
  total_balance: z.number(),
  total_savings: z.number(),
  active_loans_balance: z.number(),
  sacco_count: z.number(),
  memberships: z.array(MembershipSchema),
  recent_transactions: z.array(TransactionSchema),
})
export type Dashboard = z.infer<typeof DashboardSchema>

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  type: z.enum([
    'loan_approved',
    'loan_rejected',
    'loan_disbursed',
    'guarantor_request',
    'guarantor_response',
    'contribution_received',
    'instalment_due',
    'membership_approved',
    'membership_rejected',
    'dividend_credited',
    'system',
  ]),
  is_read: z.boolean(),
  deep_link: z.string().optional(),
  sacco_name: z.string().optional(),
  created_at: z.string().datetime({ offset: true }),
})
export type Notification = z.infer<typeof NotificationSchema>

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const STKPushInputSchema = z.object({
  phone_number: z.string().min(10),
  amount: z.number().positive(),
  purpose: z.enum(['SAVING_DEPOSIT', 'LOAN_REPAYMENT']),
  sacco_id: z.string().uuid().optional(),
  saving_id: z.string().uuid().optional(),
  loan_id: z.string().uuid().optional(),
  instalment_number: z.number().int().positive().optional(),
})
export type STKPushInput = z.infer<typeof STKPushInputSchema>

export const STKPushResponseSchema = z.object({
  checkout_request_id: z.string(),
  merchant_request_id: z.string().optional(),
  transaction_id: z.string().uuid().optional(),
  message: z.string(),
})
export type STKPushResponse = z.infer<typeof STKPushResponseSchema>

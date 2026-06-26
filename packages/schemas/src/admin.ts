import { z } from 'zod'
import { TransactionSchema } from './member'

// ─── SACCO ADMIN ─────────────────────────────────────────────────────────────

export const SaccoAdminDashboardSchema = z.object({
  total_members: z.number(),
  total_savings_kes: z.number(),
  active_loans_count: z.number(),
  active_loans_kes: z.number(),
  default_rate_pct: z.number(),
  contributions_mtd_kes: z.number(),
  disbursements_mtd_kes: z.number(),
  pending_applications: z.number(),
  pending_loan_approvals: z.number(),
  pending_kyc_reviews: z.number(),
  members_in_arrears: z.number(),
})
export type SaccoAdminDashboard = z.infer<typeof SaccoAdminDashboardSchema>

export const AdminMemberSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(), // backend user UUID — used for roles lookup
  saccosphere_id: z.string(), // SS-2024-00891
  member_number: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  national_id: z.string().nullable(),
  kyc_status: z.enum(['pending', 'under_review', 'verified', 'rejected']),
  membership_status: z.enum(['applied', 'under_review', 'active', 'suspended', 'withdrawn']),
  bosa_balance: z.number(),
  fosa_balance: z.number(),
  share_capital: z.number(),
  active_loans_count: z.number(),
  active_loans_kes: z.number(),
  monthly_contribution: z.number(),
  repayment_rate_pct: z.number(),
  joined_at: z.string().datetime().nullable(),
  last_active: z.string().datetime().nullable(),
})
export type AdminMember = z.infer<typeof AdminMemberSchema>

export const AdminLoanSchema = z.object({
  id: z.string().uuid(),
  ref: z.string(),
  member_name: z.string(),
  member_number: z.string(),
  member_id: z.string().uuid(),
  loan_product_label: z.string(),
  amount_requested: z.number(),
  period_months: z.number(),
  interest_rate: z.number(),
  monthly_instalment: z.number(),
  status: z.enum([
    'submitted',
    'guarantors_pending',
    'under_review',
    'approved',
    'rejected',
    'disbursed',
    'closed',
  ]),
  guarantors_confirmed: z.number(),
  guarantors_required: z.number(),
  disbursement_method: z.enum(['mpesa', 'fosa', 'bank']),
  disbursement_account: z.string(),
  submitted_at: z.string().datetime(),
  approved_at: z.string().datetime().nullable(),
  disbursed_at: z.string().datetime().nullable(),
})
export type AdminLoan = z.infer<typeof AdminLoanSchema>

// ─── SUPER ADMIN ─────────────────────────────────────────────────────────────

export const PlatformOverviewSchema = z.object({
  total_saccos: z.number(),
  active_saccos: z.number(),
  total_members: z.number(),
  total_members_on_app: z.number(),
  transaction_volume_mtd_kes: z.number(),
  platform_revenue_mtd_kes: z.number(),
  saas_revenue_mtd_kes: z.number(),
  transaction_fees_mtd_kes: z.number(),
  kyc_verified_pct: z.number(),
  aml_flags_open: z.number(),
  system_alerts: z.number(),
})
export type PlatformOverview = z.infer<typeof PlatformOverviewSchema>

export const SuperAdminSaccoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  sector: z.string(),
  initials: z.string(),
  color: z.string(),
  sasra_reg_no: z.string(),
  status: z.enum(['onboarding', 'active', 'suspended']),
  member_count: z.number(),
  members_on_app: z.number(),
  transaction_volume_mtd_kes: z.number(),
  platform_fee_kes: z.number(),
  fee_status: z.enum(['paid', 'pending', 'overdue']),
  api_connected: z.boolean(),
  health: z.enum(['healthy', 'warning', 'critical']),
  joined_platform_at: z.string().datetime(),
})
export type SuperAdminSacco = z.infer<typeof SuperAdminSaccoSchema>

export const PlatformTransactionSchema = TransactionSchema.extend({
  member_name: z.string(),
  sacco_name: z.string(),
})
export type PlatformTransaction = z.infer<typeof PlatformTransactionSchema>

export const AMLFlagSchema = z.object({
  id: z.string().uuid(),
  member_name: z.string(),
  sacco_name: z.string(),
  transaction_ref: z.string(),
  flag_reason: z.string(),
  amount: z.number(),
  risk_level: z.enum(['low', 'medium', 'high']),
  status: z.enum(['open', 'under_review', 'resolved', 'escalated']),
  flagged_at: z.string().datetime(),
})
export type AMLFlag = z.infer<typeof AMLFlagSchema>

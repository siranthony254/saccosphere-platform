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

export const DisbursementsDashboardSchema = z.object({
  disbursed_today: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  pending_disbursement: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  total_disbursements: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  recent_disbursements: z.array(z.object({
    member_name: z.string(),
    member_number: z.string(),
    loan_id: z.string(),
    amount: z.number(),
    disbursed_at: z.string().datetime().nullable(),
    phone_number: z.string(),
  })),
})
export type DisbursementsDashboard = z.infer<typeof DisbursementsDashboardSchema>

export const ContributionsDashboardSchema = z.object({
  received_today: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  expected_this_month: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  received_so_far_this_month: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  missed_overdue: z.object({
    count: z.number(),
    total_amount: z.number(),
  }),
  contribution_rate_pct: z.number(),
  recent_contributions: z.array(z.object({
    member_name: z.string(),
    member_number: z.string(),
    amount: z.number(),
    date: z.string().datetime().nullable(),
    savings_type: z.string(),
  })),
})
export type ContributionsDashboard = z.infer<typeof ContributionsDashboardSchema>

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

// Loan approval queue schema (from /management/loans/approvals/)
export const LoanApprovalSchema = z.object({
  loan_id: z.string(),
  member_name: z.string(),
  member_number: z.string(),
  loan_type_name: z.string().nullable(),
  amount: z.number(),
  term_months: z.number(),
  application_notes: z.string().nullable(),
  applied_at: z.string().datetime().nullable(),
  status: z.string(),
  guarantors_summary: z.any(), // Complex object from build_guarantors_summary
  required_documents: z.any(), // Complex object from get_member_application_documents
})
export type LoanApproval = z.infer<typeof LoanApprovalSchema>

// ─── SUPER ADMIN ─────────────────────────────────────────────────────────────

export const PlatformOverviewSchema = z.object({
  total_saccos: z.number(),
  active_saccos: z.number(),
  total_members: z.number(),
  total_members_on_app: z.number(),
  transaction_volume_mtd_kes: z.number(),
  transaction_volume_change_pct: z.number().nullable(),
  active_saccos_change_this_month: z.number(),
  total_members_change_this_month: z.number(),
  platform_revenue_mtd_kes: z.number(),
  kyc_verified_pct: z.number(),
  aml_flags_open: z.number(),
  system_alerts: z.number(),
  all_systems_operational: z.boolean(),
})
export type PlatformOverview = z.infer<typeof PlatformOverviewSchema>

export const SuperAdminSaccoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  sector: z.string().nullable(),
  initials: z.string().nullable(),
  color: z.string().nullable(),
  sasra_reg_no: z.string().nullable(),
  status: z.enum(['active', 'suspended']),
  is_active: z.boolean(),
  member_count: z.number(),
  members_on_app: z.number().nullable(),
  transaction_volume_mtd_kes: z.number().nullable(),
  platform_fee_kes: z.number().nullable(),
  fee_status: z.enum(['paid', 'pending', 'overdue']).nullable(),
  api_connected: z.boolean().nullable(),
  health_status: z.enum(['GOOD', 'REVIEW', 'API_ISSUE']),
  health: z.enum(['healthy', 'warning', 'critical']).nullable(),
  joined_platform_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable(),
  last_transaction_at: z.string().datetime().nullable(),
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

export const RevenueChartSchema = z.object({
  month: z.string(), // YYYY-MM format
  saas_fees: z.number(),
  transaction_fees: z.number(),
  total_mrr: z.number(),
})
export type RevenueChart = z.infer<typeof RevenueChartSchema>

export const TopSaccosSchema = z.object({
  sacco_id: z.string().uuid(),
  sacco_name: z.string(),
  member_count: z.number(),
  txn_volume_this_month: z.number(),
  platform_fee_this_month: z.number(),
  health_status: z.enum(['GOOD', 'REVIEW', 'API_ISSUE']),
})
export type TopSaccos = z.infer<typeof TopSaccosSchema>

export const PlatformAlertSchema = z.object({
  id: z.string(),
  sacco_name: z.string(),
  flag_type: z.string(),
  description: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  created_at: z.string().datetime(),
  risk_level: z.enum(['low', 'medium', 'high']),
  flag_reason: z.string(),
  member_name: z.string(),
})
export type PlatformAlert = z.infer<typeof PlatformAlertSchema>

export const PlatformMemberSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  phone_number: z.string().nullable(),
  kyc_status: z.string().nullable(),
  member_since: z.string().datetime().nullable(),
  sacco_name: z.string().nullable(),
  member_number: z.string().nullable(),
  status: z.string(),
})
export type PlatformMember = z.infer<typeof PlatformMemberSchema>

// ─── SACCO ADMIN ADDITIONAL SCHEMAS ─────────────────────────────────────────────

export const ExternalGuarantorSchema = z.object({
  id: z.string(),
  loan_id: z.string(),
  member_name: z.string(),
  guarantor_name: z.string(),
  guarantor_phone: z.string(),
  guarantor_national_id: z.string(),
  amount: z.number(),
  status: z.string(),
  created_at: z.string().datetime().nullable(),
})
export type ExternalGuarantor = z.infer<typeof ExternalGuarantorSchema>

export const AuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime().nullable(),
  user: z.string().nullable(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string(),
  details: z.any(),
})
export type AuditLog = z.infer<typeof AuditLogSchema>

export const ImportStatusSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  progress: z.number(),
  total_records: z.number(),
  processed_records: z.number(),
  failed_records: z.number(),
  error_summary: z.array(z.any()),
})
export type ImportStatus = z.infer<typeof ImportStatusSchema>

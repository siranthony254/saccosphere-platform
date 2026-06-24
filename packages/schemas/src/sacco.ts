import { z } from 'zod'

// ─── DYNAMIC SACCO CONFIGURATION ─────────────────────────────────────────────
// This is the most important schema in the project.
// It defines what comes from GET /saccos/{slug}/configuration/
// and drives all dynamic form rendering in the member app.

export const AdditionalFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'select', 'date', 'phone', 'textarea']),
  required: z.boolean(),
  options: z.array(z.string()).optional(), // for 'select' type
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  min: z.number().optional(), // for 'number' type
  max: z.number().optional(),
})
export type AdditionalField = z.infer<typeof AdditionalFieldSchema>

export const RequiredDocumentSchema = z.object({
  key: z.string(),
  label: z.string(),
  required: z.boolean(),
  already_verified_from_kyc: z.boolean().optional(),
  hint: z.string().optional(),
  accepted_formats: z.array(z.string()).optional(), // e.g. ['image/jpeg', 'application/pdf']
})
export type RequiredDocument = z.infer<typeof RequiredDocumentSchema>

export const LoanProductSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  interest_rate_pct: z.number(), // per annum
  max_multiplier: z.number(), // max loan = multiplier × savings
  min_months: z.number(),
  max_months: z.number(),
  min_guarantors: z.number(),
  processing_fee_pct: z.number(),
  disbursement_options: z.array(z.enum(['mpesa', 'fosa', 'bank'])),
})
export type LoanProduct = z.infer<typeof LoanProductSchema>

export const SaccoConfigSchema = z.object({
  membership: z.object({
    min_age: z.number(),
    min_monthly_contribution_kes: z.number(),
    registration_fee_kes: z.number(),
    min_share_capital_kes: z.number(),
    required_documents: z.array(RequiredDocumentSchema),
    additional_fields: z.array(AdditionalFieldSchema),
  }),
  loan_products: z.array(LoanProductSchema),
  payments: z.object({
    mpesa_paybill: z.string(),
    mpesa_shortcode: z.string().optional(),
    airtel_till: z.string().optional(),
    accepted_methods: z.array(z.enum(['mpesa', 'airtel', 'bank_transfer'])),
  }),
  contributions: z.object({
    deduction_day: z.number(), // day of month
    grace_period_days: z.number(),
    allow_top_up: z.boolean(),
  }),
  display: z.object({
    primary_color: z.string(),
    show_bosa: z.boolean(),
    show_fosa: z.boolean(),
    show_share_capital: z.boolean(),
    account_labels: z.object({
      bosa: z.string(),
      fosa: z.string(),
      shares: z.string(),
    }),
  }),
})
export type SaccoConfig = z.infer<typeof SaccoConfigSchema>

// ─── SACCO PUBLIC PROFILE ─────────────────────────────────────────────────────

export const MembershipTypeSchema = z.enum([
  'open',
  'staff_only',
  'sector_only',
  'invitation_only',
])
export type MembershipType = z.infer<typeof MembershipTypeSchema>

export const SaccoStatusSchema = z.enum(['onboarding', 'active', 'suspended'])
export type SaccoStatus = z.infer<typeof SaccoStatusSchema>

export const SaccoSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  sector: z.string(),
  county: z.string(),
  initials: z.string().max(3),
  color: z.string(), // hex colour for UI
  membership_type: MembershipTypeSchema,
  status: SaccoStatusSchema,
  sasra_reg_no: z.string(),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  // Discovery stats
  member_count: z.number(),
  loan_rate_pct: z.number(),
  loan_multiplier: z.number(),
  established_year: z.number().optional(),
})
export type Sacco = z.infer<typeof SaccoSchema>

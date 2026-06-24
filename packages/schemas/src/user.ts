import { z } from 'zod'

// ─── USER & AUTH ──────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(['member', 'sacco_admin', 'superadmin'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const KYCStatusSchema = z.enum(['not_started', 'pending', 'under_review', 'verified', 'rejected'])
export type KYCStatus = z.infer<typeof KYCStatusSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string(),
  phone_number: z.string().optional(),
  first_name: z.string(),
  last_name: z.string(),
  role: UserRoleSchema.default('member'),
  kyc_status: KYCStatusSchema.default('not_started'),
  national_id: z.string().nullable().default(null),
  sacco_id: z.string().uuid().nullable().default(null), // non-null for sacco_admin
  sacco_slug: z.string().nullable().default(null),
  created_at: z.string().datetime({ offset: true }),
  date_joined: z.string().datetime({ offset: true }).optional(),
})
export type User = z.infer<typeof UserSchema>

export const AuthTokensSchema = z.object({
  access: z.string(),
  refresh: z.string().optional(),
  user: UserSchema,
})
export type AuthTokens = z.infer<typeof AuthTokensSchema>

export const LoginInputSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must contain at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one digit.'),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const RegisterInputSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone_number: z.string().min(10),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one digit.'),
  password2: z.string().min(8),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords do not match.',
  path: ['password2'],
})
export type RegisterInput = z.infer<typeof RegisterInputSchema>

export const KYCDocumentSchema = z.object({
  id: z.string().uuid(),
  doc_type: z.enum([
    'national_id_front',
    'national_id_back',
    'passport_photo',
    'payslip',
    'bank_statement',
    'custom',
  ]),
  label: z.string(),
  status: z.enum(['uploaded', 'verified', 'rejected']),
  file_url: z.string().url(),
  uploaded_at: z.string().datetime({ offset: true }),
})
export type KYCDocument = z.infer<typeof KYCDocumentSchema>

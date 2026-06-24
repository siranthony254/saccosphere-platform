import type { User, Dashboard, Membership, Notification, MembershipApplication } from '@saccosphere/schemas'
import { MOCK_TRANSACTIONS } from './transactions'

export const MOCK_USER: User = {
  id: 'user-001',
  email: 'james.kamau@gmail.com',
  phone: '+254712345678',
  first_name: 'James',
  last_name: 'Kamau',
  role: 'member',
  kyc_status: 'verified',
  national_id: '28473910',
  sacco_id: null,
  sacco_slug: null,
  created_at: '2024-01-15T08:00:00Z',
}

export const MOCK_MEMBERSHIPS: Membership[] = [
  {
    id: 'mem-001',
    sacco_id: 'sacco-001',
    sacco_slug: 'stima-sacco',
    sacco_name: 'Stima SACCO',
    sacco_color: '#0070ba',
    sacco_initials: 'ST',
    member_number: 'STM-2018-04421',
    status: 'active',
    bosa_balance: 98000,
    fosa_balance: 32000,
    share_capital: 12000,
    total_dividends: 8400,
    monthly_contribution: 5000,
    loan_limit: 294000,
    joined_at: '2018-03-01T00:00:00Z',
    applied_at: '2018-02-20T00:00:00Z',
  },
  {
    id: 'mem-002',
    sacco_id: 'sacco-002',
    sacco_slug: 'teachers-sacco',
    sacco_name: 'Teachers SACCO',
    sacco_color: '#7c3aed',
    sacco_initials: 'TS',
    member_number: 'TS-2020-01102',
    status: 'active',
    bosa_balance: 120000,
    fosa_balance: 0,
    share_capital: 12500,
    total_dividends: 4200,
    monthly_contribution: 3000,
    loan_limit: 360000,
    joined_at: '2020-06-01T00:00:00Z',
    applied_at: '2020-05-18T00:00:00Z',
  },
]

export const MOCK_DASHBOARD: Dashboard = {
  total_balance: 274500,
  total_savings: 274500,
  active_loans_balance: 90000,
  sacco_count: 2,
  memberships: MOCK_MEMBERSHIPS,
  recent_transactions: MOCK_TRANSACTIONS.slice(0, 5),
}

// Empty dashboard — for a user who just registered with no SACCOs
export const MOCK_DASHBOARD_EMPTY: Dashboard = {
  total_balance: 0,
  total_savings: 0,
  active_loans_balance: 0,
  sacco_count: 0,
  memberships: [],
  recent_transactions: [],
}

// Pending dashboard — application submitted, awaiting approval
export const MOCK_DASHBOARD_PENDING: Dashboard = {
  total_balance: 0,
  total_savings: 0,
  active_loans_balance: 0,
  sacco_count: 0,
  memberships: [],
  recent_transactions: [],
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title: 'Loan disbursed — KES 150,000',
    body: 'Your development loan from Stima SACCO has been approved and KES 150,000 sent to your M-Pesa.',
    type: 'loan_disbursed',
    is_read: false,
    deep_link: 'saccosphere://member/loans/loan-001',
    sacco_name: 'Stima SACCO',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-002',
    title: 'Guarantee request from Mary Achieng',
    body: 'Mary needs you as guarantor for a KES 80,000 loan at Teachers SACCO. Tap to review.',
    type: 'guarantor_request',
    is_read: false,
    deep_link: 'saccosphere://member/guarantor-requests/gr-001',
    sacco_name: 'Teachers SACCO',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-003',
    title: 'Instalment due in 3 days',
    body: 'KES 6,200 loan repayment to Teachers SACCO is due on May 29. Tap to pay now.',
    type: 'instalment_due',
    is_read: false,
    deep_link: 'saccosphere://member/sacco/teachers-sacco/loans/loan-002',
    sacco_name: 'Teachers SACCO',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-004',
    title: 'Contribution confirmed — KES 5,000',
    body: 'Monthly contribution to Stima SACCO received. Your balance has been updated.',
    type: 'contribution_received',
    is_read: true,
    sacco_name: 'Stima SACCO',
    created_at: '2024-04-26T09:41:00Z',
  },
  {
    id: 'notif-005',
    title: 'Dividend credited — KES 8,400',
    body: '2023 annual dividend from Stima SACCO has been added to your BOSA savings.',
    type: 'dividend_credited',
    is_read: true,
    sacco_name: 'Stima SACCO',
    created_at: '2024-04-15T10:00:00Z',
  },
]

export const MOCK_MEMBERSHIP_APPLICATION: MembershipApplication = {
  id: 'app-001',
  sacco_slug: 'unaitas-sacco',
  sacco_name: 'Unaitas SACCO',
  status: 'submitted',
  ref: 'UNA-APP-2024-01823',
  form_data: {
    employer_name: 'Safaricom Ltd',
    gross_salary: 85000,
    employment_type: 'Employed — salaried',
    next_of_kin_name: 'Grace Odhiambo',
    next_of_kin_phone: '+254722000001',
  },
  registration_fee_paid: true,
  registration_fee_txn_ref: 'QB2934LKPM',
  submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  reviewed_at: null,
}

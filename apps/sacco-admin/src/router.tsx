import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/auth/RequireAuth'
import { Login } from './pages/Auth/Login'

import { Dashboard } from './pages/Dashboard'
import { MembersList } from './pages/Members/MembersList'
import { MemberDetail } from './pages/Members/MemberDetail'
import { AddMember } from './pages/Members/AddMember'
import { ApplicationsList } from './pages/Applications/ApplicationsList'
import { LoansList } from './pages/Loans/LoansList'
import { DisbursementsList } from './pages/Disbursements/DisbursementsList'
import { ContributionsFeed } from './pages/Contributions/ContributionsFeed'
import { Dividends } from './pages/Dividends/Dividends'
import { Billing } from './pages/Billing/Billing'
import { Reports } from './pages/Reports/Reports'
import { Settings } from './pages/Settings/Settings'
import { KycReview } from './pages/Kyc/KycReview'
import { Roles } from './pages/Roles/Roles'
import { Import } from './pages/Import/Import'
import { ExternalGuarantors } from './pages/ExternalGuarantors'
import { InternalGuarantors } from './pages/Guarantors/InternalGuarantors'
import { SASRAReturns } from './pages/Reports/SASRAReturns'
import { LiquidityNPLDashboard } from './pages/Analytics/LiquidityNPLDashboard'
import { LedgerManagement } from './pages/Ledger/LedgerManagement'
import { NotificationsHub } from './pages/Notifications/NotificationsHub'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'members', element: <MembersList /> },
      { path: 'members/add', element: <AddMember /> },
      { path: 'members/:id', element: <MemberDetail /> },
      { path: 'applications', element: <ApplicationsList /> },
      { path: 'loans', element: <LoansList /> },
      { path: 'disbursements', element: <DisbursementsList /> },
      { path: 'contributions', element: <ContributionsFeed /> },
      { path: 'ledger', element: <LedgerManagement /> },
      { path: 'dividends', element: <Dividends /> },
      { path: 'notifications', element: <NotificationsHub /> },
      { path: 'sms', element: <NotificationsHub /> },
      { path: 'billing', element: <Billing /> },
      { path: 'reports', element: <Reports /> },
      { path: 'reports/sasra', element: <SASRAReturns /> },
      { path: 'analytics/liquidity-npl', element: <LiquidityNPLDashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'kyc', element: <KycReview /> },
      { path: 'roles', element: <Roles /> },
      { path: 'import', element: <Import /> },
      { path: 'external-guarantors', element: <ExternalGuarantors /> },
      { path: 'internal-guarantors', element: <InternalGuarantors /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

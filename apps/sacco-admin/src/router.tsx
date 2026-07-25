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
import { BulkSMS } from './pages/BulkSMS/BulkSMS'
import { Billing } from './pages/Billing/Billing'
import { Reports } from './pages/Reports/Reports'
import { Settings } from './pages/Settings/Settings'
import { KycReview } from './pages/Kyc/KycReview'
import { Roles } from './pages/Roles/Roles'
import { Import } from './pages/Import/Import'
import { ExternalGuarantors } from './pages/ExternalGuarantors'

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
      { path: 'dividends', element: <Dividends /> },
      { path: 'sms', element: <BulkSMS /> },
      { path: 'billing', element: <Billing /> },
      { path: 'reports', element: <Reports /> },
      { path: 'settings', element: <Settings /> },
      { path: 'kyc', element: <KycReview /> },
      { path: 'roles', element: <Roles /> },
      { path: 'import', element: <Import /> },
      { path: 'external-guarantors', element: <ExternalGuarantors /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])



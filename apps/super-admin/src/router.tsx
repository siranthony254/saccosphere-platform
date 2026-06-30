import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireAuth } from './components/auth/RequireAuth'
import { Login } from './pages/Auth/Login'
import { Overview } from './pages/Overview'
import { SaccosList } from './pages/Saccos/SaccosList'
import { SaccoDetail } from './pages/Saccos/SaccoDetail'
import { MembersList } from './pages/Members/MembersList'
import { TransactionsFeed } from './pages/Transactions/TransactionsFeed'
import { Revenue } from './pages/Revenue/Revenue'
import { Compliance } from './pages/Compliance/Compliance'
import { PlatformSettings } from './pages/Settings/PlatformSettings'
import { Roles } from './pages/Roles/Roles'
import { KycReview } from './pages/Kyc/KycReview'
import { AuditLogs } from './pages/AuditLogs/AuditLogs'
import { Billing } from './pages/Billing/Billing'
import { SystemHealth } from './pages/System/SystemHealth'

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
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'dashboard', element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <Overview /> },
      { path: 'saccos', element: <SaccosList /> },
      { path: 'saccos/:id', element: <SaccoDetail /> },
      { path: 'members', element: <MembersList /> },
      { path: 'transactions', element: <TransactionsFeed /> },
      { path: 'revenue', element: <Revenue /> },
      { path: 'compliance', element: <Compliance /> },
      { path: 'system', element: <SystemHealth /> },
      { path: 'settings', element: <PlatformSettings /> },
      { path: 'roles', element: <Roles /> },
      { path: 'kyc', element: <KycReview /> },
      { path: 'audit-logs', element: <AuditLogs /> },
      { path: 'billing', element: <Billing /> },
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
])

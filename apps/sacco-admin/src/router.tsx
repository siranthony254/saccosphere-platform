import { lazy, Suspense, type ReactNode } from 'react'
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
import { SASRAReturns } from './pages/Reports/SASRAReturns'
import { LiquidityNPLDashboard } from './pages/Analytics/LiquidityNPLDashboard'
import { LedgerManagement } from './pages/Ledger/LedgerManagement'
import { BulkSMS } from './pages/BulkSMS/BulkSMS'
import { ApprovalsList } from './pages/Approvals/ApprovalsList'
import { RequireSectorModule } from './components/auth/RequireSectorModule'
import { Collections } from './pages/Collections/Collections'
import { ExitsAndClaims } from './pages/Exits/ExitsAndClaims'
import { Checkoff } from './pages/Checkoff/Checkoff'
import { ReturnsManagement } from './pages/Returns/ReturnsManagement'
import { DormancyManagement } from './pages/Savings/DormancyManagement'
import { BillManager } from './pages/BillManager/BillManager'
import { SuspenseAccount } from './pages/Suspense/SuspenseAccount'
import { InsiderLending } from './pages/InsiderLending/InsiderLending'
import { StatementImport } from './pages/StatementImport/StatementImport'
import { AmlDashboard } from './pages/Aml/AmlDashboard'
import { Treasury } from './pages/Treasury/Treasury'
import { Welfare } from './pages/Welfare/Welfare'
import { CreditBureau } from './pages/CreditBureau/CreditBureau'

// Lazy-loaded: each SACCO is only ever entitled to one sector pack at a
// time (gated at runtime by RequireSectorModule below), so there's no
// reason to ship all eight packs' code - plus governance and the shared
// lending primitives page, both large - to every user on first load. This
// was the direct driver of this app's 1.24MB main chunk.
const GovernanceManagement = lazy(() => import('./pages/Governance/GovernanceManagement').then((m) => ({ default: m.GovernanceManagement })))
const SharedLendingPrimitives = lazy(() => import('./pages/Lending/SharedLendingPrimitives').then((m) => ({ default: m.SharedLendingPrimitives })))
const AgriculturePack = lazy(() => import('./pages/SectorPacks/AgriculturePack').then((m) => ({ default: m.AgriculturePack })))
const TransportPack = lazy(() => import('./pages/SectorPacks/TransportPack').then((m) => ({ default: m.TransportPack })))
const EducationPack = lazy(() => import('./pages/SectorPacks/EducationPack').then((m) => ({ default: m.EducationPack })))
const HealthcarePack = lazy(() => import('./pages/SectorPacks/HealthcarePack').then((m) => ({ default: m.HealthcarePack })))
const GovernmentPack = lazy(() => import('./pages/SectorPacks/GovernmentPack').then((m) => ({ default: m.GovernmentPack })))
const TechnologyPack = lazy(() => import('./pages/SectorPacks/TechnologyPack').then((m) => ({ default: m.TechnologyPack })))
const FinancePack = lazy(() => import('./pages/SectorPacks/FinancePack').then((m) => ({ default: m.FinancePack })))
const RetailPack = lazy(() => import('./pages/SectorPacks/RetailPack').then((m) => ({ default: m.RetailPack })))

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-ink-muted">Loading…</div>}>
      {children}
    </Suspense>
  )
}

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
      { path: 'sms', element: <BulkSMS /> },
      { path: 'billing', element: <Billing /> },
      { path: 'reports', element: <Reports /> },
      { path: 'reports/sasra', element: <SASRAReturns /> },
      { path: 'analytics/liquidity-npl', element: <LiquidityNPLDashboard /> },
      { path: 'settings', element: <Settings /> },
      { path: 'kyc', element: <KycReview /> },
      { path: 'roles', element: <Roles /> },
      { path: 'import', element: <Import /> },
      { path: 'external-guarantors', element: <ExternalGuarantors /> },
      { path: 'approvals', element: <ApprovalsList /> },
      { path: 'collections', element: <Collections /> },
      { path: 'exits', element: <ExitsAndClaims /> },
      { path: 'checkoff', element: <Checkoff /> },
      { path: 'returns', element: <ReturnsManagement /> },
      { path: 'dormancy', element: <DormancyManagement /> },
      { path: 'bill-manager', element: <BillManager /> },
      { path: 'suspense', element: <SuspenseAccount /> },
      { path: 'insider-lending', element: <InsiderLending /> },
      { path: 'statement-import', element: <StatementImport /> },
      { path: 'aml', element: <AmlDashboard /> },
      { path: 'governance', element: <LazyRoute><GovernanceManagement /></LazyRoute> },
      { path: 'lending', element: <RequireSectorModule module="lending.assets"><LazyRoute><SharedLendingPrimitives /></LazyRoute></RequireSectorModule> },
      { path: 'agriculture', element: <RequireSectorModule module="agriculture.produce_tracking"><LazyRoute><AgriculturePack /></LazyRoute></RequireSectorModule> },
      { path: 'transport', element: <RequireSectorModule module="transport.vehicle_compliance"><LazyRoute><TransportPack /></LazyRoute></RequireSectorModule> },
      { path: 'education', element: <RequireSectorModule module="education.institution_registry"><LazyRoute><EducationPack /></LazyRoute></RequireSectorModule> },
      { path: 'healthcare', element: <RequireSectorModule module="healthcare.health_facility_registry"><LazyRoute><HealthcarePack /></LazyRoute></RequireSectorModule> },
      { path: 'government', element: <RequireSectorModule module="government.gov_payroll_checkoff"><LazyRoute><GovernmentPack /></LazyRoute></RequireSectorModule> },
      { path: 'technology', element: <RequireSectorModule module="technology.remote_employer_verification"><LazyRoute><TechnologyPack /></LazyRoute></RequireSectorModule> },
      { path: 'finance', element: <RequireSectorModule module="finance.voluntary_investment_products"><LazyRoute><FinancePack /></LazyRoute></RequireSectorModule> },
      { path: 'retail', element: <RequireSectorModule module="retail.agent_collection"><LazyRoute><RetailPack /></LazyRoute></RequireSectorModule> },
      // P34/P35/P36: cross-sector, not module-gated — available to every tenant regardless of sector.
      { path: 'treasury', element: <Treasury /> },
      { path: 'welfare', element: <Welfare /> },
      { path: 'credit-bureau', element: <CreditBureau /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])

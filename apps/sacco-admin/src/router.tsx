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
import { AmlDashboard } from './pages/Aml/AmlDashboard'
import { GovernanceManagement } from './pages/Governance/GovernanceManagement'
import { SharedLendingPrimitives } from './pages/Lending/SharedLendingPrimitives'
import { AgriculturePack } from './pages/SectorPacks/AgriculturePack'
import { TransportPack } from './pages/SectorPacks/TransportPack'
import { EducationPack } from './pages/SectorPacks/EducationPack'
import { HealthcarePack } from './pages/SectorPacks/HealthcarePack'
import { GovernmentPack } from './pages/SectorPacks/GovernmentPack'
import { TechnologyPack } from './pages/SectorPacks/TechnologyPack'
import { FinancePack } from './pages/SectorPacks/FinancePack'
import { RetailPack } from './pages/SectorPacks/RetailPack'
import { Treasury } from './pages/Treasury/Treasury'
import { Welfare } from './pages/Welfare/Welfare'
import { CreditBureau } from './pages/CreditBureau/CreditBureau'

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
      { path: 'aml', element: <AmlDashboard /> },
      { path: 'governance', element: <GovernanceManagement /> },
      { path: 'lending', element: <RequireSectorModule module="lending.assets"><SharedLendingPrimitives /></RequireSectorModule> },
      { path: 'agriculture', element: <RequireSectorModule module="agriculture.produce_tracking"><AgriculturePack /></RequireSectorModule> },
      { path: 'transport', element: <RequireSectorModule module="transport.vehicle_compliance"><TransportPack /></RequireSectorModule> },
      { path: 'education', element: <RequireSectorModule module="education.institution_registry"><EducationPack /></RequireSectorModule> },
      { path: 'healthcare', element: <RequireSectorModule module="healthcare.health_facility_registry"><HealthcarePack /></RequireSectorModule> },
      { path: 'government', element: <RequireSectorModule module="government.gov_payroll_checkoff"><GovernmentPack /></RequireSectorModule> },
      { path: 'technology', element: <RequireSectorModule module="technology.remote_employer_verification"><TechnologyPack /></RequireSectorModule> },
      { path: 'finance', element: <RequireSectorModule module="finance.voluntary_investment_products"><FinancePack /></RequireSectorModule> },
      { path: 'retail', element: <RequireSectorModule module="retail.agent_collection"><RetailPack /></RequireSectorModule> },
      // P34/P35/P36: cross-sector, not module-gated — available to every tenant regardless of sector.
      { path: 'treasury', element: <Treasury /> },
      { path: 'welfare', element: <Welfare /> },
      { path: 'credit-bureau', element: <CreditBureau /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])

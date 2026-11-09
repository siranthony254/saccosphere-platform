import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Icon, type IconName, AdminBackground, InfoTip } from '@saccosphere/ui'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSacco } from '../../hooks/useSacco'
import { clearTokens } from '@saccosphere/api-client'
import { useApplications } from '../../hooks/useApplications'
import { useAdminLoans } from '../../hooks/useLoans'
import { useKycQueue } from '../../hooks/useKyc'
import { useCapabilities } from '../../hooks/useCapabilities'

export function AppShell() {
  const { sidebarCollapsed } = useLayoutStore()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { data: sacco } = useSacco()
  const { data: applications } = useApplications({ status: 'PENDING' })
  const { data: loans } = useAdminLoans()
  const { data: kycQueue } = useKycQueue({ status: 'PENDING' })
  const { isModuleEnabled } = useCapabilities()

  const handleLogout = () => {
    clearAuth()
    clearTokens()
    window.localStorage.removeItem('sacco-admin-refresh-token')
    navigate('/login')
  }

  const pendingAppsCount = applications?.count ?? 0
  const pendingLoansCount = loans?.count ?? 0
  const pendingKycCount = kycQueue?.length ?? 0


  const NAV_ITEMS: { path: string; label: string; icon: IconName; badge: string | null; description: string }[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', badge: null, description: "A snapshot of your SACCO right now — members, savings, loans and what needs your attention today." },
    { path: '/approvals', label: 'Maker-Checker', icon: 'user-check', badge: null, description: 'Sensitive actions that need a second admin to approve before they take effect, so no single person can move money alone.' },
    { path: '/members', label: 'Members', icon: 'users', badge: null, description: 'Search, view and manage everyone who belongs to this SACCO.' },
    { path: '/applications', label: 'Applications', icon: 'file-text', badge: pendingAppsCount > 0 ? String(pendingAppsCount) : null, description: 'People who have applied to join this SACCO and are waiting on your decision.' },
    { path: '/loans', label: 'Loan approvals', icon: 'coins', badge: pendingLoansCount > 0 ? String(pendingLoansCount) : null, description: 'Loan requests waiting for a decision, plus every loan already issued.' },
    { path: '/disbursements', label: 'Disbursements', icon: 'send', badge: null, description: 'Money being paid out to members — track every disbursement and its status.' },
    { path: '/collections', label: 'Collections', icon: 'phone', badge: null, description: 'Follow-ups and call logs for members who are behind on repayments.' },
    { path: '/exits', label: 'Exits & claims', icon: 'id-card', badge: null, description: 'Members leaving the SACCO, and the savings/dividend payouts owed to them on exit.' },
    { path: '/checkoff', label: 'Payroll check-off', icon: 'banknote', badge: null, description: "Employers who deduct members' contributions straight from payroll and send them to this SACCO." },
    { path: '/contributions', label: 'Contributions', icon: 'download', badge: null, description: 'A live feed of every deposit and contribution coming in from members.' },
    { path: '/ledger', label: 'General Ledger', icon: 'file-text', badge: null, description: "This SACCO's full accounting record — every transaction, double-entry, in one place." },
    { path: '/dividends', label: 'Dividends', icon: 'gem', badge: null, description: 'Calculate and pay out each year\'s profit share to members based on their savings and share capital.' },
    { path: '/sms', label: 'Bulk SMS', icon: 'message', badge: null, description: 'Send a text message to many members at once — announcements, reminders, or alerts.' },
    { path: '/reports', label: 'Reports', icon: 'bar-chart', badge: null, description: "Summaries of this SACCO's performance — growth, loans, savings and more." },
    { path: '/returns', label: 'Statutory Returns', icon: 'landmark', badge: null, description: 'The official reports this SACCO must file with the regulator (SASRA) on a schedule.' },
    { path: '/dormancy', label: 'Dormant Accounts & UFAA', icon: 'alert-triangle', badge: null, description: 'Savings that have gone quiet, outreach to reactivate them, and surrendering unclaimed funds to UFAA when required.' },
    { path: '/bill-manager', label: 'Bill Manager', icon: 'receipt', badge: null, description: "Send M-Pesa invoices for a member's loan repayment or savings target, with automatic payment notifications." },
    { path: '/aml', label: 'AML & Fraud', icon: 'shield-check', badge: null, description: 'Flags suspicious transactions and member activity that may need to be reported to authorities.' },
    { path: '/governance', label: 'AGM & Governance', icon: 'landmark', badge: null, description: "Run annual general meetings, elections and committee votes, and keep a record of what was decided." },
    // P24: sector-pack nav items are gated on the tenant's resolved
    // capabilities, not shown unconditionally — a confirmed-OTHER (or
    // unconfirmed self-declared) SACCO gets none of these by default,
    // and a superadmin override can grant/revoke them independent of
    // sector. Gated on each pack's primary/entry module.
    ...(isModuleEnabled('lending.assets') ? [{ path: '/lending', label: 'Lending Primitives', icon: 'coins' as IconName, badge: null, description: 'Shared tools for loans backed by an asset (a vehicle, device, equipment) or by irregular income.' }] : []),
    ...(isModuleEnabled('agriculture.produce_tracking') ? [{ path: '/agriculture', label: 'Agriculture Pack', icon: 'leaf' as IconName, badge: null, description: 'Tools for farming SACCOs — tracking produce sold to buyers, seasonal loans timed to harvest, and buyer payment issues.' }] : []),
    ...(isModuleEnabled('transport.vehicle_compliance') ? [{ path: '/transport', label: 'Transport Pack', icon: 'truck' as IconName, badge: null, description: 'Tools for matatu/boda SACCOs — vehicle registration, driver/conductor assignment, and daily route-levy collection.' }] : []),
    ...(isModuleEnabled('education.institution_registry') ? [{ path: '/education', label: 'Education Pack', icon: 'graduation-cap' as IconName, badge: null, description: 'Tools for teacher/school SACCOs — school fee loans, bursary funds, and device financing.' }] : []),
    ...(isModuleEnabled('healthcare.health_facility_registry') ? [{ path: '/healthcare', label: 'Healthcare Pack', icon: 'activity' as IconName, badge: null, description: 'Tools for health-worker SACCOs — emergency loans, training/CPD financing, and equipment loans.' }] : []),
    ...(isModuleEnabled('government.gov_payroll_checkoff') ? [{ path: '/government', label: 'Government Pack', icon: 'landmark' as IconName, badge: null, description: 'Tools for public-sector SACCOs — government employer registration, transfer tracking, and retirement advances.' }] : []),
    ...(isModuleEnabled('technology.remote_employer_verification') ? [{ path: '/technology', label: 'Technology Pack', icon: 'cpu' as IconName, badge: null, description: 'Tools for tech-sector SACCOs — verifying remote/foreign employers and financing work devices.' }] : []),
    ...(isModuleEnabled('finance.voluntary_investment_products') ? [{ path: '/finance', label: 'Finance Pack', icon: 'gem' as IconName, badge: null, description: 'Fixed-deposit investment products, chama/group joint accounts, and member growth statements.' }] : []),
    ...(isModuleEnabled('retail.agent_collection') ? [{ path: '/retail', label: 'Retail Pack', icon: 'receipt' as IconName, badge: null, description: 'Tools for market-trader SACCOs — daily field-agent collections, table-banking groups, and invoice financing.' }] : []),
    // P34/P35/P36: cross-sector — always shown, not gated on any module.
    { path: '/treasury', label: 'Treasury & Investments', icon: 'bar-chart', badge: null, description: "A record of this SACCO's own investments — fixed deposits, bonds, shares — and the interest they earn." },
    { path: '/welfare', label: 'Welfare Fund', icon: 'handshake', badge: null, description: 'A fund members pay into that helps with hardship — bereavement, medical bills — on a case-by-case basis.' },
    { path: '/credit-bureau', label: 'Credit Bureau', icon: 'id-card', badge: null, description: "A member's internal credit score, a shareable repayment history, and reports sent to credit reference bureaus." },
    { path: '/analytics/liquidity-npl', label: 'Liquidity & NPL', icon: 'trending-down', badge: null, description: 'Early-warning view of cash on hand and loans at risk of default.' },
    { path: '/billing', label: 'SaaS Billing', icon: 'receipt', badge: null, description: "This SACCO's own subscription invoices for using the Saccosphere platform." },
    { path: '/kyc', label: 'KYC Review', icon: 'scan-face', badge: pendingKycCount > 0 ? String(pendingKycCount) : null, description: "Review members' submitted ID documents and approve or reject their identity verification." },
    { path: '/roles', label: 'Roles', icon: 'user-check', badge: null, description: 'Manage which staff members have admin access, and what each one is allowed to do.' },
    { path: '/import', label: 'Import', icon: 'upload', badge: null, description: 'Bulk-upload members or records from a spreadsheet instead of entering them one by one.' },
    { path: '/external-guarantors', label: 'External Guarantors', icon: 'handshake', badge: null, description: "People outside this SACCO who have agreed to guarantee a member's loan." },
    { path: '/settings', label: 'Settings', icon: 'settings', badge: null, description: "This SACCO's own configuration — policies, limits, and how the platform behaves for your members." },
  ]


  return (
    <div className="flex h-dvh overflow-hidden font-sans bg-surface-2 text-ink">
      {/* Sidebar */}
      <aside className={`bg-navy-950 flex min-h-0 flex-col transition-[width] duration-200 shrink-0 border-r border-white/5 ${sidebarCollapsed ? 'w-[60px]' : 'w-[210px]'}`}>
        {/* Logo */}
        <div className="pt-[18px] pb-[14px] px-4 border-b border-white/5">
          {!sidebarCollapsed && (
            <>
              <div className="font-bold text-[15px] text-white font-serif">Saccosphere</div>
              <div className="text-[10px] text-white/30 mt-0.5">SACCO Admin Portal</div>
            </>
          )}
          {sidebarCollapsed && <div className="text-lg text-center font-serif text-white">S</div>}
        </div>

        {/* SACCO chip */}
        {!sidebarCollapsed && (
          <div className="mx-2.5 my-3 bg-mint-700/25 border border-mint-700/35 rounded-lg py-2 px-2.5">
            <div className="text-[13px] font-semibold text-mint-400">{sacco?.name ? String(sacco.name).toUpperCase() : 'SACCO'}</div>
            <div className="text-[10px] text-white/35">{user?.first_name} {user?.last_name} · Admin</div>
          </div>
        )}

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto pt-2 pb-2">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.description}
              aria-label={`${item.label}: ${item.description}`}
              className={({ isActive }) =>
                `flex items-center gap-2 py-[7px] px-2.5 mx-1.5 rounded-md no-underline text-[13px] transition-colors ${
                  isActive
                    ? 'text-mint-400 bg-mint-700/30 font-medium'
                    : 'text-white/45 hover:bg-white/5 font-normal'
                }`
              }
            >
              <Icon name={item.icon} size={17} className="shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-600 text-white text-[9px] px-1.5 py-px rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  <InfoTip text={item.description} label={`What is ${item.label}?`} className="text-white/35" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/5 p-2.5">
          <div className="flex items-center gap-2 py-1.5 px-1.5 cursor-pointer hover:bg-white/5 rounded-md transition-colors" onClick={handleLogout}>
            <div className="w-7 h-7 rounded-full bg-mint-700 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="text-[11px] font-medium text-white/70">{user?.first_name} {user?.last_name}</div>
                <div className="text-[9px] text-white/30">Sign out</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <AdminBackground>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </AdminBackground>
    </div>
  )
}

import { useMemo } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Icon, type IconName, AdminBackground, InfoTip } from '@saccosphere/ui'
import { useAuthStore } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'

const NAV_ITEMS: { path: string; label: string; icon: IconName; badge: string | null; live?: boolean; description: string }[] = [
  { path: '/overview',     label: 'System overview',    icon: 'globe',            badge: null, description: 'A top-level snapshot of the whole platform — every SACCO, at a glance.' },
  { path: '/saccos',       label: 'All SACCOs',         icon: 'building',         badge: null, description: 'Every SACCO using this platform — open one to see or change its own settings.' },
  { path: '/members',      label: 'All Members',        icon: 'users',            badge: null, description: 'Every member across every SACCO on the platform.' },
  { path: '/transactions', label: 'Transactions',       icon: 'arrow-left-right', badge: null, live: true, description: 'A live feed of money moving through the platform right now, across every SACCO.' },
  { path: '/roles',        label: 'Role Management',    icon: 'shield',           badge: null, description: 'Manage which platform staff have access here, and what each one is allowed to do.' },
  { path: '/kyc',          label: 'KYC Review',         icon: 'scan-face',        badge: null, description: "Review submitted ID documents and approve or reject a member's identity verification." },
  { path: '/payment-onboarding', label: 'Payment Onboarding', icon: 'landmark', badge: null, description: "Set up and verify a SACCO's M-Pesa/payment credentials before it can take live payments." },
  { path: '/approvals',    label: 'Maker-Checker & Grants', icon: 'shield-check', badge: null, description: 'Sensitive platform-wide actions waiting on a second approval before they take effect.' },
  { path: '/sectors',      label: 'Sector Gating',      icon: 'clipboard-list',   badge: null, description: "Decide which SACCO belongs to which industry (agriculture, transport, etc.) and which features that unlocks for it." },
  { path: '/migration-toolkit', label: 'Migration Toolkit', icon: 'upload',       badge: null, description: "Bring a brand-new pilot SACCO's historical members, balances and loans onto the platform in bulk." },
  { path: '/disbursement-disputes', label: 'Disbursement Disputes', icon: 'alert-triangle', badge: null, description: 'Cases where a payout to a member went wrong or is being disputed.' },
  { path: '/audit-logs',   label: 'Audit Logs',         icon: 'clipboard-list',   badge: null, description: 'A permanent record of who did what, and when, across the platform.' },
  { path: '/billing',      label: 'Billing & Invoices', icon: 'receipt',          badge: null, description: "Every SACCO's subscription invoices for using this platform." },
  { path: '/compliance',   label: 'Compliance',         icon: 'shield-check',     badge: null, description: 'Platform-wide regulatory flags and compliance checks across every SACCO.' },
  { path: '/system',       label: 'System & API health', icon: 'activity',        badge: null, description: 'Is everything running normally? Server status, uptime and error rates.' },
]

export function AppShell() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const logout = useLogout()

  const navItems = useMemo(() => NAV_ITEMS, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-dvh overflow-hidden font-sans bg-surface-2 text-ink">
      {/* Sidebar — dark slate, distinct from SACCO admin */}
      <aside className="w-[220px] bg-navy-950 flex min-h-0 flex-col shrink-0 border-r border-white/5">
        {/* Logo */}
        <div className="pt-[18px] pb-[14px] px-4 border-b border-white/5">
          <div className="font-bold text-base text-white font-serif">SaccoSphere</div>
          <div className="text-[10px] text-white/25 mt-0.5">Super Admin · Platform control</div>
        </div>

        {/* Super admin chip — indigo accent (different from SACCO admin's green) */}
        <div className="mx-2.5 my-3 bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/35 rounded-lg py-2 px-2.5">
          <div className="text-[13px] font-semibold text-indigo-300">{user?.first_name} {user?.last_name}</div>
          <div className="text-[10px] text-indigo-300/50">CEO · SaccoSphere</div>
        </div>

        {/* Nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto pt-2 pb-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.description}
              aria-label={`${item.label}: ${item.description}`}
              className={({ isActive }) =>
                `flex items-center gap-2 py-[7px] px-2.5 mx-1.5 rounded-md no-underline text-[13px] transition-colors ${
                  isActive
                    ? 'text-indigo-300 bg-indigo-500/20 font-medium'
                    : 'text-white/40 hover:bg-white/5 font-normal'
                }`
              }
            >
              <Icon name={item.icon} size={17} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.live && (
                <span className="flex items-center gap-1 text-[9px] text-mint-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />Live
                </span>
              )}
              {item.badge && (
                <span className="bg-red-600 text-white text-[9px] px-1.5 py-px rounded-full font-bold">{item.badge}</span>
              )}
              <InfoTip text={item.description} label={`What is ${item.label}?`} className="text-white/35" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-2.5">
          <div 
            className="flex items-center gap-2 py-1.5 px-1.5 cursor-pointer hover:bg-white/5 rounded-md transition-colors" 
            onClick={handleLogout}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <div className="text-[11px] font-medium text-white/75">{user?.first_name} {user?.last_name}</div>
              <div className="text-[9px] text-white/25">Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <AdminBackground>
        <main className="min-h-0 flex-1 overflow-y-auto"><Outlet /></main>
      </AdminBackground>
    </div>
  )
}


import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@saccosphere/ui'
import { useAuthStore } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'

const NAV: { path: string; label: string; icon: IconName; badge: string | null; live?: boolean }[] = [
  { path: '/overview',     label: 'System overview',    icon: 'globe',            badge: null },
  { path: '/saccos',       label: 'All SACCOs',         icon: 'building',         badge: null },
  { path: '/members',      label: 'All Members',        icon: 'users',            badge: null },
  { path: '/transactions', label: 'Transactions',       icon: 'arrow-left-right', badge: null, live: true },
  { path: '/roles',        label: 'Role Management',    icon: 'shield',           badge: null },
  { path: '/kyc',          label: 'KYC Review',         icon: 'scan-face',        badge: null },
  { path: '/disbursement-disputes', label: 'Disbursement Disputes', icon: 'alert-triangle', badge: null },
  { path: '/audit-logs',   label: 'Audit Logs',         icon: 'clipboard-list',   badge: null },
  { path: '/billing',      label: 'Billing & Invoices', icon: 'receipt',          badge: null },
  { path: '/compliance',   label: 'Compliance',         icon: 'shield-check',     badge: null },
  { path: '/system',       label: 'System & API health', icon: 'activity',        badge: null },
]

export function AppShell() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const logout = useLogout()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen font-sans bg-surface-2 text-ink">
      {/* Sidebar — dark slate, distinct from SACCO admin */}
      <aside className="w-[220px] bg-navy-950 flex flex-col shrink-0 border-r border-white/5">
        {/* Logo */}
        <div className="pt-[18px] pb-[14px] px-4 border-b border-white/5">
          <div className="font-bold text-base text-white font-serif">Saccosphere</div>
          <div className="text-[10px] text-white/25 mt-0.5">Super Admin · Platform control</div>
        </div>

        {/* Super admin chip — indigo accent (different from SACCO admin's green) */}
        <div className="mx-2.5 my-3 bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/35 rounded-lg py-2 px-2.5">
          <div className="text-[13px] font-semibold text-indigo-300">{user?.first_name} {user?.last_name}</div>
          <div className="text-[10px] text-indigo-300/50">CEO · Saccosphere</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 pt-2">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}


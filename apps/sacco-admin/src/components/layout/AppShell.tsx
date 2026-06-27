import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSacco } from '../../hooks/useSacco'
import { useSaccoAdminDashboard } from '../../hooks/useSaccoAdminDashboard'
import { clearTokens } from '@saccosphere/api-client'

export function AppShell() {
  const { sidebarCollapsed } = useLayoutStore()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { data: sacco } = useSacco()
  const { data: dashboard } = useSaccoAdminDashboard()

  const handleLogout = () => {
    clearAuth()
    clearTokens()
    window.localStorage.removeItem('sacco-admin-refresh-token')
    navigate('/login')
  }

  const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { path: '/members', label: 'Members', icon: '👥', badge: null },
    { path: '/applications', label: 'Applications', icon: '📋', badge: (dashboard?.pending_applications ?? 0) > 0 ? String(dashboard!.pending_applications) : null },
    { path: '/loans', label: 'Loan approvals', icon: '💰', badge: (dashboard?.pending_loan_approvals ?? 0) > 0 ? String(dashboard!.pending_loan_approvals) : null },
    { path: '/contributions', label: 'Contributions', icon: '📥', badge: null },
    { path: '/reports', label: 'Reports', icon: '📈', badge: null },
    { path: '/kyc', label: 'KYC Review', icon: '🔍', badge: (dashboard?.pending_kyc_reviews ?? 0) > 0 ? String(dashboard!.pending_kyc_reviews) : null },
    { path: '/roles', label: 'Roles', icon: '👤', badge: null },
    { path: '/import', label: 'Import', icon: '📤', badge: null },
    { path: '/settings', label: 'Settings', icon: '⚙️', badge: null },
  ]

  return (
    <div className="flex h-screen font-sans bg-surface-2 text-ink">
      {/* Sidebar */}
      <aside className={`bg-navy-950 flex flex-col transition-[width] duration-200 shrink-0 border-r border-white/5 ${sidebarCollapsed ? 'w-[60px]' : 'w-[210px]'}`}>
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
        <nav className="flex-1 pt-2">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-2 py-[7px] px-2.5 mx-1.5 rounded-md no-underline text-[13px] transition-colors ${
                  isActive 
                    ? 'text-mint-400 bg-mint-700/30 font-medium' 
                    : 'text-white/45 hover:bg-white/5 font-normal'
                }`
              }
            >
              <span className="text-sm shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-600 text-white text-[9px] px-1.5 py-px rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

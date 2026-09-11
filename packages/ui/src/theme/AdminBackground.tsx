import type { ReactNode } from 'react'
import { useAdminTheme } from './AdminThemeProvider'

const DOT_GRID = 'radial-gradient(circle, rgba(15,23,42,0.07) 1px, transparent 1px)'

/**
 * The single background layer for the admin portals' content area (the
 * sidebar stays a flat dark navy regardless of theme). Combines four
 * treatments behind the content: an ambient accent glow, a sidebar-to-content
 * gradient bleed, a faint dot-grid texture, and (via the "minimal" preset) a
 * flat opt-out with none of the above.
 *
 * Mount this exactly once, in AppShell, wrapping <Outlet/> — every routed
 * page then automatically sits on top of whatever theme is selected, with no
 * per-page wiring needed.
 */
export function AdminBackground({ children }: { children: ReactNode }) {
  const { preset } = useAdminTheme()

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-surface-2">
      {preset.glow && (
        <>
          {/* Sidebar-to-content bleed: ties the dark sidebar to the content
              area instead of the two reading as separate rectangles. */}
          <div
            className="absolute inset-y-0 left-0 w-28 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(6,9,26,0.05), transparent)' }}
          />

          {/* Ambient accent glow */}
          <div
            className="absolute -top-28 -left-28 w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{ background: preset.glow.primary, filter: 'blur(90px)' }}
          />
          <div
            className="absolute -top-16 left-[280px] w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: preset.glow.secondary, filter: 'blur(100px)' }}
          />

          {/* Faint dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: DOT_GRID, backgroundSize: '22px 22px' }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  )
}

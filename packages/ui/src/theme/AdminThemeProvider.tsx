import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { ADMIN_THEME_PRESETS, DEFAULT_ADMIN_THEME, type AdminThemeId, type AdminThemePreset } from './presets'

const STORAGE_KEY = 'saccosphere_admin_theme'

interface AdminThemeContextValue {
  themeId: AdminThemeId
  preset: AdminThemePreset
  setThemeId: (id: AdminThemeId) => void
  presets: AdminThemePreset[]
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

// Stored as an "r g b" triplet (Tailwind's documented pattern for CSS
// variable colors - see tailwind.config.js's `withOpacity` helper) rather
// than the hex string, so existing opacity-modifier classes like
// bg-violet-50/30 keep working: Tailwind can't extract channels out of an
// opaque `var(--x)` hex value at build time, only combine a pre-split
// triplet with an alpha value at runtime.
function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

function readStoredThemeId(fallback: AdminThemeId): AdminThemeId {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && ADMIN_THEME_PRESETS.some((p) => p.id === stored)) {
      return stored as AdminThemeId
    }
  } catch {
    /* private mode / storage disabled */
  }
  return fallback
}

/**
 * App-wide background theme for the admin portals. Mount once at the root
 * (main.tsx) — <AdminBackground/> inside AppShell reads it via context, so a
 * change in Settings is visible on every screen instantly with no per-page
 * wiring, the same way the member-app's single AppBackground works.
 */
export function AdminThemeProvider({
  children,
  defaultThemeId = DEFAULT_ADMIN_THEME,
}: {
  children: ReactNode
  defaultThemeId?: AdminThemeId
}) {
  const [themeId, setThemeIdState] = useState<AdminThemeId>(() => readStoredThemeId(defaultThemeId))

  const setThemeId = (id: AdminThemeId) => {
    setThemeIdState(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }

  const preset = useMemo(
    () => ADMIN_THEME_PRESETS.find((p) => p.id === themeId) ?? ADMIN_THEME_PRESETS[0],
    [themeId]
  )

  // Every `accent-*` Tailwind class (see both apps' tailwind.config.js)
  // resolves to one of these custom properties, so switching themes
  // re-colors every button/active-nav-link/focus-ring/link app-wide with
  // no per-component wiring - only the CSS variables change.
  useLayoutEffect(() => {
    const root = document.documentElement
    for (const [shade, value] of Object.entries(preset.accent)) {
      root.style.setProperty(`--accent-${shade}`, hexToRgbTriplet(value))
    }
  }, [preset])

  const value = useMemo(
    () => ({ themeId, preset, setThemeId, presets: ADMIN_THEME_PRESETS }),
    [themeId, preset]
  )

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
}

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  return ctx
}

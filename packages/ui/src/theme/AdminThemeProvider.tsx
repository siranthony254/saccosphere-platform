import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ADMIN_THEME_PRESETS, DEFAULT_ADMIN_THEME, type AdminThemeId, type AdminThemePreset } from './presets'

const STORAGE_KEY = 'saccosphere_admin_theme'

interface AdminThemeContextValue {
  themeId: AdminThemeId
  preset: AdminThemePreset
  setThemeId: (id: AdminThemeId) => void
  presets: AdminThemePreset[]
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

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

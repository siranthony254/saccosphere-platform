import { createContext, useContext, useMemo, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { Theme, midnightTheme, resolveTheme } from './tokens'

const ThemeContext = createContext<Theme>(midnightTheme)

/**
 * Resolves the active theme from the user's stored `themeId` (a specific theme
 * or 'system') and the OS colour scheme, and exposes it via `useTheme()`.
 * Wrap the app once, high in the tree.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeId = usePreferencesStore((s) => s.themeId)
  const system = useColorScheme()

  const theme = useMemo<Theme>(
    () => resolveTheme(themeId, system !== 'light'),
    [themeId, system]
  )

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** The active theme. Safe to call outside a provider (falls back to midnight). */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}

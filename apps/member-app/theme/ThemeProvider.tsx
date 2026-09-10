import { createContext, useContext, useMemo, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { Theme, themes, darkTheme, ResolvedMode } from './tokens'

const ThemeContext = createContext<Theme>(darkTheme)

/**
 * Resolves the active theme from the user's stored preference
 * (`system` | `light` | `dark`) and the OS colour scheme, and exposes it via
 * `useTheme()`. Wrap the app once, high in the tree.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = usePreferencesStore((s) => s.themeMode)
  const system = useColorScheme()

  const theme = useMemo<Theme>(() => {
    const resolved: ResolvedMode =
      mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode
    return themes[resolved]
  }, [mode, system])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

/** The active theme. Safe to call outside a provider (falls back to dark). */
export function useTheme(): Theme {
  return useContext(ThemeContext)
}

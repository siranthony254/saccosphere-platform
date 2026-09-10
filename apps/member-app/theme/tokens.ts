/**
 * Semantic colour tokens.
 *
 * Screens should read these through `useTheme()` (see ThemeProvider) instead of
 * re-declaring local `const BACKGROUND = '#06091A'` blocks. The `dark` palette
 * below is the app's current look, value-for-value, so migrating a screen to
 * tokens is a no-op visually until the user picks a different mode.
 */

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedMode = 'light' | 'dark'

export interface Theme {
  mode: ResolvedMode
  isDark: boolean
  colors: {
    /** App background behind everything. */
    bg: string
    /** Raised hero / balance cards. */
    card: string
    /** Default panel / list-row fill. */
    surface: string
    /** Slightly stronger panel fill. */
    surfaceAlt: string
    /** Hairline borders and dividers. */
    border: string
    /** Primary text. */
    text: string
    /** Secondary / caption text. */
    textMuted: string
    /** Disabled / tertiary text. */
    textFaint: string
    /** Brand accent (buttons, links, active states). */
    accent: string
    /** Translucent accent wash. */
    accentSoft: string
    /** Text/icon colour on top of `accent`. */
    onAccent: string
    success: string
    danger: string
    warning: string
    /** Overlay behind modals and (later) behind text on scenic backgrounds. */
    scrim: string
  }
  /** expo-status-bar style that reads well on `bg`. */
  statusBar: 'light' | 'dark'
}

export const darkTheme: Theme = {
  mode: 'dark',
  isDark: true,
  colors: {
    bg: '#06091A',
    card: '#0F172A',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceAlt: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#F8FAFC',
    textMuted: 'rgba(248, 250, 252, 0.68)',
    textFaint: '#9CA3AF',
    accent: '#6D28D9',
    accentSoft: 'rgba(109, 40, 217, 0.15)',
    onAccent: '#FFFFFF',
    success: '#10B981',
    danger: '#F87171',
    warning: '#F59E0B',
    scrim: 'rgba(0, 0, 0, 0.5)',
  },
  statusBar: 'light',
}

export const lightTheme: Theme = {
  mode: 'light',
  isDark: false,
  colors: {
    bg: '#F4F5FA',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: 'rgba(17, 24, 39, 0.04)',
    border: 'rgba(17, 24, 39, 0.12)',
    text: '#111827',
    textMuted: 'rgba(17, 24, 39, 0.60)',
    textFaint: 'rgba(17, 24, 39, 0.38)',
    accent: '#6D28D9',
    accentSoft: 'rgba(109, 40, 217, 0.12)',
    onAccent: '#FFFFFF',
    success: '#059669',
    danger: '#DC2626',
    warning: '#B45309',
    scrim: 'rgba(0, 0, 0, 0.35)',
  },
  statusBar: 'dark',
}

export const themes: Record<ResolvedMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
}

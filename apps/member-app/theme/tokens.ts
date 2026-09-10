/**
 * Theme registry.
 *
 * A theme = a semantic colour set (`colors`) + a backdrop (solid / gradient /
 * image) + a scrim for text legibility over that backdrop. Screens read
 * `colors` through `useTheme()`; `AppBackground` renders the backdrop.
 *
 * `midnight` is the app's original look, value-for-value, and is the default.
 */

import type { ImageSourcePropType } from 'react-native'

export type ThemeId = 'system' | 'midnight' | 'aurora' | 'ember' | 'daybreak' | 'paper'
export type Appearance = 'light' | 'dark'

export interface ThemeColors {
  /** Solid fallback behind everything (used when the backdrop can't paint). */
  bg: string
  /** Raised hero / balance cards. */
  card: string
  /** Default panel / list-row fill. */
  surface: string
  /** Slightly stronger panel fill. */
  surfaceAlt: string
  /** Hairline borders and dividers. */
  border: string
  text: string
  textMuted: string
  textFaint: string
  accent: string
  accentSoft: string
  onAccent: string
  success: string
  danger: string
  warning: string
  /** Overlay behind modals. */
  scrim: string
}

export type Backdrop =
  | { kind: 'solid' }
  | {
      kind: 'gradient'
      colors: string[]
      locations?: number[]
      start?: { x: number; y: number }
      end?: { x: number; y: number }
    }
  | { kind: 'image'; source: ImageSourcePropType }

export interface Theme {
  id: Exclude<ThemeId, 'system'>
  label: string
  appearance: Appearance
  isDark: boolean
  colors: ThemeColors
  backdrop: Backdrop
  /**
   * Top→bottom gradient painted over the backdrop so text stays legible.
   * Empty array = no scrim (fine for solid backdrops).
   */
  scrimColors: string[]
  statusBar: 'light' | 'dark'
}

// ─── shared palettes ─────────────────────────────────────────────────────────

const DARK_COLORS: ThemeColors = {
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
}

const LIGHT_COLORS: ThemeColors = {
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
}

// ─── themes ──────────────────────────────────────────────────────────────────

export const midnightTheme: Theme = {
  id: 'midnight',
  label: 'Midnight',
  appearance: 'dark',
  isDark: true,
  colors: DARK_COLORS,
  backdrop: { kind: 'solid' },
  scrimColors: [],
  statusBar: 'light',
}

export const auroraTheme: Theme = {
  id: 'aurora',
  label: 'Aurora',
  appearance: 'dark',
  isDark: true,
  colors: {
    ...DARK_COLORS,
    bg: '#070B1E',
    card: 'rgba(13, 20, 44, 0.72)',
    surface: 'rgba(255, 255, 255, 0.07)',
    surfaceAlt: 'rgba(255, 255, 255, 0.1)',
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.18)',
    success: '#2DD4BF',
  },
  backdrop: {
    kind: 'gradient',
    colors: ['#0A1230', '#241B54', '#0C3B4A'],
    locations: [0, 0.55, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  scrimColors: ['rgba(7, 11, 30, 0.15)', 'rgba(7, 11, 30, 0.55)'],
  statusBar: 'light',
}

export const emberTheme: Theme = {
  id: 'ember',
  label: 'Ember',
  appearance: 'dark',
  isDark: true,
  colors: {
    ...DARK_COLORS,
    bg: '#140A0A',
    card: 'rgba(38, 18, 18, 0.74)',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceAlt: 'rgba(255, 255, 255, 0.09)',
    accent: '#F97316',
    accentSoft: 'rgba(249, 115, 22, 0.16)',
    onAccent: '#1A0E06',
    success: '#34D399',
    warning: '#FBBF24',
  },
  backdrop: {
    kind: 'gradient',
    colors: ['#1B0D0A', '#3A1526', '#5A2A12'],
    locations: [0, 0.6, 1],
    start: { x: 0, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  scrimColors: ['rgba(20, 10, 10, 0.12)', 'rgba(20, 10, 10, 0.5)'],
  statusBar: 'light',
}

export const daybreakTheme: Theme = {
  id: 'daybreak',
  label: 'Daybreak',
  appearance: 'light',
  isDark: false,
  colors: {
    ...LIGHT_COLORS,
    bg: '#EEF1FB',
    card: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.86)',
    surfaceAlt: 'rgba(17, 24, 39, 0.05)',
    border: 'rgba(17, 24, 39, 0.10)',
    accent: '#5B21B6',
  },
  backdrop: {
    kind: 'gradient',
    colors: ['#DCE7FF', '#E9E2FB', '#FBF1F4'],
    locations: [0, 0.5, 1],
    start: { x: 0, y: 0 },
    end: { x: 0.6, y: 1 },
  },
  scrimColors: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.35)'],
  statusBar: 'dark',
}

export const paperTheme: Theme = {
  id: 'paper',
  label: 'Paper',
  appearance: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  backdrop: { kind: 'solid' },
  scrimColors: [],
  statusBar: 'dark',
}

export const THEMES: Record<Exclude<ThemeId, 'system'>, Theme> = {
  midnight: midnightTheme,
  aurora: auroraTheme,
  ember: emberTheme,
  daybreak: daybreakTheme,
  paper: paperTheme,
}

/** Order shown in the picker. */
export const THEME_ORDER: Array<Exclude<ThemeId, 'system'>> = [
  'midnight',
  'aurora',
  'ember',
  'daybreak',
  'paper',
]

/** Resolve a stored preference (which may be a legacy value) + OS scheme. */
export function resolveTheme(themeId: string | null | undefined, systemDark: boolean): Theme {
  if (themeId === 'dark') return midnightTheme // legacy from the light/dark toggle
  if (themeId === 'light') return paperTheme
  if (themeId && themeId in THEMES) return THEMES[themeId as Exclude<ThemeId, 'system'>]
  // 'system' or unknown → follow the OS
  return systemDark ? midnightTheme : paperTheme
}

// Back-compat re-exports (older imports referenced these names).
export const darkTheme = midnightTheme
export const lightTheme = paperTheme

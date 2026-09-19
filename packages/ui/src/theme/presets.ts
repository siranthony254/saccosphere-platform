// Background + accent theme presets for the admin web apps (super-admin,
// sacco-admin). Each preset supplies:
//   - a full 50-700 accent color scale, applied app-wide via CSS custom
//     properties (see AdminThemeProvider) so every `accent-*` Tailwind
//     class (buttons, active nav links, focus rings, links) follows the
//     selected theme, not just the background.
//   - a pair of soft ambient glow colours rendered behind the content area
//     by <AdminBackground/> — `null` means flat, no glow/texture (the
//     original plain look, kept as an explicit opt-out).
//
// Deliberately excluded from this system: semantic status colors (mint for
// success, red for danger, amber for warning, blue for info). Those carry
// meaning independent of brand identity - an "Approve" button stays green
// regardless of which theme is selected.

export type AdminThemeId = 'indigo' | 'mint' | 'violet' | 'sunset' | 'minimal'

export interface AdminColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
}

export interface AdminThemePreset {
  id: AdminThemeId
  label: string
  description: string
  glow: { primary: string; secondary: string } | null
  swatch: string
  accent: AdminColorScale
}

export const ADMIN_THEME_PRESETS: AdminThemePreset[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    description: 'Super Admin default',
    glow: { primary: 'rgba(99,102,241,0.16)', secondary: 'rgba(139,92,246,0.10)' },
    swatch: '#6366F1',
    accent: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
    },
  },
  {
    id: 'mint',
    label: 'Mint',
    description: 'SACCO Admin default',
    glow: { primary: 'rgba(16,185,129,0.16)', secondary: 'rgba(5,150,105,0.10)' },
    swatch: '#10B981',
    accent: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#047857',
      700: '#064E3B',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Saccosphere brand accent',
    glow: { primary: 'rgba(139,92,246,0.16)', secondary: 'rgba(109,40,217,0.10)' },
    swatch: '#8B5CF6',
    accent: {
      50: '#EDE9FE',
      100: '#C4B5FD',
      200: '#A78BFA',
      300: '#8B5CF6',
      400: '#7C3AED',
      500: '#6D28D9',
      600: '#5018B8',
      700: '#3B0E8C',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber & rose',
    glow: { primary: 'rgba(249,115,22,0.14)', secondary: 'rgba(244,63,94,0.10)' },
    swatch: '#F97316',
    accent: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Flat — no glow or texture',
    glow: null,
    swatch: '#64748B',
    accent: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
    },
  },
]

export const DEFAULT_ADMIN_THEME: AdminThemeId = 'indigo'

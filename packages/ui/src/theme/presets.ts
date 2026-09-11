// Background presets for the admin web apps (super-admin, sacco-admin).
// Each preset is a pair of soft ambient glow colours rendered behind the
// content area by <AdminBackground/> — `null` means flat, no glow/texture
// (the original plain look, kept as an explicit opt-out).

export type AdminThemeId = 'indigo' | 'mint' | 'violet' | 'sunset' | 'minimal'

export interface AdminThemePreset {
  id: AdminThemeId
  label: string
  description: string
  glow: { primary: string; secondary: string } | null
  swatch: string
}

export const ADMIN_THEME_PRESETS: AdminThemePreset[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    description: 'Super Admin default',
    glow: { primary: 'rgba(99,102,241,0.16)', secondary: 'rgba(139,92,246,0.10)' },
    swatch: '#6366F1',
  },
  {
    id: 'mint',
    label: 'Mint',
    description: 'SACCO Admin default',
    glow: { primary: 'rgba(16,185,129,0.16)', secondary: 'rgba(5,150,105,0.10)' },
    swatch: '#10B981',
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Saccosphere brand accent',
    glow: { primary: 'rgba(139,92,246,0.16)', secondary: 'rgba(109,40,217,0.10)' },
    swatch: '#8B5CF6',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm amber & rose',
    glow: { primary: 'rgba(249,115,22,0.14)', secondary: 'rgba(244,63,94,0.10)' },
    swatch: '#F97316',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Flat — no glow or texture',
    glow: null,
    swatch: '#94A3B8',
  },
]

export const DEFAULT_ADMIN_THEME: AdminThemeId = 'indigo'

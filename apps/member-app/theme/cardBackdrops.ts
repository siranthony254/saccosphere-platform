/**
 * Card backdrops.
 *
 * Unlike the full-app image themes scaffolded in assets/themes/ (never
 * completed — no photos were ever dropped in), these are small, bundled
 * gradient "nature scene" treatments the member can apply to individual
 * cards (Profile Details, Balances, SACCO Profile) without changing the
 * app's overall theme or background. Kept as gradients rather than photo
 * assets — no binaries to ship, no upload/storage needed, and it matches
 * the gradient treatment already used by the Aurora/Ember app themes.
 *
 * All of these are deliberately mid-to-dark so the fixed white text/icons
 * drawn over them (see CardBackdrop) stay legible regardless of the
 * member's overall app theme.
 */

export type CardBackdropId =
  | 'sunrise-ridge'
  | 'ocean-depths'
  | 'forest-canopy'
  | 'golden-savannah'
  | 'misty-mountains'
  | 'lavender-dusk'

export interface CardBackdropPreset {
  id: CardBackdropId
  label: string
  colors: string[]
  locations?: number[]
  /** Scrim painted over the gradient so white text stays readable. */
  scrimColors: string[]
}

export const CARD_BACKDROPS: Record<CardBackdropId, CardBackdropPreset> = {
  'sunrise-ridge': {
    id: 'sunrise-ridge',
    label: 'Sunrise Ridge',
    colors: ['#FF9A5A', '#E8598A', '#5B3A9E'],
    locations: [0, 0.55, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)'],
  },
  'ocean-depths': {
    id: 'ocean-depths',
    label: 'Ocean Depths',
    colors: ['#0B3D5C', '#0E6C8C', '#0A2540'],
    locations: [0, 0.5, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)'],
  },
  'forest-canopy': {
    id: 'forest-canopy',
    label: 'Forest Canopy',
    colors: ['#0F3D2E', '#1D6B4A', '#0A2A1F'],
    locations: [0, 0.5, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.32)'],
  },
  'golden-savannah': {
    id: 'golden-savannah',
    label: 'Golden Savannah',
    colors: ['#D9A441', '#B9722E', '#4A2E14'],
    locations: [0, 0.5, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)'],
  },
  'misty-mountains': {
    id: 'misty-mountains',
    label: 'Misty Mountains',
    colors: ['#5C7A93', '#3E5670', '#1E2A3A'],
    locations: [0, 0.55, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.3)'],
  },
  'lavender-dusk': {
    id: 'lavender-dusk',
    label: 'Lavender Dusk',
    colors: ['#8B6FC9', '#5B4B93', '#2E2350'],
    locations: [0, 0.5, 1],
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)'],
  },
}

export const CARD_BACKDROP_ORDER: CardBackdropId[] = [
  'sunrise-ridge',
  'ocean-depths',
  'forest-canopy',
  'golden-savannah',
  'misty-mountains',
  'lavender-dusk',
]

/** Which named card a backdrop preference applies to. */
export type CardBackdropSlot = 'profile' | 'balances' | 'saccoProfile'

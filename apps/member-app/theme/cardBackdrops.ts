/**
 * Card backdrops.
 *
 * Unlike the full-app image themes scaffolded in assets/themes/ (never
 * completed), these are bundled nature photos a member can apply to
 * individual cards (Profile Details, Balances, SACCO Profile) without
 * changing the app's overall theme or background.
 */

import type { ImageSourcePropType } from 'react-native'

export type CardBackdropId =
  | 'savanna-sunset'
  | 'tropical-beach'
  | 'zebra-herd'
  | 'palm-sunset'
  | 'mountain-waterfall'
  | 'waterfall-lagoon'
  | 'deer-forest'
  | 'mountain-meadow'

export interface CardBackdropPreset {
  id: CardBackdropId
  label: string
  source: ImageSourcePropType
  /** Scrim painted over the photo so white text stays readable. */
  scrimColors: string[]
}

export const CARD_BACKDROPS: Record<CardBackdropId, CardBackdropPreset> = {
  'savanna-sunset': {
    id: 'savanna-sunset',
    label: 'Savanna Sunset',
    source: require('../assets/themes/savanna-sunset.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)'],
  },
  'tropical-beach': {
    id: 'tropical-beach',
    label: 'Tropical Beach',
    source: require('../assets/themes/tropical-beach.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)'],
  },
  'zebra-herd': {
    id: 'zebra-herd',
    label: 'Zebra Herd',
    source: require('../assets/themes/zebra-herd.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)'],
  },
  'palm-sunset': {
    id: 'palm-sunset',
    label: 'Palm Sunset',
    source: require('../assets/themes/palm-sunset.jpg'),
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)'],
  },
  'mountain-waterfall': {
    id: 'mountain-waterfall',
    label: 'Mountain Waterfall',
    source: require('../assets/themes/mountain-waterfall.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)'],
  },
  'waterfall-lagoon': {
    id: 'waterfall-lagoon',
    label: 'Waterfall Lagoon',
    source: require('../assets/themes/waterfall-lagoon.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)'],
  },
  'deer-forest': {
    id: 'deer-forest',
    label: 'Deer Forest',
    source: require('../assets/themes/deer-forest.jpg'),
    scrimColors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.45)'],
  },
  'mountain-meadow': {
    id: 'mountain-meadow',
    label: 'Mountain Meadow',
    source: require('../assets/themes/mountain-meadow.jpg'),
    scrimColors: ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)'],
  },
}

export const CARD_BACKDROP_ORDER: CardBackdropId[] = [
  'savanna-sunset',
  'tropical-beach',
  'zebra-herd',
  'palm-sunset',
  'mountain-waterfall',
  'waterfall-lagoon',
  'deer-forest',
  'mountain-meadow',
]

/** Which named card a backdrop preference applies to. */
export type CardBackdropSlot = 'profile' | 'balances' | 'saccoProfile'

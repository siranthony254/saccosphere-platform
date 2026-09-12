import { ReactNode } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { CARD_BACKDROPS, type CardBackdropSlot } from '../../theme/cardBackdrops'

type Props = {
  slot: CardBackdropSlot
  children: ReactNode
  /** Extra style for the outer card container (radius, padding, etc). */
  style?: object
}

/**
 * Wraps a card's contents with its chosen nature-photo backdrop (or
 * nothing, letting the card's own background show through). The photo
 * itself is picked from the centralized "Card backgrounds" section on the
 * Privacy screen, not from a control on the card — this component only
 * renders the result.
 */
export function CardBackdrop({ slot, children, style }: Props) {
  const backdropId = usePreferencesStore((s) => s.cardBackdrops[slot])
  const preset = backdropId ? CARD_BACKDROPS[backdropId] : null

  if (!preset) {
    return <View style={[styles.container, style]}>{children}</View>
  }

  return (
    <ImageBackground source={preset.source} style={[styles.container, style]} imageStyle={styles.image}>
      <LinearGradient
        colors={preset.scrimColors as [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
})

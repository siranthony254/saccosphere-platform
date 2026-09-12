import { ReactNode, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { CARD_BACKDROPS, type CardBackdropSlot } from '../../theme/cardBackdrops'
import { Icon } from './Icon'
import { CardBackdropPicker } from './CardBackdropPicker'

type Props = {
  slot: CardBackdropSlot
  children: ReactNode
  /** Extra style for the outer card container (radius, padding, etc). */
  style?: object
  /** Hide the small customize button (e.g. while a card is disabled). */
  hideCustomizeButton?: boolean
}

/**
 * Wraps a card with its chosen nature-scene backdrop (or nothing, letting
 * the card's own background show through) and a small corner button that
 * opens the picker for this card slot. Drop this around the *contents* of
 * a card — it renders the backdrop behind them and the picker button in
 * the top-right corner.
 */
export function CardBackdrop({ slot, children, style, hideCustomizeButton }: Props) {
  const backdropId = usePreferencesStore((s) => s.cardBackdrops[slot])
  const [pickerOpen, setPickerOpen] = useState(false)
  const preset = backdropId ? CARD_BACKDROPS[backdropId] : null

  return (
    <View style={[styles.container, style]}>
      {preset && (
        <>
          <LinearGradient
            colors={preset.colors as [string, string, ...string[]]}
            locations={preset.locations as [number, number, ...number[]] | undefined}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={preset.scrimColors as [string, string, ...string[]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      )}

      {!hideCustomizeButton && (
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Customize card background"
          style={[styles.customizeButton, { backgroundColor: preset ? 'rgba(0,0,0,0.3)' : 'rgba(120,120,140,0.16)' }]}
        >
          <Icon name="camera" size={13} color={preset ? '#fff' : 'rgba(120,120,140,0.9)'} />
        </Pressable>
      )}

      {children}

      <CardBackdropPicker slot={slot} visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  customizeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

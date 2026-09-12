import { useState } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CARD_BACKDROPS, CARD_BACKDROP_ORDER, type CardBackdropSlot } from '../../theme/cardBackdrops'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useTheme } from '../../theme/ThemeProvider'
import { Icon } from './Icon'
import { hapticSelect } from '../../lib/haptics'

const TARGETS: Array<{ id: CardBackdropSlot; label: string }> = [
  { id: 'profile', label: 'Profile Details' },
  { id: 'balances', label: 'Balances' },
  { id: 'saccoProfile', label: 'SACCO Profile' },
]

/**
 * One place to set the nature-photo backdrop for each customizable card,
 * with a live preview — replaces the old per-card camera-icon pickers.
 */
export function CardBackgroundSettings() {
  const { colors: c } = useTheme()
  const [activeTarget, setActiveTarget] = useState<CardBackdropSlot>('profile')
  const cardBackdrops = usePreferencesStore((s) => s.cardBackdrops)
  const setCardBackdrop = usePreferencesStore((s) => s.setCardBackdrop)

  const currentId = cardBackdrops[activeTarget]
  const currentPreset = currentId ? CARD_BACKDROPS[currentId] : null

  return (
    <View>
      {/* Target selector */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {TARGETS.map((target) => {
          const active = target.id === activeTarget
          return (
            <TouchableOpacity
              key={target.id}
              onPress={() => setActiveTarget(target.id)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: active ? c.accent : c.surfaceAlt,
                borderWidth: 1,
                borderColor: active ? c.accent : c.border,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : c.textMuted }} numberOfLines={1}>
                {target.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Live preview */}
      <View style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 14, height: 110, backgroundColor: c.card }}>
        {currentPreset ? (
          <Image source={currentPreset.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={22} color={c.textFaint} />
          </View>
        )}
        {currentPreset && (
          <LinearGradient
            colors={currentPreset.scrimColors as [string, string, ...string[]]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        <View style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <Text style={{ color: currentPreset ? '#fff' : c.textMuted, fontSize: 11, fontWeight: '700' }}>
            {currentPreset ? currentPreset.label : 'No background set'}
          </Text>
        </View>
      </View>

      {/* Gallery */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            hapticSelect()
            setCardBackdrop(activeTarget, null)
          }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.surfaceAlt,
            borderWidth: 1.5,
            borderColor: currentId === null ? c.accent : c.border,
          }}
        >
          <Icon name="close" size={16} color={c.textMuted} />
          {currentId === null && (
            <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: c.accent, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {CARD_BACKDROP_ORDER.map((id) => {
          const preset = CARD_BACKDROPS[id]
          const selected = currentId === id
          return (
            <TouchableOpacity
              key={id}
              onPress={() => {
                hapticSelect()
                setCardBackdrop(activeTarget, id)
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: selected ? c.accent : 'transparent',
              }}
            >
              <Image source={preset.source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              {selected && (
                <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: c.accent, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={10} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

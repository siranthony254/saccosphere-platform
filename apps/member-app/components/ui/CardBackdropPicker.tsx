import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { CARD_BACKDROPS, CARD_BACKDROP_ORDER, type CardBackdropSlot } from '../../theme/cardBackdrops'
import { useTheme } from '../../theme/ThemeProvider'
import { Icon } from './Icon'

const SLOT_LABELS: Record<CardBackdropSlot, string> = {
  profile: 'Profile Details card',
  balances: 'Balances card',
  saccoProfile: 'SACCO Profile card',
}

type Props = {
  slot: CardBackdropSlot
  visible: boolean
  onClose: () => void
}

export function CardBackdropPicker({ slot, visible, onClose }: Props) {
  const { colors: c } = useTheme()
  const current = usePreferencesStore((s) => s.cardBackdrops[slot])
  const setCardBackdrop = usePreferencesStore((s) => s.setCardBackdrop)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 2 }}>Card background</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 16 }}>{SLOT_LABELS[slot]}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setCardBackdrop(slot, null)
                  onClose()
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, marginBottom: 8,
                  borderWidth: 1.5, borderColor: current === null ? c.accent : c.border, backgroundColor: c.surfaceAlt,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
                  <Icon name="close" size={16} color={c.textMuted} />
                </View>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>None (default)</Text>
                {current === null && <Icon name="check" size={16} color={c.accent} />}
              </TouchableOpacity>

              {CARD_BACKDROP_ORDER.map((id) => {
                const preset = CARD_BACKDROPS[id]
                const selected = current === id
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => {
                      setCardBackdrop(slot, id)
                      onClose()
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, marginBottom: 8,
                      borderWidth: 1.5, borderColor: selected ? c.accent : c.border, backgroundColor: c.surfaceAlt,
                    }}
                  >
                    <LinearGradient
                      colors={preset.colors as [string, string, ...string[]]}
                      locations={preset.locations as [number, number, ...number[]] | undefined}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: 44, height: 44, borderRadius: 10 }}
                    />
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{preset.label}</Text>
                    {selected && <Icon name="check" size={16} color={c.accent} />}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

import { View, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useTheme } from '../../theme/ThemeProvider'
import { THEMES, THEME_ORDER, Theme, ThemeId } from '../../theme/tokens'
import { Icon } from './Icon'

/** Small preview of a theme's backdrop + accent. */
function Swatch({ theme }: { theme: Theme }) {
  const { backdrop, colors } = theme
  return (
    <View style={[styles.swatch, { backgroundColor: colors.bg }]}>
      {backdrop.kind === 'gradient' && (
        <LinearGradient
          colors={backdrop.colors as [string, string, ...string[]]}
          start={backdrop.start ?? { x: 0, y: 0 }}
          end={backdrop.end ?? { x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.swatchDot, { backgroundColor: colors.accent }]} />
      <View style={[styles.swatchBar, { backgroundColor: colors.text, opacity: 0.9 }]} />
      <View style={[styles.swatchBar, styles.swatchBarShort, { backgroundColor: colors.textMuted }]} />
    </View>
  )
}

export function ThemePicker() {
  const active = useTheme()
  const themeId = usePreferencesStore((s) => s.themeId)
  const setThemeId = usePreferencesStore((s) => s.setThemeId)
  const c = active.colors

  const cards: Array<{ id: ThemeId; label: string; preview: Theme }> = [
    { id: 'system', label: 'Follow device', preview: THEMES[active.id] },
    ...THEME_ORDER.map((id) => ({ id, label: THEMES[id].label, preview: THEMES[id] })),
  ]

  return (
    <View style={styles.grid}>
      {cards.map(({ id, label, preview }) => {
        const selected = themeId === id
        return (
          <Pressable
            key={id}
            onPress={() => setThemeId(id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.card,
              { borderColor: selected ? c.accent : c.border, backgroundColor: c.surfaceAlt },
            ]}
          >
            {id === 'system' ? (
              <View style={[styles.swatch, styles.systemSwatch, { borderColor: c.border }]}>
                <Icon name="settings" size={18} color={c.textMuted} />
              </View>
            ) : (
              <Swatch theme={preview} />
            )}
            <View style={styles.cardFooter}>
              <Text numberOfLines={1} style={[styles.cardLabel, { color: c.text }]}>
                {label}
              </Text>
              {selected && <Icon name="check" size={14} color={c.accent} />}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '30%',
    minWidth: 92,
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 6,
    gap: 6,
  },
  swatch: {
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 7,
    gap: 3,
  },
  systemSwatch: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  swatchDot: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swatchBar: {
    height: 4,
    borderRadius: 2,
    width: '80%',
  },
  swatchBarShort: {
    width: '50%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
})

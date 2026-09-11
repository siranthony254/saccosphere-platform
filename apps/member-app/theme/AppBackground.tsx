import { ReactNode } from 'react'
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from './ThemeProvider'

type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Paints the active theme's backdrop (solid / gradient / image) behind its
 * children, with a legibility scrim on top of non-solid backdrops. Content
 * sits above both layers.
 *
 * Solid themes render as a plain coloured View — identical to the previous
 * behaviour — so wrapping a screen in this is safe.
 */
export function AppBackground({ children, style }: Props) {
  const theme = useTheme()
  const { backdrop, colors, scrimColors } = theme

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }, style]}>
      {backdrop.kind === 'gradient' && (
        <LinearGradient
          colors={backdrop.colors as [string, string, ...string[]]}
          locations={backdrop.locations as [number, number, ...number[]] | undefined}
          start={backdrop.start ?? { x: 0, y: 0 }}
          end={backdrop.end ?? { x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {backdrop.kind === 'image' && (
        <ImageBackground
          source={backdrop.source}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}

      {backdrop.kind !== 'solid' && scrimColors.length >= 2 && (
        <LinearGradient
          colors={scrimColors as [string, string, ...string[]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        />
      )}

      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  content: { flex: 1, zIndex: 1 },
})

import { ReactNode } from 'react'
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from './ThemeProvider'

type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

const VIOLET_GLOW = 'rgba(109, 40, 217, 0.15)'
const MINT_GLOW = 'rgba(16, 185, 129, 0.12)'
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)'

/**
 * The one background layer for the whole app, mounted once at the root
 * (app/_layout.tsx). Paints the active theme's backdrop (solid / gradient /
 * image) behind its children, with a legibility scrim on top of non-solid
 * backdrops, plus the signature "deep space" violet/mint glow + grid on the
 * default Midnight theme — this is the same look the landing screen (index)
 * originally hand-rolled for itself; every screen now shares this single
 * instance instead of screens re-implementing it (or not) individually, so
 * a theme change is instantly visible everywhere with no per-screen wiring.
 *
 * Solid themes with no glow render as a plain coloured View — identical to
 * the original behaviour — so wrapping a screen in this is always safe.
 */
export function AppBackground({ children, style }: Props) {
  const theme = useTheme()
  const { backdrop, colors, scrimColors } = theme
  const isMidnight = theme.id === 'midnight'

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

      {isMidnight && (
        <>
          <View style={[styles.glow, styles.violetGlow, { pointerEvents: 'none' }]} />
          <View style={[styles.glow, styles.mintGlow, { pointerEvents: 'none' }]} />
          <View style={[styles.gridContainer, { pointerEvents: 'none' }]}>
            {[...Array(20)].map((_, i) => (
              <View
                key={`grid-${i}`}
                style={[styles.gridLine, { top: i * 60, transform: [{ rotate: '-12deg' }] }]}
              />
            ))}
          </View>
        </>
      )}

      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  content: { flex: 1, zIndex: 1 },
  glow: {
    position: 'absolute',
    borderRadius: 200,
    filter: 'blur(80px)',
  },
  violetGlow: {
    width: 350,
    height: 350,
    backgroundColor: VIOLET_GLOW,
    top: -100,
    left: -100,
  },
  mintGlow: {
    width: 300,
    height: 300,
    backgroundColor: MINT_GLOW,
    top: -80,
    right: -80,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: -100,
    right: -100,
    height: 1,
    backgroundColor: GRID_COLOR,
  },
})

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

const VIOLET_GLOW = 'rgba(109, 40, 217, 0.15)'
const MINT_GLOW = 'rgba(16, 185, 129, 0.12)'
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)'

/**
 * App backdrop. In dark mode it renders the "deep space" ambience (violet/mint
 * glows + faint diagonal grid). In light mode it collapses to a plain themed
 * fill — the glows only read on a near-black background.
 */
export function DeepSpaceBackground({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {isDark && (
        <>
          <View style={[styles.glow, styles.violetGlow]} />
          <View style={[styles.glow, styles.mintGlow]} />
          <View style={styles.gridContainer}>
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
  container: {
    flex: 1,
    position: 'relative',
  },
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
  content: {
    flex: 1,
    zIndex: 1,
  },
})

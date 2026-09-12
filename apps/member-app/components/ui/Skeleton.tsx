import { useEffect, useRef } from 'react'
import { Animated, StyleProp, ViewStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

/**
 * A pulsing placeholder block for loading states — same footprint as a
 * plain gray box, but reads as "still loading" instead of "something is
 * wrong" the way a static block can at a glance.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: Props) {
  const { colors: c } = useTheme()
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: c.surfaceAlt, opacity },
        style,
      ]}
    />
  )
}

import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleProp, Text, ViewStyle } from 'react-native'
import { usePreferencesStore, type CoachmarkId } from '../../store/usePreferencesStore'

type Props = {
  id: CoachmarkId
  text: string
  /** Position the bubble relative to its (already position: relative) parent. */
  style?: StyleProp<ViewStyle>
}

const AUTO_DISMISS_MS = 5000

/**
 * A small one-time callout bubble — shown at most once ever per `id`,
 * across the whole app, then never again. Renders nothing once seen.
 * Place inside a parent that doesn't set `position: 'absolute'` itself
 * (RN views are position: relative by default, so most wrappers work).
 */
export function Coachmark({ id, text, style }: Props) {
  const seen = usePreferencesStore((s) => s.seenCoachmarks[id])
  const hydrated = usePreferencesStore((s) => s._hydrated)
  const markSeen = usePreferencesStore((s) => s.markCoachmarkSeen)
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (seen || !hydrated) return
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
    const timer = setTimeout(() => markSeen(id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, hydrated])

  if (seen || !hydrated) return null

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          backgroundColor: '#1F2937',
          borderRadius: 10,
          paddingVertical: 8,
          paddingHorizontal: 12,
          maxWidth: 200,
          opacity,
          zIndex: 20,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        },
        style,
      ]}
    >
      <Pressable onPress={() => markSeen(id)} hitSlop={8}>
        <Text style={{ color: '#fff', fontSize: 11, lineHeight: 15 }}>{text}</Text>
      </Pressable>
    </Animated.View>
  )
}

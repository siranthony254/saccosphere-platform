import { ReactNode, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Icon, type IconName } from './Icon'

export interface HeroSlide {
  colors: string[]
  icon: IconName
  title: string
  subtitle: string
  /** Optional per-slide action, e.g. "Contribute now" jumping straight to that service. */
  cta?: { label: string; onPress: () => void }
}

const SLIDE_DURATION_MS = 4500
const FADE_DURATION_MS = 500

type Props = {
  slides: HeroSlide[]
  /** Content height excluding insetTop (e.g. the search bar area, or a CTA row). */
  height?: number
  /** Extra top padding (e.g. safe-area inset) when the hero draws edge-to-edge behind the status bar. */
  insetTop?: number
  /** Rendered at the bottom of the hero, over the current slide — e.g. a search bar. */
  children?: ReactNode
}

/**
 * Shared engine behind the app's animated promotional heroes (Discover,
 * Services): cross-fades between bundled gradient slides on a timer, with
 * tap-to-jump dot pagination and an optional per-slide CTA button.
 */
export function HeroCarousel({ slides, height = 220, insetTop = 0, children }: Props) {
  const [index, setIndex] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_DURATION_MS, useNativeDriver: true }).start(() => {
        setIndex((prev) => (prev + 1) % slides.length)
        Animated.timing(opacity, { toValue: 1, duration: FADE_DURATION_MS, useNativeDriver: true }).start()
      })
    }, SLIDE_DURATION_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length])

  const slide = slides[index]

  return (
    <View style={[styles.container, { height: height + insetTop }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient
          colors={slide.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <Animated.View style={{ opacity }}>
          <View style={styles.iconBadge}>
            <Icon name={slide.icon} size={20} color="#fff" />
          </View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          {slide.cta && (
            <TouchableOpacity onPress={slide.cta.onPress} style={styles.cta} activeOpacity={0.85}>
              <Text style={styles.ctaLabel}>{slide.cta.label}</Text>
              <Icon name="arrow-right" size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Dot pagination */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable key={i} onPress={() => setIndex(i)} hitSlop={8}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
    maxWidth: '90%',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 14,
  },
  ctaLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
})

import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Icon, type IconName } from '../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

interface Slide {
  colors: string[]
  icon: IconName
  title: string
  subtitle: string
}

// Bundled promotional slides — no photo assets shipped (same reasoning as the
// card-backdrop feature: no scraping, no generation tool, no upload
// pipeline), so these lean on the same gradient treatment already used
// across the app's own themes and card backdrops.
const SLIDES: Slide[] = [
  {
    colors: ['#4C1D95', '#6D28D9', '#8B5CF6'],
    icon: 'bank',
    title: 'Every SACCO, one app',
    subtitle: 'Browse, join, and manage all your SACCO memberships from a single place.',
  },
  {
    colors: ['#0F3D2E', '#0E7C5A', '#34D399'],
    icon: 'savings',
    title: 'Grow your savings',
    subtitle: 'BOSA and FOSA contributions, tracked in real time, wherever you are.',
  },
  {
    colors: ['#7C2D12', '#C2410C', '#FB923C'],
    icon: 'loan',
    title: 'Loans built around you',
    subtitle: 'Compare rates across your SACCOs and apply in minutes.',
  },
  {
    colors: ['#0C4A6E', '#0369A1', '#38BDF8'],
    icon: 'dividend',
    title: 'Track dividends in real time',
    subtitle: 'See what your membership earns as it is declared and paid out.',
  },
  {
    colors: ['#3B0764', '#7E22CE', '#D946EF'],
    icon: 'security',
    title: 'Bank-grade security',
    subtitle: 'SASRA-regulated SACCOs, encrypted end to end.',
  },
]

const SLIDE_DURATION_MS = 4500
const FADE_DURATION_MS = 500

type Props = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  /** Extra top padding (e.g. safe-area inset) when the hero draws edge-to-edge behind the status bar. */
  insetTop?: number
}

export function DiscoverHero({ search, onSearchChange, placeholder = 'Search SACCOs, sectors, counties...', insetTop = 0 }: Props) {
  const { colors: c } = useTheme()
  const [index, setIndex] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_DURATION_MS, useNativeDriver: true }).start(() => {
        setIndex((prev) => (prev + 1) % SLIDES.length)
        Animated.timing(opacity, { toValue: 1, duration: FADE_DURATION_MS, useNativeDriver: true }).start()
      })
    }, SLIDE_DURATION_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const slide = SLIDES[index]

  return (
    <View style={[styles.container, { height: 220 + insetTop }]}>
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
        </Animated.View>

        {/* Dot pagination */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => setIndex(i)} hitSlop={8}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: c.surface }]}>
          <Icon name="search" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={placeholder}
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={onSearchChange}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 220,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
})

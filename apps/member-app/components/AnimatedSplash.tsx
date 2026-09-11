import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

/**
 * Two-stage launch animation shown on top of the app while it boots.
 *
 * Stage 1 (~2s): white background, brand logo zooming gently in and out.
 * Stage 2 (~2.6s): purple background, "SACCOSPHERE" in strong white caps with
 * the tagline "THE FUTURE OF SACCOS" tracked out to the exact width of the
 * title (so its first/last letters line up) and introduced by a white
 * gradient wave sweeping left to right.
 *
 * Uses the built-in Animated API (native driver) — no worklets — so it can
 * never crash the startup path.
 */

const PURPLE = '#6D28D9'
const WHITE = '#FFFFFF'
const TAGLINE = 'THE FUTURE OF SACCOS'

const STAGE1_MS = 2000
const STAGE2_MS = 2600
const FADE_OUT_MS = 320

type Props = {
  onFinish: () => void
}

export function AnimatedSplash({ onFinish }: Props) {
  const { width } = useWindowDimensions()
  const [stage, setStage] = useState<1 | 2>(1)
  const [titleWidth, setTitleWidth] = useState(0)
  const [tagNaturalWidth, setTagNaturalWidth] = useState(0)

  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.9)).current
  const stage1Opacity = useRef(new Animated.Value(1)).current
  const purpleOpacity = useRef(new Animated.Value(0)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(14)).current
  const tagOpacity = useRef(new Animated.Value(0)).current
  const waveProgress = useRef(new Animated.Value(0)).current
  const rootOpacity = useRef(new Animated.Value(1)).current

  const finishedRef = useRef(false)
  const finish = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    Animated.timing(rootOpacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => onFinish())
  }

  // Stage 1 — logo fade-in + gentle zoom pulse.
  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start()

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.96,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start(() => pulse.start())

    const toStage2 = setTimeout(() => {
      pulse.stop()
      Animated.timing(stage1Opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start()
      setStage(2)
    }, STAGE1_MS)

    return () => {
      clearTimeout(toStage2)
      pulse.stop()
    }
  }, [logoOpacity, logoScale, stage1Opacity])

  // Stage 2 — purple in, title in, wave sweep + tagline, then finish.
  useEffect(() => {
    if (stage !== 2) return

    Animated.timing(purpleOpacity, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start()

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 440,
        delay: 140,
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 440,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    Animated.parallel([
      Animated.timing(waveProgress, {
        toValue: 1,
        duration: 950,
        delay: 460,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 720,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start()

    const done = setTimeout(finish, STAGE2_MS)
    return () => clearTimeout(done)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Track the tagline out so it spans exactly the title width.
  const gap =
    titleWidth > 0 && tagNaturalWidth > 0 && tagNaturalWidth < titleWidth
      ? (titleWidth - tagNaturalWidth) / (TAGLINE.length - 1)
      : 0

  const waveWidth = Math.max(titleWidth, width * 0.5) * 0.55
  const waveTranslateX = waveProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-waveWidth, Math.max(titleWidth, width * 0.5) + waveWidth],
  })

  return (
    <Animated.View
      style={[styles.root, { opacity: rootOpacity, pointerEvents: 'none' }]}
    >
      {/* Stage 1 — white + logo */}
      <Animated.View
        style={[styles.fill, styles.center, { backgroundColor: WHITE, opacity: stage1Opacity }]}
      >
        <Animated.Image
          source={require('../assets/splash-icon.png')}
          resizeMode="contain"
          style={{
            width: width * 0.44,
            height: width * 0.44,
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        />
      </Animated.View>

      {/* Stage 2 — purple + wordmark */}
      <Animated.View
        style={[styles.fill, styles.center, { backgroundColor: PURPLE, opacity: purpleOpacity }]}
      >
        <Animated.Text
          onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
          ]}
        >
          SACCOSPHERE
        </Animated.Text>

        <View
          style={{
            width: titleWidth || undefined,
            marginTop: 12,
            overflow: 'hidden',
          }}
        >
          {/* invisible measuring copy at natural tracking */}
          <Text
            style={[styles.tag, styles.tagMeasure]}
            onLayout={(e) => setTagNaturalWidth(e.nativeEvent.layout.width)}
          >
            {TAGLINE}
          </Text>

          <Animated.Text
            numberOfLines={1}
            style={[styles.tag, { opacity: tagOpacity, letterSpacing: gap }]}
          >
            {TAGLINE}
          </Animated.Text>

          <Animated.View
            style={{
              position: 'absolute',
              top: -6,
              bottom: -6,
              width: waveWidth,
              transform: [{ translateX: waveTranslateX }],
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.92)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  fill: StyleSheet.absoluteFillObject,
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: WHITE,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tag: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  tagMeasure: {
    position: 'absolute',
    opacity: 0,
    letterSpacing: 0,
  },
})

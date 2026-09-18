/**
 * PrivacyGuard
 * Two related protections for a financial app:
 *
 * 1. Blocks screenshots/screen recording app-wide via expo-screen-capture.
 *    On Android this sets FLAG_SECURE (also blocks the recent-apps
 *    thumbnail). On iOS, screenshots can't actually be prevented by any
 *    app — we instead listen for one being taken and nudge the member not
 *    to share it, since it may contain balances or ID photos.
 *
 * 2. Covers the screen with the app splash art whenever the app is
 *    backgrounded (task switcher, app switch, incoming call), so the OS's
 *    backgrounding snapshot never captures a balance or document on
 *    screen — the same concern as a screenshot, just OS-triggered instead
 *    of user-triggered.
 *
 * Mounted once near the root of the tree; renders the background-cover
 * overlay, nothing otherwise.
 */

import { useEffect, useState } from 'react'
import { AppState, Image, Platform, StyleSheet, View } from 'react-native'
import * as ScreenCapture from 'expo-screen-capture'

export function PrivacyGuard() {
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {})

    let screenshotSubscription: { remove: () => void } | null = null
    if (Platform.OS === 'ios') {
      // iOS cannot block a screenshot from being taken, only report it after
      // the fact — best available response is to warn the member.
      screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
        console.warn('Screenshot taken — it may contain sensitive account details.')
      })
    }

    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {})
      screenshotSubscription?.remove()
    }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setCovered(nextState !== 'active')
    })
    return () => subscription.remove()
  }, [])

  if (!covered) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.cover}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    backgroundColor: '#0B0F1A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  logo: {
    width: 96,
    height: 96,
    opacity: 0.8,
  },
})

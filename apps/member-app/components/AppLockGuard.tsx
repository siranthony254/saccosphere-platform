/**
 * AppLockGuard
 * Requires a fresh biometric check whenever the member returns to the app
 * after it's spent more than GRACE_PERIOD_MS in the background — the same
 * threat this app already covers for a single screenshot (see
 * PrivacyGuard), extended to "someone else picks up an unlocked phone
 * later." Only engages when the device actually has biometrics enrolled
 * and the member hasn't turned it off in Settings; there's no PIN fallback
 * in this app, so unsupported devices simply skip the lock rather than
 * block access with no way back in.
 *
 * Mounted inside the (member) layout, so it only exists once the member is
 * signed in — the login/registration flow is unaffected.
 */

import { useEffect, useRef, useState } from 'react'
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { useAppLockStore } from '../store/useAppLockStore'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { Icon } from './ui/Icon'
import { useTheme } from '../theme/ThemeProvider'

// Ignore brief backgrounding (a permission dialog, sharing to another app,
// switching to copy a value) — only lock for a genuine app-switch away.
const GRACE_PERIOD_MS = 15_000

export function AppLockGuard() {
  const { colors: c } = useTheme()
  const autoLockEnabled = usePreferencesStore((s) => s.autoLockEnabled)
  const { isLocked, backgroundedAt, lock, unlock, setBackgroundedAt } = useAppLockStore()
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(async (hasHardware) => {
      const enrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync())
      setBiometricAvailable(Boolean(enrolled))
    })
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appState.current === 'active'
      appState.current = nextState

      if (wasActive && nextState !== 'active') {
        setBackgroundedAt(Date.now())
        return
      }

      if (nextState === 'active' && backgroundedAt !== null) {
        const elapsed = Date.now() - backgroundedAt
        if (elapsed > GRACE_PERIOD_MS && autoLockEnabled && biometricAvailable) {
          lock()
        } else {
          setBackgroundedAt(null)
        }
      }
    })
    return () => subscription.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundedAt, autoLockEnabled, biometricAvailable])

  const handleUnlock = async () => {
    setAuthenticating(true)
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SaccoSphere',
        disableDeviceFallback: false,
      })
      if (result.success) unlock()
    } finally {
      setAuthenticating(false)
    }
  }

  useEffect(() => {
    if (isLocked) handleUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked])

  if (!isLocked) return null

  return (
    <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: c.bg }]}>
      <View style={[styles.iconCircle, { backgroundColor: c.accentSoft }]}>
        <Icon name="lock" size={28} color={c.accent} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>SaccoSphere is locked</Text>
      <Text style={[styles.subtitle, { color: c.textMuted }]}>
        Verify it&apos;s you to continue where you left off.
      </Text>
      <TouchableOpacity
        onPress={handleUnlock}
        disabled={authenticating}
        style={[styles.button, { backgroundColor: c.accent, opacity: authenticating ? 0.6 : 1 }]}
      >
        <Text style={styles.buttonText}>{authenticating ? 'Verifying…' : 'Unlock'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 9999,
    elevation: 9999,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  button: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})

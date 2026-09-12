/**
 * Thin wrapper around expo-haptics so call sites don't each need their own
 * try/catch — haptics are unsupported on web and some Android devices, and
 * should never be able to break the action they're attached to.
 */
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

function safeHaptic(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return
  fn().catch(() => {
    /* haptics unavailable on this device — ignore */
  })
}

/** Light tap — toggles, selections (e.g. hide/unhide balance, tab switches). */
export function hapticSelect() {
  safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
}

/** A completed, positive action (payment sent, application submitted). */
export function hapticSuccess() {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
}

/** A failed action or blocked state. */
export function hapticError() {
  safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error))
}

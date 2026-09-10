/**
 * Wrapper around @react-native-google-signin/google-signin.
 *
 * The native module is only available in development builds / EAS builds.
 * When running inside Expo Go the underlying TurboModule is not registered,
 * so requiring the package throws. We catch that case and expose a safe
 * fallback so the app can still load and the Google button can show a
 * helpful message.
 *
 * `configure()` must also never be called with an empty `webClientId` while
 * `offlineAccess` is set — the native module throws
 * "RNGoogleSignin: offline use requires server web ClientID" synchronously,
 * which crashes the screen. `configureGoogleSignIn()` below is the only
 * supported way to configure it: it is idempotent and never throws.
 */

export type GoogleSigninType = {
  configure: (options: { webClientId: string; offlineAccess?: boolean }) => void
  hasPlayServices: (options?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>
  signIn: () => Promise<{ idToken: string | null; user: { email: string; name?: string } }>
  signOut: () => Promise<void>
}

// NOT exported — internal fallback only. Only `moduleStatusCodes` below is exported as `statusCodes`.
const fallbackStatusCodes: {
  SIGN_IN_CANCELLED: string
  IN_PROGRESS: string
  PLAY_SERVICES_NOT_AVAILABLE: string
} = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'SIGN_IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
}

const GOOGLE_WEB_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '').trim()

let GoogleSignin: GoogleSigninType | null = null
let moduleStatusCodes = fallbackStatusCodes
let available = false
let configured = false

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const googleSigninModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSigninModule.default ?? googleSigninModule.GoogleSignin
  moduleStatusCodes = googleSigninModule.statusCodes ?? fallbackStatusCodes
  available = true
} catch {
  available = false
}

export { GoogleSignin, moduleStatusCodes as statusCodes }

/** True when the native module is present (development / EAS / store build). */
export function isGoogleSignInAvailable(): boolean {
  return available
}

/**
 * True only when the native module is present AND a web client ID is baked
 * into the build AND `configure()` succeeded. The Google buttons should be
 * gated on this, not on `isGoogleSignInAvailable()` alone — without a client
 * ID the SDK cannot return an idToken.
 */
export function isGoogleSignInConfigured(): boolean {
  return available && !!GoogleSignin && configured
}

/**
 * Idempotent, crash-safe. Call from a screen effect before offering the
 * Google button. Returns whether Google Sign-In is usable afterwards.
 */
export function configureGoogleSignIn(): boolean {
  if (configured) return true
  if (!available || !GoogleSignin) return false
  if (!GOOGLE_WEB_CLIENT_ID) {
    // No client ID in this build — leave it unconfigured so callers fall
    // back to the "unavailable" message instead of a native throw.
    return false
  }
  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    })
    configured = true
  } catch (err) {
    console.warn('Google Sign-In configuration failed:', err)
    configured = false
  }
  return configured
}

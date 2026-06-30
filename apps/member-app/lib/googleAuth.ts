/**
 * Wrapper around @react-native-google-signin/google-signin.
 *
 * The native module is only available in development builds / EAS builds.
 * When running inside Expo Go the underlying TurboModule is not registered,
 * so requiring the package throws. We catch that case and expose a safe
 * fallback so the app can still load and the Google button can show a
 * helpful message.
 */

export type GoogleSigninType = {
  configure: (options: { webClientId: string; offlineAccess?: boolean }) => void
  hasPlayServices: (options?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>
  signIn: () => Promise<{ idToken: string | null; user: { email: string; name?: string } }>
  signOut: () => Promise<void>
}

export const statusCodes: {
  SIGN_IN_CANCELLED: string
  IN_PROGRESS: string
  PLAY_SERVICES_NOT_AVAILABLE: string
} = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'SIGN_IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
}

let GoogleSignin: GoogleSigninType | null = null
let moduleStatusCodes = statusCodes
let available = false

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const googleSigninModule = require('@react-native-google-signin/google-signin')
  GoogleSignin = googleSigninModule.default ?? googleSigninModule.GoogleSignin
  moduleStatusCodes = googleSigninModule.statusCodes ?? statusCodes
  available = true
} catch {
  available = false
}

export { GoogleSignin, moduleStatusCodes as statusCodes }

export function isGoogleSignInAvailable(): boolean {
  return available
}

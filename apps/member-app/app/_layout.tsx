
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { Stack } from 'expo-router'
import { router, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import * as SplashScreen from 'expo-splash-screen'
import { api, setAccessToken, clearTokens, onTokenRotated, onSectorModuleDisabled, onActiveSaccoProblem } from '@saccosphere/api-client'
import { QueryKeys } from '@saccosphere/config'
import { useAuthStore } from '../store/useAuthStore'
import { clearStoredRefreshToken, loadRefreshToken, saveRefreshToken } from '../hooks/useAuth'
import { useAutoRegisterDeviceToken } from '../hooks/useNotifications'
import { AnimatedSplash } from '../components/AnimatedSplash'
import { ThemeProvider, useTheme } from '../theme/ThemeProvider'
import { AppBackground } from '../theme/AppBackground'
// @ts-ignore: Allow side-effect CSS import without type declarations
import '../global.css'

// Hold the native splash (static white + logo) only until JS mounts — the
// AnimatedSplash overlay then covers the launch animation seamlessly.
SplashScreen.preventAutoHideAsync().catch(() => {})
SplashScreen.setOptions?.({ fade: true, duration: 200 })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

export default function RootLayout() {
  const { setAuth, clearAuth, setAuthReady } = useAuthStore()
  const pathname = usePathname()
  const initialPathname = useRef(pathname)
  const [splashDone, setSplashDone] = useState(false)

  // Reveal the JS UI (behind the AnimatedSplash overlay) as soon as it mounts.
  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {})
    }, 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Persist a rotated refresh token from api-client (works on native + web;
    // `window.addEventListener` does not exist on React Native).
    onTokenRotated((refreshToken) => {
      saveRefreshToken(refreshToken)
    })

    // P24: a sector-pack action got refused because this member's SACCO
    // doesn't have that feature (anymore). Refetch their memberships (the
    // closest thing this app has to a capabilities cache) and say why.
    onSectorModuleDisabled(({ name }) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.memberships() })
      Alert.alert('Not available', `${name} isn't available for this SACCO.`)
    })

    // The member's cached "which SACCO am I acting as" is wrong — either it
    // stopped being valid, or an action needed one and none was implied.
    // There's no single global switcher to pop open from here, so refresh
    // the membership list and send them to pick one from the menu.
    onActiveSaccoProblem((kind) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.memberships() })
      Alert.alert(
        kind === 'invalid' ? 'SACCO no longer available' : 'Choose a SACCO',
        kind === 'invalid'
          ? 'Your access to that SACCO has changed. Pick another one from the menu.'
          : 'This needs a specific SACCO — pick one from the menu.',
        [{ text: 'OK', onPress: () => router.push('/(member)/menu') }]
      )
    })

    const initAuth = async () => {
      const startupPathname = initialPathname.current

      try {
        const refresh = await loadRefreshToken()
        if (!refresh) {
          // No refresh token - user is not logged in, just mark auth as ready
          setAuthReady(true)
          return
        }

        const tokens = await api.auth.refresh(refresh)
        setAccessToken(tokens.access)
        if ('refresh' in tokens && typeof tokens.refresh === 'string') {
          await saveRefreshToken(tokens.refresh)
        }

        const user = await api.member.getProfile()

        if (user.role !== 'member') {
          throw new Error('Only member accounts may use the member app.')
        }

        setAuth({ token: tokens.access, user })
        if (!isRegistrationPath(startupPathname)) {
          router.replace('/(member)')
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error)
        clearTokens()
        await clearStoredRefreshToken()
        clearAuth()
        setAuthReady(true)
        if (!isAuthPath(startupPathname)) {
          router.replace('/')
        }
      }
    }

    initAuth()

    return () => {
      onTokenRotated(null)
      onSectorModuleDisabled(null)
      onActiveSaccoProblem(null)
    }
  }, [clearAuth, setAuth, setAuthReady])

  useEffect(() => {
    initialPathname.current = pathname
  }, [pathname])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <KeyboardProvider>
              <ThemedStatusBar />
              <AutoDeviceRegistrar />
              <ThemedStack />
              {/* Screen capture protection is disabled for this preview build. */}
              {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
            </KeyboardProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

function ThemedStatusBar() {
  const theme = useTheme()
  // translucent + a transparent Android background makes sure the status
  // bar always shows the app's own current backdrop through it, instead of
  // occasionally keeping a stale/default system bar color that can make a
  // light theme's dark-style icons (Daybreak, Paper) blend into it.
  return <StatusBar style={theme.statusBar} translucent backgroundColor="transparent" />
}

// Single, app-wide backdrop. Every nested navigator (this Stack, the (auth)
// Stack, the (member) Tabs, the apply/ Stack) sets its own scene/content
// background to transparent so this is the only background layer anywhere —
// a theme or backdrop change is instantly visible on every screen with no
// per-screen wrapping required.
function ThemedStack() {
  return (
    <AppBackground>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </AppBackground>
  )
}

function AutoDeviceRegistrar() {
  useAutoRegisterDeviceToken()
  return null
}

function isAuthPath(pathname: string) {
  return pathname.includes('/login') || pathname.includes('/forgot-password') || isRegistrationPath(pathname)
}

function isRegistrationPath(pathname: string) {
  return pathname.includes('/register')
}

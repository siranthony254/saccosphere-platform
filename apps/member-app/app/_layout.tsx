
import { useEffect, useRef, useState } from 'react'
import { Stack } from 'expo-router'
import { router, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import * as SplashScreen from 'expo-splash-screen'
import { api, setAccessToken, clearTokens, onTokenRotated } from '@saccosphere/api-client'
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
    }
  }, [clearAuth, setAuth, setAuthReady])

  useEffect(() => {
    initialPathname.current = pathname
  }, [pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ThemedStatusBar />
            <AutoDeviceRegistrar />
            <ThemedStack />
            {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
          </KeyboardProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function ThemedStatusBar() {
  const theme = useTheme()
  return <StatusBar style={theme.statusBar} />
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

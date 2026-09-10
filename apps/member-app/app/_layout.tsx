
import { useEffect, useRef, useState } from 'react'
import { Stack } from 'expo-router'
import { router, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { api, setAccessToken, clearTokens, onTokenRotated } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import { clearStoredRefreshToken, loadRefreshToken, saveRefreshToken } from '../hooks/useAuth'
import { useAutoRegisterDeviceToken } from '../hooks/useNotifications'
// @ts-ignore: Allow side-effect CSS import without type declarations
import '../global.css'

// Hold the native splash on screen until auth bootstrap finishes.
SplashScreen.preventAutoHideAsync().catch(() => {})
SplashScreen.setOptions?.({ fade: true, duration: 300 })

// Keep the splash visible for at least this long so it doesn't just blink.
const MIN_SPLASH_MS = 1200

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
  const mountedAt = useRef(Date.now())
  const [bootReady, setBootReady] = useState(false)

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
      } finally {
        setBootReady(true)
      }
    }

    initAuth()

    return () => {
      onTokenRotated(null)
    }
  }, [clearAuth, setAuth, setAuthReady])

  // Dismiss the splash once auth is settled, but not before MIN_SPLASH_MS.
  useEffect(() => {
    if (!bootReady) return
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt.current))
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {})
    }, wait)
    return () => clearTimeout(t)
  }, [bootReady])

  useEffect(() => {
    initialPathname.current = pathname
  }, [pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AutoDeviceRegistrar />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
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


import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { router, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { api, setAccessToken, clearTokens } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import { clearStoredRefreshToken, loadRefreshToken, saveRefreshToken } from '../hooks/useAuth'
import { useAutoRegisterDeviceToken } from '../hooks/useNotifications'
// @ts-ignore: Allow side-effect CSS import without type declarations
import '../global.css'

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

  useEffect(() => {
    // Listen for token rotation from api-client
    const handleTokenRotated = (event: any) => {
      const { refreshToken } = event.detail
      saveRefreshToken(refreshToken)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('saccosphere:token_rotated' as any, handleTokenRotated)
    }

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
      if (typeof window !== 'undefined') {
        window.removeEventListener('saccosphere:token_rotated' as any, handleTokenRotated)
      }
    }
  }, [clearAuth, setAuth, setAuthReady])

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

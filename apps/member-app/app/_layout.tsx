
import { useEffect, useRef } from 'react'
import { Stack } from 'expo-router'
import { router, usePathname } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { api, setAccessToken, clearTokens } from '@saccosphere/api-client'
import { useAuthStore } from '../store/useAuthStore'
import { clearStoredRefreshToken, loadRefreshToken } from '../hooks/useAuth'
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
    const initAuth = async () => {
      const startupPathname = initialPathname.current

      try {
        const refresh = await loadRefreshToken()
        if (!refresh) throw new Error('No refresh token')

        const { access } = await api.auth.refresh(refresh)
        setAccessToken(access)
        const user = await api.member.getProfile()

        if (user.role !== 'member') {
          throw new Error('Only member accounts may use the member app.')
        }

        setAuth({ token: access, user })
        if (!isRegistrationPath(startupPathname)) {
          router.replace('/(member)')
        }
      } catch {
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
  }, [clearAuth, setAuth, setAuthReady])

  useEffect(() => {
    initialPathname.current = pathname
  }, [pathname])

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

function isAuthPath(pathname: string) {
  return pathname.includes('/login') || pathname.includes('/forgot-password') || isRegistrationPath(pathname)
}

function isRegistrationPath(pathname: string) {
  return pathname.includes('/register')
}

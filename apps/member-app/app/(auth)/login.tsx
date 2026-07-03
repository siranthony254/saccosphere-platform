import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useLogin, useGoogleAuth } from '../../hooks/useAuth'
import {
  GoogleSignin,
  statusCodes,
  isGoogleSignInAvailable,
} from '../../lib/googleAuth'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { api, setAccessToken } from '@saccosphere/api-client'
import { useAuthStore } from '../../store/useAuthStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a digit'),
})
type LoginForm = z.infer<typeof loginSchema>

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const VIOLET_LIGHT = '#EDE9FE'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { mutate: login, isPending } = useLogin()
  const { mutate: googleAuth, isPending: isGooglePending } = useGoogleAuth()
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()

  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricToken, setBiometricToken] = useState<string | null>(null)
  const [isBiometricPending, setIsBiometricPending] = useState(false)

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    checkBiometrics()
    if (!isGoogleSignInAvailable() || !GoogleSignin) return
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      offlineAccess: true,
    })
  }, [])

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (compatible && enrolled) {
        const stored = await SecureStore.getItemAsync('saccosphere_biometric_refresh_token')
        if (stored) {
          setBiometricToken(stored)
          setBiometricAvailable(true)
        }
      }
    } catch (e) {
      console.warn('Biometric check failed', e)
    }
  }

  const handleBiometricLogin = async () => {
    if (!biometricToken) return
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to Saccosphere',
      })
      if (result.success) {
        setIsBiometricPending(true)
        try {
          const res = await api.auth.refresh(biometricToken)
          setAccessToken(res.access)
          const user = await api.member.getProfile()
          setAuth({ token: res.access, user })
          router.replace('/(member)')
        } catch (e) {
          Alert.alert('Error', 'Session expired. Please log in with password.')
          SecureStore.deleteItemAsync('saccosphere_biometric_refresh_token')
          setBiometricAvailable(false)
        } finally {
          setIsBiometricPending(false)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isGoogleSignInAvailable() || !GoogleSignin) {
      Alert.alert(
        'Google Sign-In unavailable',
        'Google Sign-In requires a custom development build. It does not work in Expo Go.'
      )
      return
    }

    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.idToken

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token')
        return
      }

      googleAuth(
        { id_token: idToken, flow: 'login' },
        {
          onSuccess: () => router.replace('/(member)'),
          onError: (err) => Alert.alert('Google login failed', err.message),
        }
      )
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in
        return
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Error', 'Sign in is already in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available')
      } else {
        Alert.alert('Error', error.message || 'Something went wrong')
      }
    }
  }

  const onSubmit = handleSubmit((data) => {
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: () => router.replace('/(member)'),
        onError: (err) => Alert.alert('Login failed', err.message),
      }
    )
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: PADDING_H,
          paddingTop: insets.top + 20,
        }}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
      {/* Brand */}
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 40, marginBottom: 24, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-lg font-bold mb-1" style={{ color: TEXT }}>Welcome back</Text>
      <Text className="text-xs mb-6" style={{ color: TEXT_MUTED, lineHeight: 20 }}>
        Sign in to your account
      </Text>

      {/* Social login buttons */}
      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-2"
        style={{ borderWidth: 1, borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
        onPress={handleGoogleSignIn}
        disabled={isGooglePending}
      >
        {isGooglePending ? (
          <ActivityIndicator size="small" color={TEXT} />
        ) : (
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4285F4' }} />
        )}
        <Text className="text-xs font-medium" style={{ color: TEXT }}>
          {isGooglePending ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-3"
        style={{ borderWidth: 1, borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
      >
        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00a550' }} />
        <Text className="text-xs font-medium" style={{ color: TEXT }}>
          Continue with M-Pesa number
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_WHITE }} />
        <Text className="text-xs" style={{ color: TEXT_MUTED }}>or use email</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_WHITE }} />
      </View>

      {/* Email */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: TEXT_MUTED }}>
        Email address
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border rounded-xl p-3 text-sm mb-2"
            style={{
              borderColor: errors.email ? '#EF4444' : BORDER_WHITE,
              color: TEXT,
              backgroundColor: FROSTED_DARK,
            }}
            onChangeText={onChange}
            value={value}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={TEXT_MUTED}
          />
        )}
      />
      {errors.email && <Text className="text-red-500 text-xs mb-1">{errors.email.message}</Text>}

      {/* Password + Forgot password */}
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs font-medium" style={{ color: TEXT_MUTED }}>
          Password
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View
            className="flex-row items-center border rounded-xl mb-1"
            style={{ borderColor: errors.password ? '#EF4444' : BORDER_WHITE, backgroundColor: FROSTED_DARK }}
          >
            <TextInput
              className="flex-1 p-3 pr-2 text-sm"
              style={{ color: TEXT }}
              onChangeText={onChange}
              value={value}
              placeholder="········"
              secureTextEntry={!showPassword}
              placeholderTextColor={TEXT_MUTED}
            />
            <TouchableOpacity
              className="px-3 py-3"
              onPress={() => setShowPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {errors.password && <Text className="text-red-500 text-xs mb-1">{errors.password.message}</Text>}

      {/* Submit */}
          <TouchableOpacity 
            className={`bg-violet-500 rounded-xl p-3.5 items-center mt-2 ${isPending || isBiometricPending ? 'opacity-80' : ''}`}
            onPress={onSubmit}
            disabled={isPending || isBiometricPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-sm font-semibold">Sign in</Text>
            )}
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity 
              className={`bg-mint-600 rounded-xl p-3.5 items-center mt-4 flex-row justify-center gap-2 ${isPending || isBiometricPending ? 'opacity-80' : ''}`}
              onPress={handleBiometricLogin}
              disabled={isPending || isBiometricPending}
            >
              {isBiometricPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 18 }}>🔐</Text>
                  <Text className="text-white text-sm font-semibold">Log in with Biometrics</Text>
                </>
              )}
            </TouchableOpacity>
          )}

      {/* Create account prompt */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-xs" style={{ color: TEXT_MUTED }}>
          No account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
            Create one
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  )
}

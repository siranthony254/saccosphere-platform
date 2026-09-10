import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScreen } from '../../components/ui/KeyboardAwareScreen'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useLogin, useGoogleAuth, saveRefreshToken } from '../../hooks/useAuth'
import {
  GoogleSignin,
  statusCodes,
  isGoogleSignInConfigured,
  configureGoogleSignIn,
} from '../../lib/googleAuth'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { api, setAccessToken } from '@saccosphere/api-client'
import { useAuthStore } from '../../store/useAuthStore'
import { Icon } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

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
  const { colors: c } = useTheme()
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
    // Crash-safe: no-op when the native module or web client ID is missing.
    configureGoogleSignIn()
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
          // Persist the rotated refresh token so biometric login keeps working
          // when the backend rotates refresh tokens.
          const rotated = (res as { refresh?: string }).refresh
          if (rotated) {
            await saveRefreshToken(rotated)
            await SecureStore.setItemAsync('saccosphere_biometric_refresh_token', rotated, {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            })
            setBiometricToken(rotated)
          }
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
    if (!isGoogleSignInConfigured() || !GoogleSignin) {
      Alert.alert(
        'Google Sign-In unavailable',
        'Google Sign-In is not configured for this build. Please sign in with your email and password.'
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
    <KeyboardAwareScreen
      contentContainerStyle={{
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: PADDING_H,
        paddingTop: insets.top + 20,
      }}
    >
      {/* Brand */}
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 40, marginBottom: 24, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-lg font-bold mb-1" style={{ color: c.text }}>Welcome back</Text>
      <Text className="text-xs mb-6" style={{ color: c.textMuted, lineHeight: 20 }}>
        Sign in to your account
      </Text>

      {/* Social login buttons */}
      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-2"
        style={{ borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }}
        onPress={handleGoogleSignIn}
        disabled={isGooglePending}
      >
        {isGooglePending ? (
          <ActivityIndicator size="small" color={c.text} />
        ) : (
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4285F4' }} />
        )}
        <Text className="text-xs font-medium" style={{ color: c.text }}>
          {isGooglePending ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-3"
        style={{ borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }}
      >
        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00a550' }} />
        <Text className="text-xs font-medium" style={{ color: c.text }}>
          Continue with M-Pesa number
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="flex-1 h-px" style={{ backgroundColor: c.border }} />
        <Text className="text-xs" style={{ color: c.textMuted }}>or use email</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: c.border }} />
      </View>

      {/* Email */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>
        Email address
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border rounded-xl p-3 text-sm mb-2"
            style={{
              borderColor: errors.email ? '#EF4444' : c.border,
              color: c.text,
              backgroundColor: c.surface,
            }}
            onChangeText={onChange}
            value={value}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={c.textMuted}
          />
        )}
      />
      {errors.email && <Text className="text-red-500 text-xs mb-1">{errors.email.message}</Text>}

      {/* Password + Forgot password */}
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs font-medium" style={{ color: c.textMuted }}>
          Password
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text className="text-xs font-semibold" style={{ color: c.accent }}>
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
            style={{ borderColor: errors.password ? '#EF4444' : c.border, backgroundColor: c.surface }}
          >
            <TextInput
              className="flex-1 p-3 pr-2 text-sm"
              style={{ color: c.text }}
              onChangeText={onChange}
              value={value}
              placeholder="········"
              secureTextEntry={!showPassword}
              placeholderTextColor={c.textMuted}
            />
            <TouchableOpacity
              className="px-3 py-3"
              onPress={() => setShowPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text className="text-xs font-semibold" style={{ color: c.accent }}>
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
                  <Icon name="security" size={18} color="#fff" />
                  <Text className="text-white text-sm font-semibold">Log in with Biometrics</Text>
                </>
              )}
            </TouchableOpacity>
          )}

      {/* Create account prompt */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-xs" style={{ color: c.textMuted }}>
          No account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-xs font-semibold" style={{ color: c.accent }}>
            Create one
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScreen>
  )
}

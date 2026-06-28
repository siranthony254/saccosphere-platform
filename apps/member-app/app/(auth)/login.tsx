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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useLogin, useGoogleAuth } from '../../hooks/useAuth'
import GoogleSignin, {
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { Platform } from 'react-native'

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

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      offlineAccess: true,
    })
  }, [])

  const handleGoogleSignIn = async () => {
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
    <ScrollView
      contentContainerStyle={{
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: PADDING_H,
        paddingTop: 8,
      }}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      className="bg-surface"
    >
      {/* Brand */}
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 40, marginBottom: 24, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-ink text-lg font-bold mb-1">Welcome back</Text>
      <Text className="text-xs mb-6" style={{ color: INK_MUTED, lineHeight: 20 }}>
        Sign in to your account
      </Text>

      {/* Social login buttons */}
      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-2"
        style={{ borderWidth: 1, borderColor: BORDER_MID, backgroundColor: SURFACE }}
        onPress={handleGoogleSignIn}
        disabled={isGooglePending}
      >
        {isGooglePending ? (
          <ActivityIndicator size="small" color={INK} />
        ) : (
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4285F4' }} />
        )}
        <Text className="text-xs font-medium" style={{ color: INK }}>
          {isGooglePending ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-3"
        style={{ borderWidth: 1, borderColor: BORDER_MID, backgroundColor: SURFACE }}
      >
        <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00a550' }} />
        <Text className="text-xs font-medium" style={{ color: INK }}>
          Continue with M-Pesa number
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_MID }} />
        <Text className="text-xs" style={{ color: INK_FAINT }}>or use email</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_MID }} />
      </View>

      {/* Email */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: INK_SOFT }}>
        Email address
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border rounded-xl p-3 text-sm mb-2"
            style={{
              borderColor: errors.email ? '#EF4444' : BORDER_MID,
              color: INK,
              backgroundColor: SURFACE,
            }}
            onChangeText={onChange}
            value={value}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        )}
      />
      {errors.email && <Text className="text-red-500 text-xs mb-1">{errors.email.message}</Text>}

      {/* Password + Forgot password */}
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs font-medium" style={{ color: INK_SOFT }}>
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
            style={{ borderColor: errors.password ? '#EF4444' : BORDER_MID }}
          >
            <TextInput
              className="flex-1 p-3 pr-2 text-sm"
              style={{ color: INK }}
              onChangeText={onChange}
              value={value}
              placeholder="········"
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
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
        className="rounded-xl py-3.5 px-4 items-center mt-3 mb-4"
        style={{ backgroundColor: VIOLET, opacity: isPending ? 0.6 : 1 }}
        onPress={onSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Sign in</Text>
        )}
      </TouchableOpacity>

      {/* Create account prompt */}
      <View className="flex-row justify-center">
        <Text className="text-xs" style={{ color: INK_MUTED }}>
          No account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
            Create one
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

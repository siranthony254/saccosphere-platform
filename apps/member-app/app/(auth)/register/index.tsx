import { View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { useRegister, useGoogleAuth } from '../../../hooks/useAuth'
import type { ApiError } from '@saccosphere/api-client'
import GoogleSignin, {
  statusCodes,
} from '@react-native-google-signin/google-signin'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  phone_number: z.string().min(10, 'Enter a valid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a digit'),
  password2: z.string().min(8, 'Confirm your password'),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords do not match',
  path: ['password2'],
})
type FormData = z.infer<typeof schema>

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function RegisterStep1() {
  const insets = useSafeAreaInsets()
  const { step1, setStep1, setOtpVerified } = useRegistrationStore()
  const { mutate: register, isPending: isRegistering } = useRegister()
  const { mutate: googleAuth, isPending: isGooglePending } = useGoogleAuth()
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: step1 ?? { email: '', first_name: '', last_name: '', phone_number: '254', password: '', password2: '' },
  })

  const password = watch('password')

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      offlineAccess: true,
    })
  }, [])

  const handleGoogleSignUp = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.idToken

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token')
        return
      }

      googleAuth(
        { id_token: idToken, flow: 'signup' },
        {
          onSuccess: (data) => {
            // If user already exists, backend returns is_existing_user: true
            if (data.is_existing_user) {
              Alert.alert('Account exists', 'An account with this Google account already exists. You have been logged in.')
              router.replace('/(member)')
            } else {
              // New user created, proceed to registration flow
              setStep1({
                email: data.user.email,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                phone_number: '254',
                password: '',
                password2: '',
              })
              setOtpVerified(false)
              router.push('/(auth)/register/otp')
            }
          },
          onError: (err) => Alert.alert('Google sign-up failed', err.message),
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

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']

  const onNext = handleSubmit((data) => {
    setStep1(data)
    setRegistrationError(null)
    register(data, {
      onSuccess: () => {
        setOtpVerified(false)
        router.push('/(auth)/register/otp')
      },
      onError: (error) => {
        const message = getRegistrationErrorMessage(error)
        setRegistrationError(message)
        Alert.alert('Registration failed', message)
      },
    })
  })

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      keyboardShouldPersistTaps="handled"
      className="bg-surface"
    >
        {/* Brand */}
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 40, marginBottom: 14, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>
      
      {/* Step progress bar */}
      <View className="flex-row gap-1 mb-1.5 mt-5">
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i === 0 ? VIOLET : BORDER }}
          />
        ))}
      </View>
      <Text className="text-xs mb-4" style={{ color: INK_FAINT }}>
        Step 1 of 4 — Personal details
      </Text>

      {/* Heading */}
      <Text className="text-ink text-base font-bold mb-1">Create your account</Text>
      <Text className="text-xs mb-4" style={{ color: INK_MUTED, lineHeight: 18 }}>
        Start with your basic information
      </Text>

      {/* Social sign-up */}
      <TouchableOpacity
        className="w-full flex-row items-center justify-center gap-2 py-2.5 rounded-xl mb-2"
        style={{ borderWidth: 1, borderColor: BORDER_MID, backgroundColor: SURFACE }}
        onPress={handleGoogleSignUp}
        disabled={isGooglePending}
      >
        {isGooglePending ? (
          <ActivityIndicator size="small" color={INK} />
        ) : (
          <View className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4285F4' }} />
        )}
        <Text className="text-xs font-medium" style={{ color: INK }}>
          {isGooglePending ? 'Signing up...' : 'Sign up with Google'}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_MID }} />
        <Text className="text-xs" style={{ color: INK_FAINT }}>or fill in manually</Text>
        <View className="flex-1 h-px" style={{ backgroundColor: BORDER_MID }} />
      </View>

      {/* Email */}
      <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
        Email address
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border rounded-xl p-2.5 text-sm mb-2"
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

      {/* First & Last name row */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
            First name
          </Text>
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border rounded-xl p-2.5 text-sm mb-2"
                style={{
                  borderColor: errors.first_name ? '#EF4444' : BORDER_MID,
                  color: INK,
                  backgroundColor: SURFACE,
                }}
                onChangeText={onChange}
                value={value}
                placeholder="James"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
          {errors.first_name && <Text className="text-red-500 text-xs mb-1">{errors.first_name.message}</Text>}
        </View>
        <View className="flex-1">
          <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
            Last name
          </Text>
          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="border rounded-xl p-2.5 text-sm mb-2"
                style={{
                  borderColor: errors.last_name ? '#EF4444' : BORDER_MID,
                  color: INK,
                  backgroundColor: SURFACE,
                }}
                onChangeText={onChange}
                value={value}
                placeholder="Kamau"
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
          {errors.last_name && <Text className="text-red-500 text-xs mb-1">{errors.last_name.message}</Text>}
        </View>
      </View>

      {/* Phone */}
      <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
        Phone (M-Pesa number)
      </Text>
      <Controller
        control={control}
        name="phone_number"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border rounded-xl p-2.5 text-sm mb-2"
            style={{
              borderColor: errors.phone_number ? '#EF4444' : BORDER_MID,
              color: INK,
              backgroundColor: SURFACE,
            }}
            onChangeText={onChange}
            value={value}
            placeholder="254712345678"
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        )}
      />
      {errors.phone_number && <Text className="text-red-500 text-xs mb-1">{errors.phone_number.message}</Text>}

      {/* Password */}
      <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
        Password
      </Text>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View
            className="flex-row items-center border rounded-xl mb-1"
            style={{ borderColor: errors.password ? '#EF4444' : BORDER_MID }}
          >
            <TextInput
              className="flex-1 p-2.5 pr-2 text-sm"
              style={{ color: INK }}
              onChangeText={onChange}
              value={value}
              placeholder="8+ chars, upper, lower, number"
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              className="px-3 py-2.5"
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

      {/* Password strength indicator */}
      <View className="flex-row gap-1 mb-2">
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i < passwordStrength ? strengthColors[passwordStrength - 1] : BORDER }}
          />
        ))}
      </View>
      <Text className="text-xs mb-3" style={{ color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : INK_MUTED }}>
        {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Password strength'}
      </Text>

      {/* Confirm password */}
      <Text className="text-xs font-medium mb-1" style={{ color: INK_SOFT }}>
        Confirm password
      </Text>
      <Controller
        control={control}
        name="password2"
        render={({ field: { onChange, value } }) => (
          <View
            className="flex-row items-center border rounded-xl mb-1"
            style={{ borderColor: errors.password2 ? '#EF4444' : BORDER_MID }}
          >
            <TextInput
              className="flex-1 p-2.5 pr-2 text-sm"
              style={{ color: INK }}
              onChangeText={onChange}
              value={value}
              placeholder="Repeat password"
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              className="px-3 py-2.5"
              onPress={() => setShowConfirmPassword((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
            >
              <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {errors.password2 && <Text className="text-red-500 text-xs mb-1">{errors.password2.message}</Text>}

      {/* API error display */}
      {registrationError && (
        <View className="border rounded-xl p-3 mb-4 mt-1" style={{ backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }}>
          <Text className="text-xs leading-4" style={{ color: '#DC2626' }}>{registrationError}</Text>
        </View>
      )}

      {/* Terms */}
      <Text className="text-xs leading-5 mb-4" style={{ color: INK_FAINT }}>
        By continuing you agree to our{' '}
        <Text style={{ color: VIOLET, fontWeight: '600' }}>Terms of Service</Text> and{' '}
        <Text style={{ color: VIOLET, fontWeight: '600' }}>Privacy Policy</Text>.
      </Text>

      {/* Submit */}
      <TouchableOpacity
        className="rounded-xl py-3.5 items-center"
        style={{ backgroundColor: VIOLET, opacity: isRegistering ? 0.5 : 1 }}
        onPress={onNext}
        disabled={isRegistering}
      >
        {isRegistering ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Continue →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

function getRegistrationErrorMessage(error: unknown) {
  const apiError = error as Partial<ApiError>
  const fieldMessages = apiError.fields
    ? Object.entries(apiError.fields)
        .flatMap(([field, messages]) => {
          const fieldErrors = Array.isArray(messages) ? messages : [String(messages)]
          return fieldErrors.map((message) => `${field}: ${message}`)
        })
        .join('\n')
    : ''

  return fieldMessages || apiError.message || 'Unable to create account.'
}

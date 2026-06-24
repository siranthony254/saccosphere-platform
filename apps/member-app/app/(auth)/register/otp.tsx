import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { api } from '@saccosphere/api-client'
import type { ApiError } from '@saccosphere/api-client'
import { useIsAuthenticated } from '../../../store/useAuthStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const MINT_LIGHT = '#E6F7F1'
const SURFACE = '#FFFFFF'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function RegisterOTP() {
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const { step1, setOtpVerified } = useRegistrationStore()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    if (!step1) {
      router.replace('/(auth)/register')
      return
    }
  }, [step1])

  useEffect(() => {
    if (!step1 || !isAuthenticated || otpSent || otpError) return

    api.auth
      .sendOTP(step1.phone_number)
      .then(() => setOtpSent(true))
      .catch((error) => {
        const message = getApiErrorMessage(error, 'Unable to send OTP.')
        setOtpError(message)
        Alert.alert('OTP failed', message)
      })
  }, [step1, isAuthenticated, otpSent, otpError])

  const handleVerify = async () => {
    if (!step1?.phone_number) return
    setLoading(true)
    setOtpError(null)
    try {
      await api.auth.verifyOTP(step1.phone_number, code)
      setOtpVerified(true)
      router.push('/(auth)/register/kyc')
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to verify OTP.')
      setOtpError(message)
      Alert.alert('OTP failed', message)
    } finally {
      setLoading(false)
    }
  }

  const maskedPhone = step1?.phone_number
    ? step1.phone_number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 ··· $3')
    : ''

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
        paddingTop: 20,
      }}
      keyboardShouldPersistTaps="handled"
      className="bg-surface flex-1"
    >
      {/* Step progress bar */}
      <View className="flex-row gap-1 mb-1.5">
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i < 2 ? VIOLET : BORDER }}
          />
        ))}
      </View>
      <Text className="text-xs mb-5" style={{ color: INK_FAINT }}>
        Step 2 of 4 — Verify your phone
      </Text>

      {/* Brand */}
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 14, marginBottom: 14, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-ink text-base font-bold mb-1">Enter the code</Text>
      <Text className="text-xs mb-1" style={{ color: INK_MUTED, lineHeight: 18 }}>
        We sent a 6-digit code to
      </Text>
      <Text className="text-sm font-semibold mb-5" style={{ color: INK }}>
        {maskedPhone || (step1?.phone_number ?? '+254 712 ··· 678')}
      </Text>

      {/* OTP input */}
      {!otpSent && !otpError && (
        <Text className="text-xs mb-4" style={{ color: INK_SOFT }}>
          Sending OTP...
        </Text>
      )}

      {otpError && (
        <View className="border rounded-xl p-3 mb-4" style={{ backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }}>
          <Text className="text-xs leading-4" style={{ color: '#DC2626' }}>{otpError}</Text>
          <TouchableOpacity
            className="mt-2"
            onPress={() => {
              setOtpError(null)
              setOtpSent(false)
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* OTP boxes */}
      <View className="flex-row gap-2 justify-center mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = code.length > i
          const focused = code.length === i
          return (
            <View
              key={i}
              className="w-10 h-12 rounded-xl items-center justify-center"
              style={{
                borderWidth: focused ? 2 : 1.5,
                borderColor: focused ? VIOLET : filled ? MINT : BORDER_MID,
                backgroundColor: filled ? MINT_LIGHT : SURFACE,
              }}
            >
              <Text
                className="text-lg font-semibold"
                style={{
                  color: filled ? '#084D32' : INK,
                }}
              >
                {filled ? code[i] : ''}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Hidden actual input */}
      <TextInput
        className="absolute opacity-0 left-0 right-0 h-0"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      {/* Resend */}
      <Text className="text-xs font-semibold text-center mb-5" style={{ color: VIOLET }}>
        Resend in 0:42
      </Text>

      {/* Alert */}
      <View
        className="rounded-xl p-3 mb-4"
        style={{
          backgroundColor: MINT_LIGHT,
          borderLeftWidth: 3,
          borderLeftColor: MINT,
        }}
      >
        <Text className="text-xs leading-5" style={{ color: '#084D32' }}>
          Code expires in <Text style={{ fontWeight: '600' }}>4 minutes 42 seconds</Text>. Check
          your SMS or M-Pesa notification.
        </Text>
      </View>

      {/* Verify */}
      <TouchableOpacity
        className="rounded-xl py-3.5 items-center mb-3"
        style={{
          backgroundColor: VIOLET,
          opacity: code.length < 6 || !otpSent || otpError ? 0.5 : 1,
        }}
        onPress={handleVerify}
        disabled={loading || code.length < 6 || !otpSent || Boolean(otpError)}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Verify phone →</Text>
        )}
      </TouchableOpacity>

      {/* Wrong number */}
      <View className="flex-row justify-center">
        <Text className="text-xs" style={{ color: INK_MUTED }}>
          Wrong number?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-xs font-semibold" style={{ color: VIOLET }}>
            Change
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as Partial<ApiError>
  const fieldMessages = apiError.fields
    ? Object.entries(apiError.fields)
        .flatMap(([field, messages]) => {
          const fieldErrors = Array.isArray(messages) ? messages : [String(messages)]
          return fieldErrors.map((message) => `${field}: ${message}`)
        })
        .join('\n')
    : ''

  return fieldMessages || apiError.message || fallback
}

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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { api } from '@saccosphere/api-client'
import type { ApiError } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function RegisterOTP() {
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300)
  const [expiryCountdown, setExpiryCountdown] = useState(300)

  const { step1, setOtpVerified } = useRegistrationStore()

  useEffect(() => {
    if (!step1) router.replace('/(auth)/register')
  }, [step1])

  useEffect(() => {
    if (!step1 || otpSent || otpError) return

    api.auth
      .sendOTP(step1.phone_number)
      .then((response) => {
        setOtpSent(true)
        if (response && (response as any).expires_in) {
          const expiry = (response as any).expires_in
          setOtpExpirySeconds(expiry)
          setExpiryCountdown(expiry)
        }
        setCountdown(60)
        setCanResend(false)
      })
      .catch((error) => {
        const message = getApiErrorMessage(error, 'Unable to send OTP.')
        setOtpError(message)
        Alert.alert('OTP failed', message)
      })
  }, [step1, otpSent, otpError])

  useEffect(() => {
    if (!otpSent || countdown <= 0) {
      if (countdown === 0) setCanResend(true)
      return
    }
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [otpSent, countdown])

  useEffect(() => {
    if (!otpSent || expiryCountdown <= 0) return
    const timer = setInterval(() => setExpiryCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [otpSent, expiryCountdown])

  const handleResend = async () => {
    if (!step1?.phone_number || !canResend) return
    try {
      await api.auth.sendOTP(step1.phone_number)
      setCountdown(60)
      setCanResend(false)
      setOtpError(null)
      setExpiryCountdown(otpExpirySeconds)
      Alert.alert('OTP Resent', 'A new code has been sent to your phone.')
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to resend OTP.')
      Alert.alert('Resend failed', message)
    }
  }

  const handleVerify = async () => {
    if (!step1?.phone_number) return

    setLoading(true)
    setOtpError(null)
    try {
      await api.auth.verifyOTP(step1.phone_number, code)

      // Mark OTP verified so KYC step can be unlocked.
      // IMPORTANT: we do not create/log in the user here.
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: PADDING_H,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.top + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row gap-1 mb-1.5">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-1 h-0.5 rounded"
              style={{ backgroundColor: i < 2 ? VIOLET : BORDER_WHITE }}
            />
          ))}
        </View>

        <Text className="text-xs mb-5" style={{ color: TEXT_MUTED }}>
          Step 2 of 4 — Verify your phone
        </Text>

        <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 14, marginBottom: 14, fontFamily: 'Fraunces_700Bold' }}>
          Saccosphere
        </Text>

        <Text className="text-base font-bold mb-1" style={{ color: TEXT }}>
          Enter the code
        </Text>
        <Text className="text-xs mb-1" style={{ color: TEXT_MUTED, lineHeight: 18 }}>
          We sent a 6-digit code to
        </Text>
        <Text className="text-sm font-semibold mb-5" style={{ color: TEXT }}>
          {maskedPhone || (step1?.phone_number ?? '+254 712 ··· 678')}
        </Text>

        {!otpSent && !otpError && <Text className="text-xs mb-4" style={{ color: TEXT_MUTED }}>Sending OTP...</Text>}

        {otpError && (
          <View className="border rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: '#EF4444' }}>
            <Text className="text-xs leading-4" style={{ color: '#FCA5A5' }}>
              {otpError}
            </Text>
            <TouchableOpacity
              className="mt-2"
              onPress={() => {
                setOtpError(null)
                setOtpSent(false)
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: VIOLET }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

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
                  borderColor: focused ? VIOLET : filled ? MINT : BORDER_WHITE,
                  backgroundColor: filled ? 'rgba(16, 185, 129, 0.2)' : FROSTED_DARK,
                }}
              >
                <Text className="text-lg font-semibold" style={{ color: filled ? MINT : TEXT }}>
                  {filled ? code[i] : ''}
                </Text>
              </View>
            )
          })}
        </View>

        <TextInput
          className="absolute opacity-0 left-0 right-0 h-0"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />

        {canResend ? (
          <TouchableOpacity onPress={handleResend} className="mb-5">
            <Text className="text-xs font-semibold text-center" style={{ color: VIOLET }}>
              Resend code
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-xs font-semibold text-center mb-5" style={{ color: TEXT_MUTED }}>
            Resend in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
          </Text>
        )}

        <View
          className="rounded-xl p-3 mb-4"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderLeftWidth: 3,
            borderLeftColor: MINT,
          }}
        >
          <Text className="text-xs leading-5" style={{ color: MINT }}>
            Code expires in <Text style={{ fontWeight: '600' }}>{Math.floor(expiryCountdown / 60)} minutes {expiryCountdown % 60} seconds</Text>. Check your SMS or M-Pesa notification.
          </Text>
        </View>

        <TouchableOpacity
          className="rounded-xl py-3.5 items-center mb-3"
          style={{ backgroundColor: VIOLET, opacity: code.length < 6 || !otpSent || otpError ? 0.5 : 1 }}
          onPress={handleVerify}
          disabled={loading || code.length < 6 || !otpSent || Boolean(otpError)}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Verify phone →</Text>}
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-xs" style={{ color: TEXT_MUTED }}>Wrong number? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-xs font-semibold" style={{ color: VIOLET }}>Change</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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

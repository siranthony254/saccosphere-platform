import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScreen } from '../../../components/ui/KeyboardAwareScreen'
import { router } from 'expo-router'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { api } from '@saccosphere/api-client'
import type { ApiError } from '@saccosphere/api-client'
import { useTheme } from '../../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))


export default function RegisterOTP() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300)
  const [expiryCountdown, setExpiryCountdown] = useState(300)
  const [channel, setChannel] = useState<'PHONE' | 'EMAIL'>('PHONE')
  // 'select' = user is choosing a delivery channel; no OTP has been sent yet.
  // 'code'   = an OTP has been sent, user is entering it.
  const [phase, setPhase] = useState<'select' | 'code'>('select')

  const { step1, setOtpVerified } = useRegistrationStore()
  const codeInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!step1) router.replace('/(auth)/register')
  }, [step1])

  // Focus the (visually hidden) code field once we're on the entry screen.
  useEffect(() => {
    if (phase === 'code' && otpSent) {
      const t = setTimeout(() => codeInputRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [phase, otpSent])

  // No OTP is sent until the user explicitly picks a channel below.
  const sendOtpRequest = (deliveryChannel: 'PHONE' | 'EMAIL') => {
    if (!step1?.phone_number) return

    setLoading(true)
    setOtpError(null)
    api.auth
      .sendOTP(step1.phone_number, { channel: deliveryChannel })
      .then((response) => {
        setOtpSent(true)
        setChannel(deliveryChannel)
        setPhase('code')
        if (response && (response as any).expires_in) {
          const expiry = (response as any).expires_in
          setOtpExpirySeconds(expiry)
          setExpiryCountdown(expiry)
        }
        setCountdown(60)
        setCanResend(false)
      })
      .catch((error) => {
        const message = getApiErrorMessage(
          error,
          deliveryChannel === 'EMAIL'
            ? 'Email codes aren’t available for sign-up right now — use SMS instead.'
            : 'Unable to send the SMS code. Please try again.'
        )
        setOtpError(message)
      })
      .finally(() => setLoading(false))
  }

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

  const handleResend = async (newChannel?: 'PHONE' | 'EMAIL') => {
    if (!step1?.phone_number || (!canResend && !newChannel)) return

    const targetChannel = newChannel || channel
    try {
      await api.auth.sendOTP(step1.phone_number, { channel: targetChannel })
      setChannel(targetChannel)
      setCountdown(60)
      setCanResend(false)
      setOtpError(null)
      setExpiryCountdown(otpExpirySeconds)
      Alert.alert('OTP Resent', `A new code has been sent to your ${targetChannel === 'EMAIL' ? 'email' : 'phone'}.`)
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
      await api.auth.verifyOTP(step1.phone_number, code, { purpose: 'PHONE_VERIFY' })

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

  const maskedEmail = step1?.email
    ? step1.email.replace(/(.{2})(.*)(@.*)/, '$1···$3')
    : ''

  return (
    <KeyboardAwareScreen
      background={c.bg}
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
        paddingTop: insets.top + 20,
      }}
    >
        <View className="flex-row gap-1 mb-1.5">
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              className="flex-1 h-0.5 rounded"
              style={{ backgroundColor: i < 2 ? c.accent : c.border }}
            />
          ))}
        </View>

        <Text className="text-xs mb-5" style={{ color: c.textMuted }}>
          Step 2 of 4 — Verify your contact
        </Text>

        <Text style={{ color: c.accent, fontWeight: '700', fontSize: 14, marginBottom: 14, fontFamily: 'Fraunces_700Bold' }}>
          Saccosphere
        </Text>

        {/* ── PHASE: choose delivery channel (nothing sent yet) ────────────── */}
        {phase === 'select' && (
          <>
            <Text className="text-base font-bold mb-1" style={{ color: c.text }}>
              How should we send your code?
            </Text>
            <Text className="text-xs mb-5" style={{ color: c.textMuted, lineHeight: 18 }}>
              Pick a channel. We only send the 6-digit code once you choose.
            </Text>

            {otpError && (
              <View className="border rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: '#EF4444' }}>
                <Text className="text-xs leading-4" style={{ color: '#FCA5A5' }}>{otpError}</Text>
              </View>
            )}

            <TouchableOpacity
              className="border rounded-xl p-3.5 mb-2.5 flex-row items-center"
              style={{ borderColor: c.border, backgroundColor: c.surface, opacity: loading ? 0.6 : 1 }}
              onPress={() => sendOtpRequest('PHONE')}
              disabled={loading}
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: c.text }}>Text message (SMS)</Text>
                <Text className="text-xs mt-0.5" style={{ color: c.textMuted }}>
                  {maskedPhone || step1?.phone_number || 'your phone'}
                </Text>
              </View>
              {loading && channel === 'PHONE' ? (
                <ActivityIndicator color={c.accent} />
              ) : (
                <Text className="text-xs font-semibold" style={{ color: c.accent }}>Send →</Text>
              )}
            </TouchableOpacity>

            {step1?.email ? (
              <TouchableOpacity
                className="border rounded-xl p-3.5 mb-2.5 flex-row items-center"
                style={{ borderColor: c.border, backgroundColor: c.surface, opacity: loading ? 0.6 : 1 }}
                onPress={() => sendOtpRequest('EMAIL')}
                disabled={loading}
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: c.text }}>Email</Text>
                  <Text className="text-xs mt-0.5" style={{ color: c.textMuted }}>{maskedEmail}</Text>
                </View>
                {loading && channel === 'EMAIL' ? (
                  <ActivityIndicator color={c.accent} />
                ) : (
                  <Text className="text-xs font-semibold" style={{ color: c.accent }}>Send →</Text>
                )}
              </TouchableOpacity>
            ) : null}

            <Text className="text-xs mt-2" style={{ color: c.textMuted, lineHeight: 16 }}>
              SMS is the fastest for M-Pesa phones. Email delivery depends on your account being
              set up for it.
            </Text>
          </>
        )}

        {/* ── PHASE: enter the code that was sent ──────────────────────────── */}
        {phase === 'code' && (
          <>
        <Text className="text-base font-bold mb-1" style={{ color: c.text }}>
          Enter the code
        </Text>
        <Text className="text-xs mb-1" style={{ color: c.textMuted, lineHeight: 18 }}>
          We sent a 6-digit code to your {channel === 'EMAIL' ? 'email' : 'phone'}
        </Text>
        <Text className="text-sm font-semibold mb-5" style={{ color: c.text }}>
          {channel === 'EMAIL' ? maskedEmail : (maskedPhone || (step1?.phone_number ?? '+254 712 ··· 678'))}
        </Text>

        {otpError && (
          <View className="border rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: '#EF4444' }}>
            <Text className="text-xs leading-4" style={{ color: '#FCA5A5' }}>
              {otpError}
            </Text>
            <TouchableOpacity
              className="mt-2"
              onPress={() => {
                setOtpError(null)
                setCode('')
                setOtpSent(false)
                setPhase('select')
              }}
            >
              <Text className="text-xs font-semibold" style={{ color: c.accent }}>Choose another method</Text>
            </TouchableOpacity>
          </View>
        )}

        <Pressable
          className="flex-row gap-2 justify-center mb-6"
          onPress={() => codeInputRef.current?.focus()}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const filled = code.length > i
            const focused = code.length === i
            return (
              <View
                key={i}
                className="w-10 h-12 rounded-xl items-center justify-center"
                style={{
                  borderWidth: focused ? 2 : 1.5,
                  borderColor: focused ? c.accent : filled ? c.success : c.border,
                  backgroundColor: filled ? 'rgba(16, 185, 129, 0.2)' : c.surface,
                }}
              >
                <Text className="text-lg font-semibold" style={{ color: filled ? c.success : c.text }}>
                  {filled ? code[i] : ''}
                </Text>
              </View>
            )
          })}

          {/* Visually hidden but focusable — captures the keyboard input. */}
          <TextInput
            ref={codeInputRef}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            caretHidden
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            importantForAutofill="yes"
          />
        </Pressable>

        <Text className="text-xs text-center mb-4" style={{ color: c.textMuted }}>
          Tap the boxes above and type the 6-digit code.
        </Text>

        <View className="mb-5 flex-row justify-center gap-4">
          {canResend ? (
            <>
              <TouchableOpacity onPress={() => handleResend('PHONE')}>
                <Text className="text-xs font-semibold" style={{ color: c.accent }}>
                  Resend SMS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleResend('EMAIL')}>
                <Text className="text-xs font-semibold" style={{ color: c.accent }}>
                  Resend Email
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-xs font-semibold text-center" style={{ color: c.textMuted }}>
              Resend in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>

        <View
          className="rounded-xl p-3 mb-4"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderLeftWidth: 3,
            borderLeftColor: c.success,
          }}
        >
          <Text className="text-xs leading-5" style={{ color: c.success }}>
            Code expires in <Text style={{ fontWeight: '600' }}>{Math.floor(expiryCountdown / 60)} minutes {expiryCountdown % 60} seconds</Text>. Check your SMS or Email.
          </Text>
        </View>

        <TouchableOpacity
          className="rounded-xl py-3.5 items-center mb-3"
          style={{ backgroundColor: c.accent, opacity: code.length < 6 || !otpSent || otpError ? 0.5 : 1 }}
          onPress={handleVerify}
          disabled={loading || code.length < 6 || !otpSent || Boolean(otpError)}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Verify code →</Text>}
        </TouchableOpacity>
          </>
        )}

        <View className="flex-row justify-center">
          <Text className="text-xs" style={{ color: c.textMuted }}>Wrong details? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-xs font-semibold" style={{ color: c.accent }}>Change</Text>
          </TouchableOpacity>
        </View>
    </KeyboardAwareScreen>
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

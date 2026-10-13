import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useFeePreview, useWithdrawSavings, useWithdrawalStatus } from '../../hooks/usePayment'
import { useCurrentUser } from '../../store/useAuthStore'
import { useTheme } from '../../theme/ThemeProvider'

// error_code values the withdrawal endpoint can return (payments/withdrawals.py)
// that deserve a specific message instead of the generic server one.
const WITHDRAWAL_ERROR_MESSAGES: Record<string, string> = {
  WITHDRAWABLE_SAVINGS_NOT_ALLOWED: "This SACCO isn't licensed for withdrawable (FOSA) savings yet.",
  B2C_CREDENTIALS_NOT_VALIDATED: "This SACCO's M-Pesa payout setup hasn't been verified by platform support yet.",
  B2C_CREDENTIALS_NOT_VERIFIED: "This SACCO's M-Pesa payout setup hasn't been verified by platform support yet.",
  B2C_FLOAT_FLOOR_NOT_SET: 'This SACCO has no payout float configured yet. Contact platform support.',
  B2C_FLOAT_BELOW_FLOOR: "This SACCO's M-Pesa float is temporarily low — try again shortly or contact your SACCO.",
  B2C_TRANSACTION_LIMIT_EXCEEDED: 'That amount is above the per-transaction withdrawal limit.',
  B2C_DAILY_LIMIT_EXCEEDED: "You've reached today's withdrawal limit.",
  B2C_MONTHLY_LIMIT_EXCEEDED: "You've reached this month's withdrawal limit.",
  B2C_WALLET_DAILY_LIMIT_EXCEEDED: "This SACCO's daily payout limit has been reached — try again tomorrow.",
  B2C_MINIMUM_BALANCE_VIOLATION: "That would take your account below the SACCO's minimum balance.",
}

export default function WithdrawScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug?: string }>()
  const { data: membership } = useMembershipBySacco(slug ?? '')
  const user = useCurrentUser()

  const savingsQuery = useQuery({
    queryKey: ['savings', slug, membership?.sacco_id],
    queryFn: () => api.savings.list({ sacco: membership?.sacco_id ?? slug ?? '', status: 'active' }),
    enabled: Boolean(membership?.sacco_id || slug),
    staleTime: 60_000,
  })

  const savings = savingsQuery.data ?? []
  const [savingId, setSavingId] = useState<string | null>(null)
  const selectedSaving = useMemo(
    () => savings.find((s: any) => s.id === savingId) ?? savings[0] ?? null,
    [savings, savingId]
  )
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(user?.phone_number ?? user?.phone ?? '')

  const numericAmount = Number(String(amount).replace(/[^0-9.]/g, '')) || 0
  const { data: fee } = useFeePreview({ type: 'withdrawal', amount: numericAmount, sacco_id: membership?.sacco_id })
  const withdraw = useWithdrawSavings()

  // Deciding (on 428) needs a fresh step-up code — same requirement as any
  // other maker-checker-gated action once the SACCO has dual control on.
  const [stepUpCode, setStepUpCode] = useState<string | null>(null)
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')

  const [result, setResult] = useState<Awaited<ReturnType<typeof api.payments.withdrawSavings>> | null>(null)
  const statusQuery = useWithdrawalStatus(result?.transactionId || null)

  const available = Number(selectedSaving?.amount ?? 0)
  const youReceive = fee ? Math.round(fee.net_amount) : Math.max(0, numericAmount)

  const doSubmit = (verificationCode?: string) => {
    if (!membership?.sacco_id || !selectedSaving?.id) return
    withdraw.mutate(
      {
        sacco_id: membership.sacco_id,
        saving_id: selectedSaving.id,
        amount: numericAmount,
        phone_number: phone,
        verification_code: verificationCode,
      },
      {
        onSuccess: (res) => {
          setStepUpCode(null)
          setStepUpError(null)
          setResult(res)
        },
        onError: (err: any) => {
          if (err?.status === 428) {
            setStepUpError(stepUpCode !== null ? (err?.message || 'Incorrect verification code.') : null)
            setStepUpCode('')
            return
          }
          const code = err?.code
          const message = (code && WITHDRAWAL_ERROR_MESSAGES[code]) || err?.message || 'Please try again.'
          const correlation = err?.correlationId ? `\n\nReference: ${err.correlationId}` : ''
          Alert.alert('Withdrawal failed', message + correlation)
        },
      }
    )
  }

  const submit = () => {
    if (!membership?.sacco_id || !selectedSaving?.id) {
      Alert.alert('Not ready', 'We could not resolve your savings account. Pull to refresh and try again.')
      return
    }
    if (numericAmount < 10) {
      Alert.alert('Amount too low', 'Enter an amount of at least KES 10.')
      return
    }
    if (numericAmount > available) {
      Alert.alert('Insufficient savings', `You can withdraw up to KES ${available.toLocaleString()} from this account.`)
      return
    }
    if (!phone || phone.replace(/[^0-9]/g, '').length < 9) {
      Alert.alert('Phone required', 'Enter the M-Pesa number to receive the funds.')
      return
    }
    doSubmit()
  }

  const requestStepUpOtp = async () => {
    try {
      await api.auth.requestStepUpOtp()
      setOtpSent(true)
    } catch (err: any) {
      Alert.alert('Could not send code', err?.message || 'Try again in a moment.')
    }
  }

  // ─── Step-up panel (shown instead of the form while a code is needed) ───
  if (stepUpCode !== null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Verify to continue</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
            Your SACCO requires a verification code for withdrawals. Enter the code from your authenticator app,
            or request a one-time code by SMS.
          </Text>
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {stepUpError ? <Text style={{ color: c.danger, fontSize: 12 }}>{stepUpError}</Text> : null}
          <TouchableOpacity onPress={requestStepUpOtp} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.accent, alignItems: 'center' }}>
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>
              {otpSent ? 'Code sent — resend' : 'Send code by SMS'}
            </Text>
          </TouchableOpacity>
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            placeholder="Enter verification code"
            placeholderTextColor={c.textFaint}
            style={{ color: c.text, fontSize: 16, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface }}
          />
          <TouchableOpacity
            onPress={() => { setStepUpCode(otpCode); doSubmit(otpCode) }}
            disabled={!otpCode.trim() || withdraw.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: !otpCode.trim() || withdraw.isPending ? 0.6 : 1 }}
          >
            {withdraw.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Confirm withdrawal</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStepUpCode(null); setStepUpError(null) }}>
            <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Status screen (shown after a successful submit, while resolving) ───
  if (result) {
    const s = statusQuery.data
    const stillWorking = !s || s.is_in_progress || s.is_unknown
    const headline = s?.is_completed
      ? 'Withdrawal complete'
      : s?.is_failed
        ? 'Withdrawal failed'
        : s?.is_unknown
          ? "Status unknown — your funds are safe"
          : result.kind === 'pending_approval'
            ? 'Awaiting SACCO approval'
            : 'Withdrawal initiated'

    const body = s?.is_completed
      ? `KES ${(s.net_amount ?? (result.kind === 'initiated' ? result.netAmountSent : 0)).toLocaleString()} has been sent to your M-Pesa number.`
      : s?.is_failed
        ? s.failure_reason || 'The withdrawal could not be completed. Your funds were not deducted.'
        : s?.is_unknown
          ? 'Safaricom took too long to confirm. Your funds remain reserved and this will resolve automatically — no need to retry.'
          : result.kind === 'pending_approval'
            ? result.detail
            : result.kind === 'duplicate'
              ? result.message
              : 'Awaiting M-Pesa confirmation...'

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          {stillWorking ? <ActivityIndicator color={c.accent} size="large" /> : null}
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{headline}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>{body}</Text>
          {!stillWorking ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Withdraw savings</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{membership?.sacco_name ?? slug}</Text>
      </View>

      {savingsQuery.isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : savings.length === 0 ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>No withdrawable savings account was found for this SACCO.</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          showsVerticalScrollIndicator={false}
        >
          {savings.length > 1 ? (
            <>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>From account</Text>
              <View style={{ gap: 8, marginBottom: 20 }}>
                {savings.map((s: any) => {
                  const on = (selectedSaving?.id ?? savings[0]?.id) === s.id
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSavingId(s.id)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : c.surface }}
                    >
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{s.savings_type}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>KES {Number(s.amount ?? 0).toLocaleString()}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          ) : null}

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={c.textFaint}
            style={{ color: c.text, fontSize: 34, fontWeight: '800', borderBottomWidth: 2, borderBottomColor: c.accent, paddingBottom: 10, marginBottom: 8 }}
          />
          <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 20 }}>Available: KES {available.toLocaleString()}</Text>

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>M-Pesa number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+2547..."
            placeholderTextColor={c.textFaint}
            style={{ color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface, marginBottom: 20 }}
          />

          {numericAmount >= 10 ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 20 }}>
              <FeeRow label="Withdrawal amount" value={`KES ${numericAmount.toLocaleString()}`} />
              <FeeRow label="Platform fee" value={`KES ${(fee ? Math.round(fee.platform_fee) : 0).toLocaleString()}`} />
              <FeeRow label="You receive" value={`KES ${youReceive.toLocaleString()}`} bold />
            </View>
          ) : null}

          <TouchableOpacity
            onPress={submit}
            disabled={withdraw.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: withdraw.isPending ? 0.6 : 1 }}
          >
            {withdraw.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Withdraw to M-Pesa</Text>}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  )
}

function FeeRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: bold ? c.success : c.text, fontSize: 12, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  )
}

import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePaymentStatus } from '../../hooks/usePayment'
import { DeepSpaceBackground } from '../DeepSpaceBackground'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeColors } from '../../theme/tokens'
import { hapticError } from '../../lib/haptics'

// Loose sanity check only - the backend normalizes and authoritatively
// validates the real format (any of 07XXXXXXXX / 01XXXXXXXX / +2547XXXXXXXX /
// 2547XXXXXXXX). This just catches "empty" or "obviously not a phone number"
// before spending an STK push attempt on it.
const looksLikePhoneNumber = (value: string) => /^\+?\d{9,13}$/.test(value.replace(/\s/g, ''))

interface PaymentProcessingScreenProps {
  checkoutRequestId: string | null
  amount: number
  saccoName: string
  purpose: 'SAVING_DEPOSIT' | 'LOAN_REPAYMENT'
  phoneNumber: string
  onPhoneNumberChange: (value: string) => void
  onConfirmStkPush: () => void
  onComplete: (success: boolean, transactionId?: string, errorMessage?: string) => void
  onCancel: () => void
}

export default function PaymentProcessingScreen({
  checkoutRequestId,
  amount,
  saccoName,
  purpose,
  phoneNumber,
  onPhoneNumberChange,
  onConfirmStkPush,
  onComplete,
  onCancel,
}: PaymentProcessingScreenProps) {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: status, isLoading } = usePaymentStatus(checkoutRequestId ?? '')
  const [pollCount, setPollCount] = useState(0)
  const [hasStartedPolling, setHasStartedPolling] = useState(false)

  // Start polling when checkoutRequestId is available
  useEffect(() => {
    if (checkoutRequestId && !hasStartedPolling) {
      setHasStartedPolling(true)
    }
  }, [checkoutRequestId, hasStartedPolling])

  useEffect(() => {
    if (status && !isLoading && hasStartedPolling) {
      if (status.is_success) {
        onComplete(true, checkoutRequestId ?? '')
      } else if (status.is_final) {
        const errorMsg = mapMpesaErrorCode(status.result_code ?? undefined, status.result_description)
        hapticError()
        onComplete(false, undefined, errorMsg)
      }
    }
  }, [status, isLoading, onComplete, checkoutRequestId, hasStartedPolling])

  // Stop polling after 30 attempts (2 minutes with 4-second intervals)
  useEffect(() => {
    if (!hasStartedPolling) return

    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= 30) {
          clearInterval(interval)
          hapticError()
          onComplete(false, undefined, 'M-Pesa request timed out. Please check your phone connection and try again.')
          return prev
        }
        return prev + 1
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [onComplete, hasStartedPolling])

  const purposeLabel = purpose === 'LOAN_REPAYMENT' ? 'Loan repayment' : 'Contribution'
  const platformFee = Math.round(amount * 0.02) // 2% platform fee
  const totalAmount = amount + platformFee

  const isConfirming = !hasStartedPolling

  return (
    <DeepSpaceBackground>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
      {/* M-Pesa icon */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#00a550',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>M</Text>
      </View>

      {/* Title */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 }}>
        {isConfirming ? 'Confirm M-Pesa payment' : 'Processing payment'}
      </Text>
      <Text style={{ fontSize: 13, color: c.textMuted, textAlign: 'center', marginBottom: 24 }}>
        {isConfirming
          ? 'Review the payment details below and confirm to send the STK push to your phone.'
          : 'Waiting for M-Pesa confirmation on your phone...'}
      </Text>

      {/* Payment details */}
      <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 14, padding: 16, width: '100%', marginBottom: 20 }}>
        <DetailRow label="SACCO" value={saccoName} c={c} />
        <DetailRow label="Type" value={purposeLabel} c={c} />
        <DetailRow label="Amount" value={`KES ${amount.toLocaleString()}`} c={c} />
        <DetailRow label="Platform fee (2%)" value={`KES ${platformFee}`} c={c} />
        {isConfirming ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 11, color: c.textMuted }}>M-Pesa number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={onPhoneNumberChange}
              keyboardType="phone-pad"
              placeholder="07XXXXXXXX"
              placeholderTextColor={c.textFaint}
              style={{ fontSize: 11, fontWeight: '600', color: c.text, textAlign: 'right', minWidth: 130 }}
            />
          </View>
        ) : (
          <DetailRow label="From" value={phoneNumber} c={c} />
        )}
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: c.border,
            marginTop: 8,
            paddingTop: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>Total</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.success }}>
            KES {totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View
        style={{
          backgroundColor: 'rgba(109, 40, 217, 0.06)',
          borderLeftWidth: 3,
          borderLeftColor: c.accent,
          borderRadius: 8,
          padding: 12,
          width: '100%',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 11, color: c.text, lineHeight: 16 }}>
          {isConfirming
            ? 'Double check the M-Pesa number above (edit it if you want the prompt sent elsewhere) — a push prompt will appear on it after you confirm.'
            : 'Check your phone for the M-Pesa prompt. Enter your PIN to complete the payment.'}
        </Text>
      </View>

      {/* Actions */}
      {isConfirming ? (
        <>
          <TouchableOpacity
            onPress={() => {
              if (!looksLikePhoneNumber(phoneNumber)) {
                hapticError()
                return
              }
              onConfirmStkPush()
            }}
            activeOpacity={0.8}
            disabled={!looksLikePhoneNumber(phoneNumber)}
            style={{
              backgroundColor: c.accent,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              width: '100%',
              marginBottom: 8,
              opacity: looksLikePhoneNumber(phoneNumber) ? 1 : 0.5,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Send M-Pesa prompt</Text>
          </TouchableOpacity>
          {!looksLikePhoneNumber(phoneNumber) && (
            <Text style={{ fontSize: 10, color: c.danger, marginBottom: 8, textAlign: 'center' }}>
              Enter a valid M-Pesa number to continue.
            </Text>
          )}
          <TouchableOpacity
            onPress={onCancel}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: c.textMuted, fontSize: 11 }}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Animated loader */}
          <View style={{ marginBottom: 16 }}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
          <Text style={{ fontSize: 12, color: c.textMuted }}>
            Polling payment status... ({pollCount}/30)
          </Text>
        </>
      )}
      </ScrollView>
    </DeepSpaceBackground>
  )
}

function DetailRow({ label, value, c }: { label: string; value: string; c: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 11, color: c.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '500', color: c.text }}>{value}</Text>
    </View>
  )
}

function mapMpesaErrorCode(code?: number | string, desc?: string): string {
  const codeStr = String(code ?? '')
  if (codeStr === '1032') return 'Transaction cancelled. You declined the M-Pesa PIN prompt on your phone.'
  if (codeStr === '1') return 'Insufficient M-Pesa balance. Please top up your M-Pesa line and try again.'
  if (codeStr === '2001' || codeStr === '1037') return 'M-Pesa PIN entry timeout or incorrect PIN entered.'
  if (codeStr === '1019' || codeStr === '1025') return 'M-Pesa system is currently busy or daily transaction limit exceeded.'
  if (desc && desc.trim().length > 0) return desc
  return 'The payment was not completed on your phone. Please try again.'
}

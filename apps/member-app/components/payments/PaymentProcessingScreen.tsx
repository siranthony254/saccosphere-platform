import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { usePaymentStatus } from '../../hooks/usePayment'

const BRAND_VIOLET = '#6D28D9'
const BRAND_MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_MUTED = '#6B7280'

interface PaymentProcessingScreenProps {
  checkoutRequestId: string | null
  amount: number
  saccoName: string
  purpose: 'SAVING_DEPOSIT' | 'LOAN_REPAYMENT'
  phoneNumber: string
  onConfirmStkPush: () => void
  onComplete: (success: boolean, transactionId?: string) => void
  onCancel: () => void
}

export default function PaymentProcessingScreen({
  checkoutRequestId,
  amount,
  saccoName,
  purpose,
  phoneNumber,
  onConfirmStkPush,
  onComplete,
  onCancel,
}: PaymentProcessingScreenProps) {
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
      if (status.status === 'completed' || status.status === 'success') {
        onComplete(true, checkoutRequestId ?? '')
      } else if (status.status === 'failed' || status.status === 'cancelled') {
        onComplete(false)
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
          onComplete(false)
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
    <View style={{ flex: 1, backgroundColor: SURFACE, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
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
      <Text style={{ fontSize: 18, fontWeight: '700', color: INK, marginBottom: 8 }}>
        {isConfirming ? 'Confirm M-Pesa payment' : 'Processing payment'}
      </Text>
      <Text style={{ fontSize: 13, color: INK_MUTED, textAlign: 'center', marginBottom: 24 }}>
        {isConfirming
          ? 'Review the payment details below and confirm to send the STK push to your phone.'
          : 'Waiting for M-Pesa confirmation on your phone...'}
      </Text>

      {/* Payment details */}
      <View style={{ backgroundColor: SURFACE2, borderRadius: 14, padding: 16, width: '100%', marginBottom: 20 }}>
        <DetailRow label="SACCO" value={saccoName} />
        <DetailRow label="Type" value={purposeLabel} />
        <DetailRow label="Amount" value={`KES ${amount.toLocaleString()}`} />
        <DetailRow label="Platform fee (2%)" value={`KES ${platformFee}`} />
        <DetailRow label="From" value={phoneNumber} />
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0,0,0,0.07)',
            marginTop: 8,
            paddingTop: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: INK }}>Total</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND_MINT }}>
            KES {totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View
        style={{
          backgroundColor: 'rgba(109, 40, 217, 0.06)',
          borderLeftWidth: 3,
          borderLeftColor: BRAND_VIOLET,
          borderRadius: 8,
          padding: 12,
          width: '100%',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 11, color: '#4C1D95', lineHeight: 16 }}>
          {isConfirming
            ? 'A push prompt will appear on your phone after confirmation. Enter your M-Pesa PIN to complete.'
            : 'Check your phone for the M-Pesa prompt. Enter your PIN to complete the payment.'}
        </Text>
      </View>

      {/* Actions */}
      {isConfirming ? (
        <>
          <TouchableOpacity
            onPress={() => {
              onConfirmStkPush()
            }}
            activeOpacity={0.8}
            style={{
              backgroundColor: BRAND_VIOLET,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              width: '100%',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Send M-Pesa prompt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancel}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <Text style={{ color: INK_MUTED, fontSize: 11 }}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Animated loader */}
          <View style={{ marginBottom: 16 }}>
            <ActivityIndicator size="large" color={BRAND_VIOLET} />
          </View>
          <Text style={{ fontSize: 12, color: INK_MUTED }}>
            Polling payment status... ({pollCount}/30)
          </Text>
        </>
      )}
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 11, color: INK_MUTED }}>{label}</Text>
      <Text style={{ fontSize: 11, fontWeight: '500', color: INK }}>{value}</Text>
    </View>
  )
}

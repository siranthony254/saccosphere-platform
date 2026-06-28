import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useLoans } from '../../../hooks/useLoans'
import { useInitiatePayment } from '../../../hooks/usePayment'
import { useMembershipBySacco } from '../../../hooks/useMembership'
import { useSaccoConfig } from '../../../hooks/useSaccoConfig'
import { useCurrentUser } from '../../../store/useAuthStore'
import PaymentMethodSelector from '../../payments/PaymentMethodSelector'
import PaymentSuccessScreen from '../../payments/PaymentSuccessScreen'
import PaymentProcessingScreen from '../../payments/PaymentProcessingScreen'

const VIOLET = '#6D28D9'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_MUTED = '#6B7280'
const BORDER = 'rgba(0,0,0,0.07)'

export default function PayScreen() {
  const { slug, type, loanId } = useLocalSearchParams<{ slug: string; type?: string; loanId?: string }>()
  const isRepayment = type === 'repayment'
  const { data: membership, isLoading: membershipLoading } = useMembershipBySacco(slug)
  const { data: config } = useSaccoConfig(slug)
  const { data: loans = [] } = useLoans({ sacco: slug })
  const savingsQuery = useQuery({
    queryKey: ['savings', slug, membership?.sacco_id],
    queryFn: () => api.savings.list({ sacco: membership?.sacco_id ?? slug, status: 'active' }),
    enabled: Boolean(membership?.sacco_id || slug),
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // Keep in cache for 5 minutes
  })
  const { mutate: initiatePayment, isPending } = useInitiatePayment()
  const user = useCurrentUser()
  const selectedLoan = useMemo(() => loans.find((loan) => loan.id === loanId) ?? null, [loanId, loans])
  const defaultAmount = isRepayment
    ? selectedLoan?.next_payment_amount ?? selectedLoan?.monthly_instalment ?? selectedLoan?.balance_remaining ?? 0
    : membership?.monthly_contribution ?? 0
  const [amount, setAmount] = useState(defaultAmount ? String(Math.round(defaultAmount)) : '')
  const [methodStep, setMethodStep] = useState<'amount' | 'method' | 'bank' | 'processing' | 'success'>('amount')
  const [receipt, setReceipt] = useState<{ checkout: string; transaction: string } | null>(null)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)

  const numericAmount = Number(String(amount || defaultAmount || 0).replace(/[^0-9.]/g, ''))
  const platformFee = Math.round(numericAmount * 0.02) // 2% platform fee from backend
  const saccoName = membership?.sacco_name ?? selectedLoan?.sacco_name ?? slug
  const phoneNumber = user?.phone_number ?? user?.phone ?? ''
  const primarySaving = savingsQuery.data?.[0]
  const acceptedMethods = config?.payments.accepted_methods ?? ['mpesa', 'bank_transfer']

  const title = isRepayment ? 'Pay loan' : 'Contribute'
  const subtitle = isRepayment
    ? `Pay ${selectedLoan?.loan_product_label ?? 'your loan'} at ${saccoName}`
    : `Add savings to ${saccoName}`

  const handleMpesa = () => {
    if (!membership?.sacco_id) {
      Alert.alert('SACCO loading', 'Please wait while we load your SACCO details.')
      return
    }
    if (!phoneNumber) {
      Alert.alert('Phone number missing', 'Add a phone number to your profile before paying with M-Pesa.')
      return
    }
    if (!numericAmount || numericAmount < 10) {
      Alert.alert('Enter amount', 'The amount must be at least KES 10.')
      return
    }
    if (isRepayment && !selectedLoan?.id) {
      router.replace('/(member)/loan-repayment')
      return
    }
    if (!isRepayment && !primarySaving?.id) {
      Alert.alert('Savings account unavailable', 'We could not find an active savings account for this SACCO.')
      return
    }
    setMethodStep('processing')
  }

  const confirmStkPush = () => {
    if (!membership?.sacco_id) return
    initiatePayment(
      {
        phone_number: phoneNumber,
        amount: numericAmount,
        purpose: isRepayment ? 'LOAN_REPAYMENT' : 'SAVING_DEPOSIT',
        sacco_id: membership.sacco_id,
        saving_id: isRepayment ? undefined : primarySaving?.id,
        loan_id: isRepayment ? selectedLoan?.id : undefined,
        instalment_number: isRepayment ? 1 : undefined,
      },
      {
        onSuccess: (response) => {
          setCheckoutRequestId(response.checkout_request_id)
          setReceipt({
            checkout: response.checkout_request_id,
            transaction: response.transaction_id ?? response.merchant_request_id ?? response.checkout_request_id,
          })
        },
        onError: (err) => Alert.alert('Payment failed', err.message),
      }
    )
  }

  const handlePaymentComplete = (success: boolean, transactionId?: string) => {
    if (success) {
      setMethodStep('success')
    } else {
      Alert.alert('Payment failed', 'The payment was not completed. Please try again.')
      setMethodStep('method')
      setCheckoutRequestId(null)
    }
  }

  const handleCancelPayment = () => {
    setMethodStep('method')
    setCheckoutRequestId(null)
  }

  if (membershipLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={VIOLET} />
        <Text style={{ color: INK_MUTED, fontSize: 12, marginTop: 10 }}>Loading payment details...</Text>
      </View>
    )
  }

  if (methodStep === 'success' && receipt) {
    return (
      <PaymentSuccessScreen
        amount={numericAmount}
        saccoName={saccoName}
        purpose={isRepayment ? 'LOAN_REPAYMENT' : 'SAVING_DEPOSIT'}
        mpesaRef={receipt.checkout}
        saccosphereRef={receipt.transaction}
        onBackToDashboard={() => router.replace('/(member)')}
        onViewReceipt={() => router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })}
      />
    )
  }

  if (methodStep === 'method') {
    return (
      <PaymentMethodSelector
        title={title}
        subtitle={subtitle}
        saccoName={saccoName}
        amount={String(numericAmount)}
        mpesaFee={platformFee}
        bankFee={0}
        onSelectMpesa={handleMpesa}
        onSelectBank={() => setMethodStep('bank')}
        onCancel={() => setMethodStep('amount')}
      />
    )
  }

  if (methodStep === 'processing') {
    return (
      <PaymentProcessingScreen
        checkoutRequestId={checkoutRequestId}
        amount={numericAmount}
        saccoName={saccoName}
        purpose={isRepayment ? 'LOAN_REPAYMENT' : 'SAVING_DEPOSIT'}
        phoneNumber={phoneNumber}
        onConfirmStkPush={confirmStkPush}
        onComplete={handlePaymentComplete}
        onCancel={handleCancelPayment}
      />
    )
  }

  if (methodStep === 'bank') {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE2, padding: 18 }}>
        <Text style={{ color: INK, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>Bank transfer</Text>
        <Text style={{ color: INK_MUTED, fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
          Use your SACCO bank instructions to complete this payment. The app will reflect the payment after the SACCO posts it.
        </Text>
        <View style={{ backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 16 }}>
          <BankRow label="SACCO" value={saccoName} />
          <BankRow label="Payment type" value={isRepayment ? 'Loan repayment' : 'Contribution'} />
          <BankRow label="Amount" value={`KES ${numericAmount.toLocaleString()}`} />
          {isRepayment && selectedLoan ? <BankRow label="Loan" value={selectedLoan.ref} /> : null}
        </View>
        <TouchableOpacity style={{ backgroundColor: VIOLET, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }} onPress={() => setMethodStep('method')}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Choose another method</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, padding: 20 }}>
      <Text style={{ color: INK, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: INK_MUTED, fontSize: 12, marginBottom: 24 }}>{subtitle}</Text>
      <Text style={{ color: INK_MUTED, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Amount (KES)</Text>
      <TextInput
        style={{ color: INK, fontSize: 36, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: VIOLET, paddingBottom: 8, marginBottom: 18 }}
        value={amount}
        onChangeText={setAmount}
        placeholder={defaultAmount ? String(Math.round(defaultAmount)) : '0'}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
      />
      <View style={{ backgroundColor: SURFACE2, borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <BankRow label="SACCO" value={saccoName} />
        <BankRow label="Payment type" value={isRepayment ? 'Loan repayment' : 'Contribution'} />
        <BankRow label="Accepted methods" value={acceptedMethods.map(m => m === 'mpesa' ? 'M-Pesa' : m === 'bank_transfer' ? 'Bank' : m).join(', ')} />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: VIOLET, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: numericAmount ? 1 : 0.5 }}
        disabled={!numericAmount}
        onPress={() => setMethodStep('method')}
      >
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER }}>
      <Text style={{ color: INK_MUTED, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: INK, fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

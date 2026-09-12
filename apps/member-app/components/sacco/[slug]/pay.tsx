import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useLoans } from '../../../hooks/useLoans'
import { useInitiatePayment, useFeePreview } from '../../../hooks/usePayment'
import { useMembershipBySacco } from '../../../hooks/useMembership'
import { useSaccoConfig } from '../../../hooks/useSaccoConfig'
import { useCurrentUser } from '../../../store/useAuthStore'
import PaymentMethodSelector from '../../payments/PaymentMethodSelector'
import PaymentSuccessScreen from '../../payments/PaymentSuccessScreen'
import PaymentProcessingScreen from '../../payments/PaymentProcessingScreen'
import { DeepSpaceBackground } from '../../DeepSpaceBackground'
import { useTheme } from '../../../theme/ThemeProvider'


export default function PayScreen() {
  const { colors: c } = useTheme()
  const { slug, type, loanId, step } = useLocalSearchParams<{ slug: string; type?: string; loanId?: string; step?: string }>()
  const insets = useSafeAreaInsets()
  const isRepayment = type === 'repayment'
  const { data: membership, isLoading: membershipLoading } = useMembershipBySacco(slug)
  const { data: config } = useSaccoConfig(slug)
  const { data: loans = [] } = useLoans({ sacco: slug })
  const savingsQuery = useQuery({
    queryKey: ['savings', slug, membership?.sacco_id],
    queryFn: () => api.savings.list({ sacco: membership?.sacco_id ?? slug, status: 'active' }),
    enabled: Boolean(membership?.sacco_id || slug),
    staleTime: 60_000,
    gcTime: 300_000,
  })
  const { mutate: initiatePayment, isPending } = useInitiatePayment()
  const user = useCurrentUser()
  const selectedLoan = useMemo(() => loans.find((loan) => loan.id === loanId) ?? null, [loanId, loans])
  const defaultAmount = isRepayment
    ? selectedLoan?.next_payment_amount ?? selectedLoan?.monthly_instalment ?? selectedLoan?.balance_remaining ?? 0
    : membership?.monthly_contribution ?? 0
  const [amount, setAmount] = useState(defaultAmount ? String(Math.round(defaultAmount)) : '')
  const [methodStep, setMethodStep] = useState<'amount' | 'method' | 'bank' | 'processing' | 'success'>(
    step === 'method' ? 'method' : 'amount'
  )
  const [receipt, setReceipt] = useState<{ checkout: string; transaction: string } | null>(null)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)

  const numericAmount = Number(String(amount || defaultAmount || 0).replace(/[^0-9.]/g, ''))
  const { data: feePreview } = useFeePreview({ type: isRepayment ? 'repayment' : 'deposit', amount: numericAmount })
  const platformFee = feePreview ? Math.round(feePreview.platform_fee) : Math.round(numericAmount * 0.02)
  const grossCharge = feePreview ? Math.round(feePreview.gross_amount) : numericAmount + platformFee
  const saccoName = membership?.sacco_name ?? selectedLoan?.sacco_name ?? slug
  const phoneNumber = user?.phone_number ?? user?.phone ?? ''
  const primarySaving = savingsQuery.data?.[0]
  const acceptedMethods = config?.payments?.accepted_methods ?? ['mpesa', 'bank_transfer']
  const acceptsMpesa = acceptedMethods.some(m => String(m).toLowerCase() === 'mpesa')
  const acceptsBank = acceptedMethods.some(m => String(m).toLowerCase() === 'bank_transfer')

  const title = isRepayment ? 'Pay loan' : 'Contribute'
  const subtitle = isRepayment
    ? `Pay ${selectedLoan?.loan_product_label ?? 'your loan'} at ${saccoName}`
    : `Add savings to ${saccoName}`

  const handleMpesa = () => {
    if (!acceptsMpesa) {
      Alert.alert('M-Pesa unavailable', `${saccoName} is not accepting M-Pesa payments right now.`)
      return
    }
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

  const handlePaymentComplete = (success: boolean, _txnId?: string, errorMessage?: string) => {
    if (success) {
      setMethodStep('success')
    } else {
      Alert.alert('Payment Cancelled / Failed', errorMessage ?? 'The payment was not completed. Please try again.')
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
      <DeepSpaceBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 10 }}>Loading payment details...</Text>
        </View>
      </DeepSpaceBackground>
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
        mpesaDisabled={!acceptsMpesa}
        bankDisabled={!acceptsBank}
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
      <DeepSpaceBackground>
        <View style={{ flex: 1, padding: 20, paddingTop: insets.top }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '700', marginBottom: 6 }}>Bank transfer</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 24 }}>
            Use your SACCO bank instructions to complete this payment. The app will reflect the payment after the SACCO posts it.
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 24 }}>
            <BankRow label="SACCO" value={saccoName} />
            <BankRow label="Payment type" value={isRepayment ? 'Loan repayment' : 'Contribution'} />
            <BankRow label="Amount" value={`KES ${numericAmount.toLocaleString()}`} />
            {isRepayment && selectedLoan ? <BankRow label="Loan Reference" value={selectedLoan.ref} /> : null}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: c.accent, borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            onPress={() => setMethodStep('method')}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Back to methods</Text>
          </TouchableOpacity>
        </View>
      </DeepSpaceBackground>
    )
  }

  return (
    <DeepSpaceBackground>
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: insets.top, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="mr-3">
            <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold" style={{ color: c.text }}>{title}</Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textFaint }}>{subtitle}</Text>
          </View>
        </View>

        <Text className="text-[10px] font-bold uppercase mb-3 ml-1" style={{ color: c.textMuted }}>Enter Amount (KES)</Text>
        <TextInput
          style={{ color: c.text, fontSize: 42, fontWeight: '800', borderBottomWidth: 2, borderBottomColor: c.accent, paddingBottom: 12, marginBottom: 32 }}
          value={amount}
          onChangeText={setAmount}
          placeholder={defaultAmount ? String(Math.round(defaultAmount)) : '0'}
          placeholderTextColor={c.textFaint}
          keyboardType="number-pad"
        />

        <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: c.border }}>
          <BankRow label="SACCO" value={saccoName} />
          <BankRow label="Purpose" value={isRepayment ? 'Loan Repayment' : 'Saving Contribution'} />
          <BankRow label="Accepted Methods" value={acceptedMethods.map(m => m === 'mpesa' ? 'M-Pesa' : m === 'bank_transfer' ? 'Bank' : m).join(', ')} />
          {numericAmount >= 10 ? (
            <>
              <BankRow label="Platform fee" value={`KES ${platformFee.toLocaleString()}`} />
              <BankRow label="You pay" value={`KES ${grossCharge.toLocaleString()}`} />
              <BankRow label={isRepayment ? 'Applied to loan' : 'Credited to savings'} value={`KES ${numericAmount.toLocaleString()}`} />
            </>
          ) : null}
        </View>

        <TouchableOpacity
          style={{ backgroundColor: c.accent, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: numericAmount ? 1 : 0.5 }}
          disabled={!numericAmount}
          onPress={() => setMethodStep('method')}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>CONTINUE TO PAYMENT →</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </DeepSpaceBackground>
  )
}

function BankRow({ label, value }: { label: string; value: string }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  )
}


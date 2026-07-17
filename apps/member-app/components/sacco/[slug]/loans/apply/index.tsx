import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useMembershipBySacco } from '../../../../../hooks/useMembership'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useSubmitLoanApplication } from '../../../../../hooks/useLoanApplication'
import { useCurrentUser } from '../../../../../store/useAuthStore'
import { useLoanEligibility } from '../../../../../hooks/useLoans'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'

export default function LoanStep1() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { data: config } = useSaccoConfig(slug)
  const { data: membership } = useMembershipBySacco(slug)
  const { setContext, setStep1, setLoanId, step1 } = useLoanApplicationStore()
  const { mutate: applyLoan, isPending } = useSubmitLoanApplication()
  const user = useCurrentUser()
  const phoneNumber = user?.phone_number ?? user?.phone ?? ''
  const { data: eligibility } = useLoanEligibility(membership?.sacco_id ?? '')

  const [productKey, setProductKey] = useState(step1?.loan_product_key ?? '')
  const [amount, setAmount] = useState(step1?.amount_requested?.toString() ?? '100000')
  const [months, setMonths] = useState(step1?.period_months?.toString() ?? '24')
  const [purpose, setPurpose] = useState(step1?.purpose ?? '')
  const [disburse, setDisburse] = useState<'mpesa' | 'fosa' | 'bank'>(step1?.disbursement_method ?? 'mpesa')

  // Initialize product key when config loads
  useEffect(() => {
    if (config && config.loan_products && config.loan_products.length > 0 && !productKey) {
      setProductKey(config.loan_products[0].key)
    }
  }, [config, productKey])

  const selectedProduct = config?.loan_products.find(p => p.key === productKey) ?? config?.loan_products?.[0]
  console.log('Config state:', { config, loanProducts: config?.loan_products, productKey, selectedProduct })
  // Use real-time eligibility data for max amount
  const maxAmount = eligibility?.max_amount ?? 0
  const monthlyRate = (selectedProduct?.interest_rate_pct ?? 12) / 100 / 12
  const n = parseInt(months)
  const instalment = monthlyRate > 0
    ? (parseFloat(amount) * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : parseFloat(amount) / n

  const handleNext = () => {
    console.log('handleNext called', { membership, selectedProduct, purpose, amount, months, eligibility })
    if (!membership) {
      console.log('No membership')
      return
    }
    if (!selectedProduct?.key) {
      console.log('No selected product')
      Alert.alert('Error', 'Please select a loan product')
      return
    }
    // Check eligibility
    if (!eligibility?.eligible) {
      const reason = eligibility?.reason ?? 'You are not eligible for a loan at this time'
      Alert.alert('Not Eligible', reason)
      return
    }
    if (eligibility?.max_amount === 0) {
      Alert.alert('No Loan Limit', 'Your current loan limit is KES 0. Please build your savings to increase your limit.')
      return
    }
    const requestedAmount = parseFloat(amount)
    if (requestedAmount > eligibility.max_amount) {
      Alert.alert('Amount Exceeds Limit', `Your maximum loan limit is KES ${eligibility.max_amount.toLocaleString()}. Please reduce your loan amount.`)
      return
    }
    const step1Data = {
      loan_product_key: selectedProduct.key,
      amount_requested: requestedAmount,
      period_months: n,
      purpose,
      disbursement_method: disburse,
      disbursement_account: phoneNumber,
    }
    console.log('Submitting loan application:', step1Data)
    setContext(membership.id, slug)
    setStep1(step1Data)

    applyLoan(
      { membership_id: membership.id, ...step1Data, guarantor_membership_ids: [] },
      {
        onSuccess: (loan) => {
          console.log('Loan application successful:', loan)
          setLoanId(loan.id)
          router.push({ pathname: '/sacco/[slug]/loans/apply/external-guarantors', params: { slug } })
        },

        onError: (err) => {
          console.error('Loan application error:', err)
          Alert.alert('Error', err.message)
        },
      }
    )
  }

  if (!config) return (
    <DeepSpaceBackground>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#6D28D9" />
        <Text className="text-white/40 text-xs mt-3">Loading loan products...</Text>
      </View>
    </DeepSpaceBackground>
  )

  // Check eligibility and show error if not eligible or limit is zero
  if (eligibility && !eligibility.eligible) {
    return (
      <DeepSpaceBackground>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
        >
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-white/60 text-lg">←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">Apply for loan</Text>
            </View>
          </View>

          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 items-center">
            <Text className="text-red-400 text-2xl mb-3">⚠️</Text>
            <Text className="text-white text-lg font-bold mb-2">Not Eligible</Text>
            <Text className="text-white/60 text-sm text-center">{eligibility.reason ?? 'You are not eligible for a loan at this time'}</Text>
          </View>
        </ScrollView>
      </DeepSpaceBackground>
    )
  }

  if (eligibility && eligibility.max_amount === 0) {
    return (
      <DeepSpaceBackground>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
        >
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-white/60 text-lg">←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">Apply for loan</Text>
            </View>
          </View>

          <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 items-center">
            <Text className="text-yellow-400 text-2xl mb-3">💰</Text>
            <Text className="text-white text-lg font-bold mb-2">No Loan Limit</Text>
            <Text className="text-white/60 text-sm text-center">Your current loan limit is KES 0. Please build your savings to increase your limit.</Text>
          </View>
        </ScrollView>
      </DeepSpaceBackground>
    )
  }

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-white/60 text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-bold">Apply for loan</Text>
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Step 1 of 2 - Loan details</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-white/10" />
          <View className="flex-1 h-1 rounded-full bg-white/10" />
        </View>

        {/* Loan product selector */}
        <Text className="text-white/60 text-[10px] font-bold uppercase mb-3 ml-1">Loan type</Text>
        <View className="gap-2 mb-6">
          {config.loan_products.map(p => (
            <TouchableOpacity
              key={p.key}
              className={`flex-row justify-between p-4 border rounded-2xl ${(selectedProduct?.key === p.key) ? 'border-violet-500 bg-violet-500/10' : 'bg-white/5 border-white/10'}`}
              onPress={() => setProductKey(p.key)}
            >
              <Text className={`text-xs font-bold ${(selectedProduct?.key === p.key) ? 'text-white' : 'text-white/60'}`}>{p.label}</Text>
              <Text className="text-white/40 text-[10px] font-bold">{p.interest_rate_pct}% p.a.</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Loan amount (KES)</Text>
        <TextInput
          className="border border-white/10 rounded-2xl p-4 text-base text-white bg-white/5 mb-1.5"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        <Text className="text-white/30 text-[10px] font-medium mb-6 ml-1">Your limit: KES {maxAmount.toLocaleString()}</Text>

        {/* Period */}
        <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Repayment period</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {[6, 12, 24, 36, 48].filter(m => m >= (selectedProduct?.min_months ?? 6) && m <= (selectedProduct?.max_months ?? 48)).map(m => (
            <TouchableOpacity
              key={m}
              className={`px-5 py-2.5 rounded-xl border ${months === m.toString() ? 'bg-violet-500 border-violet-500' : 'bg-white/5 border-white/10'}`}
              onPress={() => setMonths(m.toString())}
            >
              <Text className={`text-xs font-bold ${months === m.toString() ? 'text-white' : 'text-white/40'}`}>{m} mo</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purpose */}
        <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Purpose of loan</Text>
        <TextInput
          className="border border-white/10 rounded-2xl p-4 text-base text-white bg-white/5 mb-6"
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Home renovation"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />

        {/* Disbursement */}
        <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Disbursement to</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {(selectedProduct?.disbursement_options ?? []).map(opt => (
            <TouchableOpacity
              key={opt}
              className={`px-5 py-2.5 rounded-xl border ${disburse === opt ? 'bg-violet-500 border-violet-500' : 'bg-white/5 border-white/10'}`}
              onPress={() => setDisburse(opt)}
            >
              <Text className={`text-xs font-bold ${disburse === opt ? 'text-white' : 'text-white/40'}`}>
                {opt === 'mpesa' ? 'M-Pesa' : opt === 'fosa' ? 'FOSA' : 'Bank'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          {[
            { label: 'Principal', value: `KES ${parseFloat(amount || '0').toLocaleString()}` },
            { label: `Interest (${selectedProduct?.interest_rate_pct ?? 12}% p.a.)`, value: `KES ${(instalment * n - parseFloat(amount || '0')).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
            { label: 'Monthly instalment', value: `KES ${instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, highlight: true },
            { label: 'Total repayable', value: `KES ${(instalment * n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
          ].map((row, i, arr) => (
            <View key={row.label} className={`flex-row justify-between py-2.5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className={`text-xs font-bold ${row.highlight ? 'text-mint-400' : 'text-white'}`}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className={`bg-violet-600 rounded-2xl p-4 items-center ${(!purpose || isPending) ? 'opacity-50' : ''}`}
          onPress={handleNext}
          disabled={!purpose || isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-sm font-bold uppercase tracking-wider">Continue →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}


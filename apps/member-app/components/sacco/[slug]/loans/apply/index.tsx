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
import { Icon } from '../../../../ui/Icon'
import { useTheme } from '../../../../../theme/ThemeProvider'

export default function LoanStep1() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
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


  // Initialize product key when config loads
  useEffect(() => {
    if (config && config.loan_products && config.loan_products.length > 0 && !productKey) {
      setProductKey(config.loan_products[0].key)
    }
  }, [config, productKey])

  const selectedProduct = config?.loan_products.find(p => p.key === productKey) ?? config?.loan_products?.[0]
  // Use real-time eligibility data for max amount
  const maxAmount = eligibility?.max_amount ?? 0
  const monthlyRate = (selectedProduct?.interest_rate_pct ?? 12) / 100 / 12
  const n = parseInt(months)
  const instalment = monthlyRate > 0
    ? (parseFloat(amount) * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : parseFloat(amount) / n

  const handleNext = () => {
    if (!membership) {
      return
    }
    if (!selectedProduct?.key) {
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
    }
    setContext(membership.id, slug)
    setStep1(step1Data as any)

    applyLoan(
      { membership_id: membership.id, ...step1Data },
      {
        onSuccess: (loan) => {
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
        <Text className="text-xs mt-3" style={{ color: c.textFaint }}>Loading loan products...</Text>
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
              <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold" style={{ color: c.text }}>Apply for loan</Text>
            </View>
          </View>

          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 items-center">
            <Icon name="warning" size={24} color="#f87171" style={{ marginBottom: 12 }} />
            <Text className="text-lg font-bold mb-2" style={{ color: c.text }}>Not Eligible</Text>
            <Text className="text-sm text-center" style={{ color: c.textMuted }}>{eligibility.reason ?? 'You are not eligible for a loan at this time'}</Text>
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
              <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold" style={{ color: c.text }}>Apply for loan</Text>
            </View>
          </View>

          <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 items-center">
            <Icon name="cash" size={24} color="#facc15" style={{ marginBottom: 12 }} />
            <Text className="text-lg font-bold mb-2" style={{ color: c.text }}>No Loan Limit</Text>
            <Text className="text-sm text-center" style={{ color: c.textMuted }}>Your current loan limit is KES 0. Please build your savings to increase your limit.</Text>
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
            <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold" style={{ color: c.text }}>Apply for loan</Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textFaint }}>Step 1 of 2 - Loan details</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full" style={{ backgroundColor: c.border }} />
          <View className="flex-1 h-1 rounded-full" style={{ backgroundColor: c.border }} />
        </View>

        {/* Loan product selector */}
        <Text className="text-[10px] font-bold uppercase mb-3 ml-1" style={{ color: c.textMuted }}>Loan type</Text>
        <View className="gap-2 mb-6">
          {config.loan_products.map(p => {
            const selected = selectedProduct?.key === p.key
            return (
              <TouchableOpacity
                key={p.key}
                className={`flex-row justify-between p-4 border rounded-2xl ${selected ? 'border-violet-500 bg-violet-500/10' : ''}`}
                style={!selected ? { backgroundColor: c.surface, borderColor: c.border } : undefined}
                onPress={() => setProductKey(p.key)}
              >
                <Text className="text-xs font-bold" style={{ color: selected ? c.text : c.textMuted }}>{p.label}</Text>
                <Text className="text-[10px] font-bold" style={{ color: c.textFaint }}>{p.interest_rate_pct}% p.a.</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Amount */}
        <Text className="text-[10px] font-bold uppercase mb-2 ml-1" style={{ color: c.textMuted }}>Loan amount (KES)</Text>
        <TextInput
          className="border rounded-2xl p-4 text-base mb-1.5"
          style={{ borderColor: c.border, backgroundColor: c.surface, color: c.text }}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholderTextColor={c.textFaint}
        />
        <Text className="text-[10px] font-medium mb-6 ml-1" style={{ color: c.textFaint }}>Your limit: KES {maxAmount.toLocaleString()}</Text>

        {/* Period */}
        <Text className="text-[10px] font-bold uppercase mb-2 ml-1" style={{ color: c.textMuted }}>Repayment period</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {[6, 12, 24, 36, 48].filter(m => m >= (selectedProduct?.min_months ?? 6) && m <= (selectedProduct?.max_months ?? 48)).map(m => {
            const selected = months === m.toString()
            return (
              <TouchableOpacity
                key={m}
                className={`px-5 py-2.5 rounded-xl border ${selected ? 'bg-violet-500 border-violet-500' : ''}`}
                style={!selected ? { backgroundColor: c.surface, borderColor: c.border } : undefined}
                onPress={() => setMonths(m.toString())}
              >
                <Text className="text-xs font-bold" style={{ color: selected ? '#FFFFFF' : c.textFaint }}>{m} mo</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Purpose */}
        <Text className="text-[10px] font-bold uppercase mb-2 ml-1" style={{ color: c.textMuted }}>Purpose of loan</Text>
        <TextInput
          className="border rounded-2xl p-4 text-base mb-6"
          style={{ borderColor: c.border, backgroundColor: c.surface, color: c.text }}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Home renovation"
          placeholderTextColor={c.textFaint}
        />



        {/* Summary */}
        <View className="border rounded-2xl p-4 mb-8" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          {[
            { label: 'Principal', value: `KES ${parseFloat(amount || '0').toLocaleString()}` },
            { label: `Interest (${selectedProduct?.interest_rate_pct ?? 12}% p.a.)`, value: `KES ${(instalment * n - parseFloat(amount || '0')).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
            { label: 'Monthly instalment', value: `KES ${instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, highlight: true },
            { label: 'Total repayable', value: `KES ${(instalment * n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2.5"
              style={i !== arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : undefined}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className={`text-xs font-bold ${row.highlight ? 'text-mint-400' : ''}`} style={!row.highlight ? { color: c.text } : undefined}>{row.value}</Text>
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


import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useMembershipBySacco } from '../../../../../hooks/useMembership'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useCurrentUser } from '../../../../../store/useAuthStore'

export default function LoanStep1() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: config } = useSaccoConfig(slug)
  const { data: membership } = useMembershipBySacco(slug)
  const { setContext, setStep1, step1 } = useLoanApplicationStore()
  const user = useCurrentUser()
  const phoneNumber = user?.phone_number ?? user?.phone ?? ''

  const [productKey, setProductKey] = useState(step1?.loan_product_key ?? '')
  const [amount, setAmount] = useState(step1?.amount_requested?.toString() ?? '100000')
  const [months, setMonths] = useState(step1?.period_months?.toString() ?? '24')
  const [purpose, setPurpose] = useState(step1?.purpose ?? '')
  const [disburse, setDisburse] = useState<'mpesa' | 'fosa' | 'bank'>(step1?.disbursement_method ?? 'mpesa')

  const selectedProduct = config?.loan_products.find(p => p.key === productKey) ?? config?.loan_products[0]
  const maxAmount = membership ? membership.bosa_balance * (selectedProduct?.max_multiplier ?? 3) : 0
  const monthlyRate = (selectedProduct?.interest_rate_pct ?? 12) / 100 / 12
  const n = parseInt(months)
  const instalment = monthlyRate > 0
    ? (parseFloat(amount) * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : parseFloat(amount) / n

  const handleNext = () => {
    if (!membership) return
    setContext(membership.id, slug)
    setStep1({
      loan_product_key: selectedProduct?.key ?? '',
      amount_requested: parseFloat(amount),
      period_months: n,
      purpose,
      disbursement_method: disburse,
      disbursement_account: phoneNumber,
    })
    router.push({ pathname: '/sacco/[slug]/loans/apply/review', params: { slug } })
  }

  if (!config) return <View className="flex-1 bg-surface"><Text className="px-8 py-8 text-center text-ink-muted text-xs">Loading loan products...</Text></View>

  return (
    <ScrollView className="bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row gap-1 mb-1.5"><View className="flex-1 h-0.75 rounded bg-violet-500" /><View className="flex-1 h-0.75 rounded bg-border" /><View className="flex-1 h-0.75 rounded bg-border" /></View>
      <Text className="text-ink-faint text-xs mb-5">Step 1 of 2 - Loan details</Text>

      {/* Loan product selector — rendered from SACCO config */}
      <Text className="text-ink-soft text-xs font-medium mb-2 mt-3.5">Loan type</Text>
      <View className="gap-2 mb-1">
        {config.loan_products.map(p => (
          <TouchableOpacity
            key={p.key}
            className={`flex-row justify-between p-3 border rounded-xl ${(selectedProduct?.key === p.key) ? 'border-violet-500 bg-mint-50' : 'bg-surface border-border'}`}
            onPress={() => setProductKey(p.key)}
          >
            <Text className={`text-xs font-medium text-ink-soft ${(selectedProduct?.key === p.key) ? 'text-violet-500' : ''}`}>{p.label}</Text>
            <Text className="text-ink-faint text-xs">{p.interest_rate_pct}% p.a.</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount */}
      <Text className="text-ink-soft text-xs font-medium mb-2 mt-3.5">Loan amount (KES)</Text>
      <TextInput className="border border-border rounded-xl p-3 text-base text-ink mb-1" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
      <Text className="text-ink-faint text-xs mb-1">Your limit: KES {maxAmount.toLocaleString()}</Text>

      {/* Period */}
      <Text className="text-ink-soft text-xs font-medium mb-2 mt-3.5">Repayment period</Text>
      <View className="flex-row flex-wrap gap-2 mb-1">
        {[6, 12, 24, 36, 48].filter(m => m >= (selectedProduct?.min_months ?? 6) && m <= (selectedProduct?.max_months ?? 48)).map(m => (
          <TouchableOpacity key={m} className={`px-3.5 py-1.5 rounded-full border ${months === m.toString() ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`} onPress={() => setMonths(m.toString())}>
            <Text className={`text-xs font-medium ${months === m.toString() ? 'text-white' : 'text-ink-muted'}`}>{m} mo</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purpose */}
      <Text className="text-ink-soft text-xs font-medium mb-2 mt-3.5">Purpose of loan</Text>
      <TextInput className="border border-border rounded-xl p-3 text-base text-ink mb-1" value={purpose} onChangeText={setPurpose} placeholder="e.g. Home renovation" placeholderTextColor="#9CA3AF" />

      {/* Disbursement */}
      <Text className="text-ink-soft text-xs font-medium mb-2 mt-3.5">Disbursement to</Text>
      <View className="flex-row flex-wrap gap-2 mb-1">
        {(selectedProduct?.disbursement_options ?? []).map(opt => (
          <TouchableOpacity key={opt} className={`px-3.5 py-1.5 rounded-full border ${disburse === opt ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`} onPress={() => setDisburse(opt)}>
            <Text className={`text-xs font-medium ${disburse === opt ? 'text-white' : 'text-ink-muted'}`}>{opt === 'mpesa' ? 'M-Pesa' : opt === 'fosa' ? 'FOSA' : 'Bank'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View className="bg-surface2 rounded-xl p-3.5 mt-5 mb-5">
        {[
          { label: 'Principal', value: `KES ${parseFloat(amount || '0').toLocaleString()}` },
          { label: `Interest (${selectedProduct?.interest_rate_pct ?? 12}% p.a.)`, value: `KES ${(instalment * n - parseFloat(amount || '0')).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
          { label: 'Monthly instalment', value: `KES ${instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, highlight: true },
          { label: 'Total repayable', value: `KES ${(instalment * n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
        ].map(row => (
          <View key={row.label} className="flex-row justify-between py-1.5 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className={`text-xs font-semibold text-ink ${row.highlight ? 'text-mint-500' : ''}`}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity className={`bg-violet-500 rounded-xl p-3.5 items-center ${!purpose ? 'opacity-50' : ''}`} onPress={handleNext} disabled={!purpose}>
        <Text className="text-white text-xs font-semibold">Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

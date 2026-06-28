
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useSubmitLoanApplication } from '../../../../../hooks/useLoanApplication'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'

export default function LoanReview() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { step1, getFullInput, reset } = useLoanApplicationStore()
  const { mutate: submit, isPending } = useSubmitLoanApplication()
  const { data: config } = useSaccoConfig(slug)
  const [submitted, setSubmitted] = useState(false)
  const [loanRef, setLoanRef] = useState('')

  if (!step1) { router.back(); return null }

  const selectedProduct = config?.loan_products.find(p => p.key === step1.loan_product_key)
  const interestRate = selectedProduct?.interest_rate_pct ?? 12
  const monthlyRate = interestRate / 100 / 12
  const n = step1.period_months
  const instalment = monthlyRate > 0
    ? (step1.amount_requested * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : step1.amount_requested / n
  const processingFee = selectedProduct?.processing_fee_pct ?? 0
  const processingFeeAmount = (step1.amount_requested * processingFee) / 100

  const handleSubmit = () => {
    const input = getFullInput()
    if (!input) return
    submit(input, {
      onSuccess: (loan) => {
        setLoanRef(loan.ref)
        setSubmitted(true)
        reset()
      },
      onError: (err) => Alert.alert('Submission failed', err.message),
    })
  }

  if (submitted) return (
    <View className="flex-1 bg-surface px-6 items-center justify-center">
      <Text className="text-6xl mb-4">✅</Text>
      <Text className="text-ink text-xl font-bold mb-2">Application submitted</Text>
      <Text className="text-ink-muted text-xs text-center leading-5 mb-5">Your application is with the SACCO. Guarantors have been notified.</Text>
      <View className="bg-surface2 rounded-xl p-3 mb-5"><Text className="text-ink-soft text-xs font-bold text-center tracking-wider">{loanRef}</Text></View>
      <View className="bg-surface2 rounded-xl p-3.5 w-full mb-6">
        {[
          { label: 'Status', value: 'Under review' },
          { label: 'Expected decision', value: '3–5 business days' },
          { label: 'Disbursement', value: step1.disbursement_method === 'mpesa' ? 'M-Pesa' : step1.disbursement_method },
        ].map(row => (
          <View key={row.label} className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">{row.value}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity className="bg-violet-500 rounded-xl p-3.5 items-center" onPress={() => router.replace({ pathname: '/sacco/[slug]/loans/apply/success', params: { slug, ref: loanRef } })}>
        <Text className="text-white text-xs font-semibold">View confirmation</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView className="bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-400" />
      </View>
      <Text className="text-ink-faint text-xs mb-4">Step 2 of 2 - Review & confirm</Text>

      <View className="bg-surface2 rounded-xl p-3.5 mb-3">
        <Text className="text-ink text-xs font-semibold mb-2.5">Loan summary</Text>
        {[  
          { label: 'Loan type', value: selectedProduct?.label ?? step1.loan_product_key },
          { label: 'Amount', value: `KES ${step1.amount_requested.toLocaleString()}` },
          { label: 'Period', value: `${step1.period_months} months` },
          { label: `Interest rate`, value: `${interestRate}% p.a.` },
          { label: 'Monthly payment', value: `KES ${instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, highlight: true },
          { label: 'Total repayable', value: `KES ${(instalment * n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
          { label: 'Processing fee', value: processingFee > 0 ? `KES ${processingFeeAmount.toLocaleString('en-KE', { maximumFractionDigits: 0 })} (${processingFee}%)` : 'Waived' },
          { label: 'Disbursement to', value: step1.disbursement_method === 'mpesa' ? '📱 M-Pesa' : step1.disbursement_method },
        ].map(row => (
          <View key={row.label} className="flex-row justify-between items-center py-2 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className={`text-xs font-semibold text-ink ${row.highlight ? 'text-mint-500' : ''}`}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View className="bg-surface2 rounded-xl p-3.5 mb-3">
        <Text className="text-ink text-xs font-semibold mb-2.5">Guarantors</Text>
        <Text className="text-ink-muted text-xs leading-5">
          Guarantor requests are sent after the loan has been created because the backend guarantor endpoints are scoped to a loan id.
        </Text>
      </View>

      <View className="bg-amber-50 rounded-xl p-3 mb-5">
        <Text className="text-amber-700 text-xs leading-4.5">By submitting you authorise the SACCO to process this application subject to board approval and guarantor confirmation.</Text>
      </View>

      <TouchableOpacity className={`bg-violet-500 rounded-xl p-3.5 items-center ${isPending ? 'opacity-60' : ''}`} onPress={handleSubmit} disabled={isPending}>
        {isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Submit application</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

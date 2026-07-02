import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

export default function LoanReview() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { step1, loanId } = useLoanApplicationStore()
  const { data: config } = useSaccoConfig(slug)

  if (!step1 || !loanId) {
    router.replace({ pathname: '/sacco/[slug]/loans/apply', params: { slug } })
    return null
  }

  const { data: externalGuarantors, isLoading: isExternalLoading } = useQuery({
    queryKey: ['externalGuarantors', loanId],
    queryFn: () => api.loans.getExternalGuarantors(loanId),
  })

  // We cannot easily fetch the internal guarantors attached to the loan via member api 
  // without adding a new endpoint or parsing the loan object itself if it includes it.
  // For now, we will display external guarantors if fetched, and rely on the success screen.

  const selectedProduct = config?.loan_products.find(p => p.key === step1.loan_product_key)
  const interestRate = selectedProduct?.interest_rate_pct ?? 12
  const monthlyRate = interestRate / 100 / 12
  const n = step1.period_months
  const instalment = monthlyRate > 0
    ? (step1.amount_requested * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : step1.amount_requested / n
  const processingFee = selectedProduct?.processing_fee_pct ?? 0
  const processingFeeAmount = (step1.amount_requested * processingFee) / 100

  const handleConfirm = () => {
    // The loan is already created. We just move to success.
    router.replace({ pathname: '/sacco/[slug]/loans/apply/success', params: { slug, ref: loanId } })
  }

  return (
    <ScrollView className="bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
      </View>
      <Text className="text-ink-faint text-xs mb-4">Step 3 of 3 - Final Review</Text>

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
        {isExternalLoading ? (
          <ActivityIndicator color="#8B5CF6" />
        ) : (
          externalGuarantors && externalGuarantors.length > 0 ? (
            externalGuarantors.map((g: any, index: number) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-border">
                <Text className="text-ink-muted text-xs">{g.full_name || g.guarantor_name}</Text>
                <Text className="text-xs font-semibold text-ink">External</Text>
              </View>
            ))
          ) : (
            <Text className="text-ink-muted text-xs leading-5">
              Guarantor requests have been sent. They will be notified to review and approve.
            </Text>
          )
        )}
      </View>

      <View className="bg-amber-50 rounded-xl p-3 mb-5">
        <Text className="text-amber-700 text-xs leading-4.5">By confirming, you finalise this application subject to board approval and guarantor confirmation.</Text>
      </View>

      <TouchableOpacity className="bg-violet-500 rounded-xl p-3.5 items-center" onPress={handleConfirm}>
        <Text className="text-white text-xs font-semibold">Confirm & Finish</Text>
      </TouchableOpacity>
      
      <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
        <Text className="text-violet-600 text-xs font-semibold">Back to Guarantors</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

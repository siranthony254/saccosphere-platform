import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'

export default function LoanReview() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
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
    router.replace({ pathname: '/sacco/[slug]/loans/apply/success', params: { slug, ref: loanId } })
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
            <Text className="text-white text-xl font-bold">Final Review</Text>
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Step 3 of 3 - Verify details</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
          <Text className="text-white text-sm font-bold mb-3">Loan Summary</Text>
          {[
            { label: 'Loan type', value: selectedProduct?.label ?? step1.loan_product_key },
            { label: 'Amount', value: `KES ${step1.amount_requested.toLocaleString()}` },
            { label: 'Period', value: `${step1.period_months} months` },
            { label: `Interest rate`, value: `${interestRate}% p.a.` },
            { label: 'Monthly payment', value: `KES ${instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, highlight: true },
            { label: 'Total repayable', value: `KES ${(instalment * n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
            { label: 'Processing fee', value: processingFee > 0 ? `KES ${processingFeeAmount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : 'Waived' },
            { label: 'Disbursement to', value: step1.disbursement_method === 'mpesa' ? '📱 M-Pesa' : step1.disbursement_method },
          ].map((row, i, arr) => (
            <View key={row.label} className={`flex-row justify-between items-center py-2.5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className={`text-xs font-bold ${row.highlight ? 'text-mint-400' : 'text-white'}`}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <Text className="text-white text-sm font-bold mb-3">Guarantors</Text>
          {isExternalLoading ? (
            <ActivityIndicator color="#8B5CF6" />
          ) : (
            externalGuarantors && externalGuarantors.length > 0 ? (
              externalGuarantors.map((g: any, index: number) => (
                <View key={index} className="flex-row justify-between items-center py-2.5 border-b border-white/5 last:border-b-0">
                  <Text className="text-white/60 text-xs">{g.full_name || g.guarantor_name}</Text>
                  <Text className="text-[10px] font-bold uppercase text-violet-400">External</Text>
                </View>
              ))
            ) : (
              <Text className="text-white/40 text-xs leading-5">
                Guarantor requests will be sent upon confirmation. They must approve before the loan is disbursed.
              </Text>
            )
          )}
        </View>

        <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
          <Text className="text-amber-200 text-xs leading-5">
            By confirming, you finalise this application. Your SACCO will review it after all guarantors have confirmed.
          </Text>
        </View>

        <TouchableOpacity className="bg-violet-600 rounded-2xl p-4 items-center" onPress={handleConfirm}>
          <Text className="text-white text-sm font-bold uppercase tracking-wider">Confirm & Submit application</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-6 items-center" onPress={() => router.back()}>
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Back to Guarantors</Text>
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}



import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function LoanDisbursed() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()

  return (
    <ScrollView 
      contentContainerStyle={{ 
        paddingHorizontal: PADDING_H, 
        paddingBottom: insets.bottom + 20 
      }}
      className="bg-surface py-8 items-center"
    >
      {/* Success Icon */}
      <View className="w-16 h-16 rounded-full bg-mint-50 justify-center items-center mb-4">
        <Text className="text-4xl">💰</Text>
      </View>

      {/* Title */}
      <Text className="text-ink text-base font-bold mb-2">Loan approved!</Text>
      <Text className="text-ink-muted text-xs text-center leading-5 mb-6">
        Your loan has been approved and sent to your M-Pesa account.
      </Text>

      {/* Disbursement Card */}
      <View 
        className="rounded-2xl p-5 mb-4 w-full text-center bg-mint-600"
      >
        <Text className="text-white/60 text-xs font-semibold mb-1 tracking-wide uppercase">
          Amount received
        </Text>
        <Text className="text-white text-3xl font-bold mb-2">
          KES 150,000
        </Text>
        <Text className="text-white/80 text-xs">
          Sent to +254 712 ··· 678
        </Text>
      </View>

      {/* Receipt */}
      <View className="bg-surface2 rounded-xl p-3.5 w-full mb-6">
        {[
          { label: 'Loan reference', value: 'LOAN-2024-00123' },
          { label: 'M-Pesa reference', value: 'QB2934LKPM' },
          { label: 'Disbursement time', value: 'Apr 26, 2024 · 9:41 AM' },
          { label: 'Status', value: 'Completed' },
        ].map((row) => (
          <View 
            key={row.label} 
            className="flex-row justify-between py-2 border-b border-border"
          >
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Info Box */}
      <View className="bg-mint-50 rounded-xl p-3 mb-6">
        <Text className="text-mint-700 text-xs leading-4.5">
          Your first instalment is due on May 26, 2024. You'll receive a reminder 3 days before.
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity 
        className="w-full bg-violet-500 py-3 rounded-xl items-center mb-3"
        onPress={() => router.replace(`/sacco/${slug}`)}
      >
        <Text className="text-white text-xs font-semibold">Back to dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity className="w-full bg-surface2 py-3 rounded-xl items-center">
        <Text className="text-ink-soft text-xs font-semibold">View repayment schedule</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}

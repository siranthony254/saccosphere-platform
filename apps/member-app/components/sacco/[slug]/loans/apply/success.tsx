
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function LoanSubmittedSuccess() {
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
      {/* Success Ring */}
      <View className="w-16 h-16 rounded-full bg-mint-50 justify-center items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-mint-500 justify-center items-center">
          <Text className="text-white text-lg font-bold">✓</Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-ink text-base font-bold mb-2">Application submitted</Text>
      <Text className="text-ink-muted text-xs text-center leading-5 mb-6">
        Your loan application is with the SACCO. Guarantors have been notified.
      </Text>

      {/* Reference Box */}
      <View className="bg-surface2 rounded-xl p-3 mb-5">
        <Text className="text-ink-soft text-xs font-bold text-center tracking-wider">
          LOAN-2024-00123
        </Text>
      </View>

      {/* Receipt */}
      <View className="bg-surface2 rounded-xl p-3.5 w-full mb-6">
        {[
          { label: 'Status', value: 'Under review' },
          { label: 'Expected decision', value: '3–5 business days' },
          { label: 'Disbursement', value: 'M-Pesa' },
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

      {/* CTA Button */}
      <TouchableOpacity 
        className="w-full bg-violet-500 py-3 rounded-xl items-center mb-3"
        onPress={() => router.replace(`/sacco/${slug}`)}
      >
        <Text className="text-white text-xs font-semibold">Back to dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity className="w-full bg-surface2 py-3 rounded-xl items-center">
        <Text className="text-ink-soft text-xs font-semibold">View application status</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}

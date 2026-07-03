import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'

export default function LoanSubmittedSuccess() {
  const { slug, ref } = useLocalSearchParams<{ slug: string; ref?: string }>()
  const insets = useSafeAreaInsets()
  const loanRef = ref || 'Pending'

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
          paddingTop: insets.top + 40,
          alignItems: 'center'
        }}
      >
        {/* Success Ring */}
        <View className="w-20 h-20 rounded-full bg-mint-500/10 justify-center items-center mb-6 border border-mint-500/20">
          <View className="w-10 h-10 rounded-full bg-mint-500 justify-center items-center">
            <Text className="text-white text-xl font-bold">✓</Text>
          </View>
        </View>

        {/* Title */}
        <Text className="text-white text-xl font-bold mb-3">Application Submitted</Text>
        <Text className="text-white/60 text-xs text-center leading-5 mb-8 px-6">
          Your loan application has been received by the SACCO. Your guarantors have been notified for approval.
        </Text>

        {/* Reference Box */}
        <View className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 mb-8">
          <Text className="text-violet-400 text-xs font-bold text-center tracking-widest uppercase">
            REF: {loanRef}
          </Text>
        </View>

        {/* Details Card */}
        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full mb-8">
          {[
            { label: 'Status', value: 'Under Review', color: '#fbbf24' },
            { label: 'Expected decision', value: '3–5 business days' },
            { label: 'Disbursement method', value: 'M-Pesa' },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className={`flex-row justify-between py-3 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className="text-white text-xs font-bold" style={{ color: row.color || '#fff' }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity
          className="w-full bg-violet-600 py-4 rounded-2xl items-center mb-4"
          onPress={() => router.replace(`/sacco/${slug}`)}
        >
          <Text className="text-white text-sm font-bold uppercase tracking-wider">Back to SACCO Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl items-center"
          onPress={() => router.push(`/(member)/profile`)}
        >
          <Text className="text-white/60 text-sm font-bold uppercase tracking-wider">Track Applications</Text>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </DeepSpaceBackground>
  )
}


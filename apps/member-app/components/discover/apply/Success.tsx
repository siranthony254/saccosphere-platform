import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMembershipApplicationStore } from '../../../store/useMembershipApplicationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoApplicationSuccess() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { saccoSlug } = useMembershipApplicationStore()
  const saccoName = saccoSlug ? saccoSlug.toUpperCase() : slug?.toUpperCase() ?? 'SACCO'

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
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
      <Text className="text-ink text-base font-bold mb-2">Application submitted!</Text>
      <Text className="text-ink-muted text-xs text-center leading-5 mb-6">
        {saccoName} has received your membership application. You'll be notified once it's reviewed.
      </Text>

      {/* Reference Box */}
      <View className="bg-surface2 rounded-xl p-3 mb-4">
        <Text className="text-ink-soft text-xs font-bold text-center tracking-wider">
          {saccoName}-APP-{new Date().getTime().toString().slice(-5)}
        </Text>
      </View>

      {/* Receipt */}
      <View className="bg-surface2 rounded-xl p-3.5 w-full mb-4">
        {[
          { label: 'SACCO', value: saccoName },
          { label: 'Status', value: 'Under review' },
          { label: 'Expected decision', value: '5–7 business days' },
          { label: 'Registration fee', value: 'KES 1,000 paid' },
        ].map((row) => (
          <View
            key={row.label}
            className="flex-row justify-between py-2 border-b border-border last:border-b-0"
          >
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Loan Tracker */}
      <View className="w-full mb-4">
        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full bg-mint-500 justify-center items-center">
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Application submitted</Text>
            <Text className="text-ink-faint text-xs">Just now</Text>
          </View>
        </View>
        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full border-2 border-border bg-surface justify-center items-center">
            <Text className="text-ink-faint text-xs font-bold">2</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">SACCO admin review</Text>
            <Text className="text-ink-faint text-xs">3–5 business days</Text>
          </View>
        </View>
        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full border-2 border-border bg-surface justify-center items-center">
            <Text className="text-ink-faint text-xs font-bold">3</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Approval & activation</Text>
            <Text className="text-ink-faint text-xs">Pending</Text>
          </View>
        </View>
        <View className="flex-row items-start gap-2.5">
          <View className="w-5.5 h-5.5 rounded-full border-2 border-border bg-surface justify-center items-center">
            <Text className="text-ink-faint text-xs font-bold">4</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Dashboard goes live</Text>
            <Text className="text-ink-faint text-xs">Full access unlocked</Text>
          </View>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        className="w-full bg-violet-500 py-3 rounded-xl items-center mb-3"
        onPress={() => router.replace('/(member)')}
      >
        <Text className="text-white text-xs font-semibold">Back to dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity className="w-full bg-surface2 py-3 rounded-xl items-center">
        <Text className="text-ink-soft text-xs font-semibold">Apply to another SACCO</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}
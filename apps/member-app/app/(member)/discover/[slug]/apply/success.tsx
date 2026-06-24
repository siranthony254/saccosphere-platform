import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSacco } from '../../../../../hooks/useSaccos'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'

export default function ApplySuccessScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { data: sacco } = useSacco(slug)
  const { data: config } = useSaccoConfig(slug ?? '')

  const saccoName = sacco?.name ?? slug?.toUpperCase() ?? 'SACCO'
  const appRef = `${saccoName}-APP-${String(Date.now()).slice(-5)}`
  const registrationFee = config?.membership.registration_fee_kes ?? 1000

  return (
    <ScrollView
      className="bg-surface flex-1"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Success ring */}
      <View className="items-center pt-10 mb-4">
        <View className="w-16 h-16 rounded-full mb-4 items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: '#6D28D9' }}>
            <Text className="text-white text-lg font-bold">✓</Text>
          </View>
        </View>
        <Text className="text-ink text-base font-bold mb-1">Application submitted!</Text>
        <Text className="text-ink-muted text-xs text-center leading-5 mx-8 mb-6">
          {saccoName} has received your membership application. You'll be notified once it's reviewed.
        </Text>
      </View>

      {/* Reference box */}
      <View className="mx-4 bg-surface2 rounded-xl p-3 mb-4">
        <Text className="text-ink-soft text-xs font-bold text-center tracking-widest">
          {appRef}
        </Text>
      </View>

      {/* Receipt card */}
      <View className="mx-4 bg-surface2 rounded-xl p-3.5 mb-4">
        {[  
          { label: 'SACCO', value: saccoName },
          { label: 'Status', value: 'Under review' },
          { label: 'Expected decision', value: '5–7 business days' },
          { label: 'Registration fee', value: `KES ${registrationFee.toLocaleString()} paid` },
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

      {/* Application tracker */}
      <View className="mx-4 mb-6">
        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full items-center justify-center" style={{ backgroundColor: '#6D28D9' }}>
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Application submitted</Text>
            <Text className="text-ink-faint text-xs">Just now</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full border-2 items-center justify-center" style={{ borderColor: '#D1D5DB', backgroundColor: '#fff' }}>
            <Text className="text-ink-faint text-xs font-bold">2</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">SACCO admin review</Text>
            <Text className="text-ink-faint text-xs">3–5 business days</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-2.5 mb-4">
          <View className="w-5.5 h-5.5 rounded-full border-2 items-center justify-center" style={{ borderColor: '#D1D5DB', backgroundColor: '#fff' }}>
            <Text className="text-ink-faint text-xs font-bold">3</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Approval & activation</Text>
            <Text className="text-ink-faint text-xs">Pending</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-2.5">
          <View className="w-5.5 h-5.5 rounded-full border-2 items-center justify-center" style={{ borderColor: '#D1D5DB', backgroundColor: '#fff' }}>
            <Text className="text-ink-faint text-xs font-bold">4</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink text-xs font-medium">Dashboard goes live</Text>
            <Text className="text-ink-faint text-xs">Full access unlocked</Text>
          </View>
        </View>
      </View>

      {/* CTA buttons */}
      <TouchableOpacity
        className="mx-4 py-3 rounded-xl items-center mb-3"
        style={{ backgroundColor: '#6D28D9' }}
        onPress={() => router.replace('/(member)')}
      >
        <Text className="text-white text-xs font-semibold">Back to dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mx-4 py-3 rounded-xl items-center bg-surface2"
        onPress={() => router.replace('/(member)/discover')}
      >
        <Text className="text-ink-soft text-xs font-semibold">Apply to another SACCO</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

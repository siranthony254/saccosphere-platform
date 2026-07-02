import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSacco } from '../../../../../hooks/useSaccos'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'

export default function ApplySuccessScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { data: sacco } = useSacco(slug)
  const { data: config } = useSaccoConfig(slug ?? '')

  const saccoName = sacco?.name ?? slug?.toUpperCase() ?? 'SACCO'
  const appRef = `${saccoName}-APP-${String(Date.now()).slice(-5)}`
  const registrationFee = config?.membership.registration_fee_kes ?? 1000

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top }}
      >
        {/* Success ring */}
        <View className="items-center pt-10 mb-4">
          <View className="w-16 h-16 rounded-full mb-4 items-center justify-center bg-violet-500/20">
            <View className="w-8 h-8 rounded-full items-center justify-center bg-violet-500">
              <Text className="text-white text-lg font-bold">✓</Text>
            </View>
          </View>
          <Text className="text-white text-base font-bold mb-1">Application submitted!</Text>
          <Text className="text-white/60 text-xs text-center leading-5 mx-8 mb-6">
            {saccoName} has received your membership application. You'll be notified once it's reviewed.
          </Text>
        </View>

        {/* Reference box */}
        <View className="mx-4 bg-white/10 rounded-xl p-3 mb-4">
          <Text className="text-white/80 text-xs font-bold text-center tracking-widest">
            {appRef}
          </Text>
        </View>

        {/* Receipt card */}
        <View className="mx-4 bg-white/5 border border-white/10 rounded-xl p-3.5 mb-4">
          {[  
            { label: 'SACCO', value: saccoName },
            { label: 'Status', value: 'Under review' },
            { label: 'Expected decision', value: '5–7 business days' },
            { label: 'Registration fee', value: `KES ${registrationFee.toLocaleString()} paid` },
          ].map((row) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2 border-b border-white/5 last:border-b-0"
            >
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className="text-white text-xs font-semibold">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Application tracker */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full items-center justify-center bg-violet-500">
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-xs font-medium">Application submitted</Text>
              <Text className="text-white/40 text-xs">Just now</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full border border-white/20 items-center justify-center bg-white/5">
              <Text className="text-white/40 text-xs font-bold">2</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-xs font-medium">SACCO admin review</Text>
              <Text className="text-white/40 text-xs">3–5 business days</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full border border-white/20 items-center justify-center bg-white/5">
              <Text className="text-white/40 text-xs font-bold">3</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-xs font-medium">Approval & activation</Text>
              <Text className="text-white/40 text-xs">Pending</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5">
            <View className="w-5.5 h-5.5 rounded-full border border-white/20 items-center justify-center bg-white/5">
              <Text className="text-white/40 text-xs font-bold">4</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-xs font-medium">Dashboard goes live</Text>
              <Text className="text-white/40 text-xs">Full access unlocked</Text>
            </View>
          </View>
        </View>

        {/* CTA buttons */}
        <TouchableOpacity
          className="mx-4 py-3 rounded-xl items-center mb-3 bg-violet-500"
          onPress={() => router.replace('/(member)')}
        >
          <Text className="text-white text-xs font-semibold">Back to dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mx-4 py-3 rounded-xl items-center bg-white/10"
          onPress={() => router.replace('/(member)/discover')}
        >
          <Text className="text-white/80 text-xs font-semibold">Apply to another SACCO</Text>
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

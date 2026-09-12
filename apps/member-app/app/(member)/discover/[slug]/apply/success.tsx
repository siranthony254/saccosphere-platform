import { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSacco } from '../../../../../hooks/useSaccos'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'
import { Icon } from '../../../../../components/ui/Icon'
import { useTheme } from '../../../../../theme/ThemeProvider'
import { hapticSuccess } from '../../../../../lib/haptics'

export default function ApplySuccessScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { data: sacco } = useSacco(slug)
  const { data: config } = useSaccoConfig(slug ?? '')

  useEffect(() => {
    hapticSuccess()
  }, [])

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
              <Icon name="check" size={18} color="#ffffff" />
            </View>
          </View>
          <Text className="text-base font-bold mb-1" style={{ color: c.text }}>Application submitted!</Text>
          <Text className="text-xs text-center leading-5 mx-8 mb-6" style={{ color: c.textMuted }}>
            {saccoName} has received your membership application. You&apos;ll be notified once it&apos;s reviewed.
          </Text>
        </View>

        {/* Reference box */}
        <View className="rounded-xl p-3 mb-4 mx-4" style={{ backgroundColor: c.surface }}>
          <Text className="text-xs font-bold text-center tracking-widest" style={{ color: c.text }}>
            {appRef}
          </Text>
        </View>

        {/* Receipt card */}
        <View className="mx-4 border rounded-xl p-3.5 mb-4" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          {[
            { label: 'SACCO', value: saccoName },
            { label: 'Status', value: 'Under review' },
            { label: 'Expected decision', value: '5–7 business days' },
            { label: 'Registration fee', value: `KES ${registrationFee.toLocaleString()} · Due after approval` },
          ].map((row) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2 border-b last:border-b-0"
              style={{ borderColor: c.border }}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className="text-xs font-semibold" style={{ color: c.text }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Application tracker */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full items-center justify-center bg-violet-500">
              <Icon name="check" size={12} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium" style={{ color: c.text }}>Application submitted</Text>
              <Text className="text-xs" style={{ color: c.textFaint }}>Just now</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full border items-center justify-center" style={{ borderColor: c.border, backgroundColor: c.surface }}>
              <Text className="text-xs font-bold" style={{ color: c.textFaint }}>2</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium" style={{ color: c.text }}>SACCO admin review</Text>
              <Text className="text-xs" style={{ color: c.textFaint }}>3–5 business days</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5 mb-4">
            <View className="w-5.5 h-5.5 rounded-full border items-center justify-center" style={{ borderColor: c.border, backgroundColor: c.surface }}>
              <Text className="text-xs font-bold" style={{ color: c.textFaint }}>3</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium" style={{ color: c.text }}>Approval & activation</Text>
              <Text className="text-xs" style={{ color: c.textFaint }}>Pending</Text>
            </View>
          </View>

          <View className="flex-row items-start gap-2.5">
            <View className="w-5.5 h-5.5 rounded-full border items-center justify-center" style={{ borderColor: c.border, backgroundColor: c.surface }}>
              <Text className="text-xs font-bold" style={{ color: c.textFaint }}>4</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium" style={{ color: c.text }}>Dashboard goes live</Text>
              <Text className="text-xs" style={{ color: c.textFaint }}>Full access unlocked</Text>
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
          className="mx-4 py-3 rounded-xl items-center"
          style={{ backgroundColor: c.surface }}
          onPress={() => router.replace('/(member)/discover')}
        >
          <Text className="text-xs font-semibold" style={{ color: c.text }}>Apply to another SACCO</Text>
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

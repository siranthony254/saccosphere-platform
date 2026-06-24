
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRegistrationStore } from '../../../store/useRegistrationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const SACCO_COLORS: Record<string, string> = {
  'stima-sacco': '#0070ba',
  'teachers-sacco': '#7c3aed',
  'unaitas-sacco': '#16a085',
  'kenya-police-sacco': '#c0392b',
  'imarika-sacco': '#2980b9',
}

const SACCO_INITIALS: Record<string, string> = {
  'stima-sacco': 'ST',
  'teachers-sacco': 'TS',
  'unaitas-sacco': 'UN',
  'kenya-police-sacco': 'KP',
  'imarika-sacco': 'IK',
}

const SACCO_NAMES: Record<string, string> = {
  'stima-sacco': 'Stima SACCO',
  'teachers-sacco': 'Teachers SACCO',
  'unaitas-sacco': 'Unaitas SACCO',
  'kenya-police-sacco': 'Kenya Police SACCO',
  'imarika-sacco': 'Imarika SACCO',
}

export default function RegistrationSuccessScreen() {
  const { linkedSaccoSlugs } = useRegistrationStore()
  const insets = useSafeAreaInsets()

  const handleDashboard = () => {
    router.replace('/(member)')
  }

  const saccoCount = linkedSaccoSlugs?.length ?? 0

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }} className="bg-surface py-8 items-center">
      {/* Success Ring */}
      <View className="w-18 h-18 rounded-full bg-mint-50 justify-center items-center mb-5">
        <View className="w-9 h-9 rounded-full bg-mint-500 justify-center items-center">
          <Text className="text-white text-lg font-bold">✓</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-ink-muted text-xs text-center leading-5 mb-6">
        Your Saccosphere account is live. {saccoCount} SACCO{saccoCount !== 1 ? 's' : ''} linked. You can now manage everything in one place.
      </Text>

      {/* Linked SACCOs Summary */}
      {saccoCount > 0 && (
        <View className="w-full bg-surface2 rounded-xl p-4 mb-5">
          <Text className="text-ink text-xs font-semibold mb-3">Linked SACCOs</Text>

          {linkedSaccoSlugs?.map((slug: string) => (
            <View key={slug} className="flex-row items-center py-2.5 border-b border-border">
              <View
                className="w-9 h-9 rounded-lg justify-center items-center mr-3"
                style={{ backgroundColor: SACCO_COLORS[slug] || '#10B981' }}
              >
                <Text className="text-white text-xs font-bold">
                  {SACCO_INITIALS[slug] || '?'}
                </Text>
              </View>
              <Text className="flex-1 text-ink text-xs font-medium">{SACCO_NAMES[slug] || 'SACCO'}</Text>
              <Text className="text-mint-500 text-base">✓</Text>
            </View>
          ))}

          <TouchableOpacity className="mt-2">
            <Text className="text-violet-500 text-xs font-semibold text-center">Add more SACCOs later →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {saccoCount === 0 && (
        <View className="w-full bg-mint-50 rounded-xl p-4 mb-5 items-center">
          <Text className="text-ink text-xs font-semibold mb-1.5">No SACCOs linked yet</Text>
          <Text className="text-ink-muted text-xs leading-4.5 text-center">
            You can add SACCOs anytime from your dashboard, or search our directory of 237 verified SACCOs.
          </Text>
        </View>
      )}

      {/* CTA Button */}
      <TouchableOpacity className="w-full bg-violet-500 py-3 rounded-xl items-center" onPress={handleDashboard}>
        <Text className="text-white text-xs font-semibold">Go to dashboard →</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}

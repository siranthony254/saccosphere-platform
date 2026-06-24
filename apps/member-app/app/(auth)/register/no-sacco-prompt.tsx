import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function NoSaccoPrompt() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
      }}
      className="bg-surface py-8"
    >
      {/* Brand */}
      <Text
        className="text-sm font-bold mb-4"
        style={{ color: VIOLET, fontFamily: 'Fraunces_700Bold' }}
      >
        Saccosphere
      </Text>

      {/* Progress Bar */}
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.5 rounded" style={{ backgroundColor: VIOLET }} />
        <View className="flex-1 h-0.5 rounded" style={{ backgroundColor: VIOLET }} />
        <View className="flex-1 h-0.5 rounded" style={{ backgroundColor: VIOLET }} />
        <View className="flex-1 h-0.5 rounded" style={{ backgroundColor: VIOLET }} />
      </View>
      <Text className="text-xs mb-4" style={{ color: INK_FAINT }}>
        Step 4 of 4 — Link your SACCOs
      </Text>

      {/* Header */}
      <Text className="text-ink text-base font-bold mb-2">
        Which SACCOs are you a member of?
      </Text>
      <Text className="text-xs leading-5 mb-4" style={{ color: INK_MUTED }}>
        Select all that apply. You can add more later.
      </Text>

      {/* Search placeholder */}
      <View
        className="rounded-xl p-3 mb-4"
        style={{ borderWidth: 1, borderColor: BORDER_MID, backgroundColor: SURFACE2 }}
      >
        <Text className="text-xs" style={{ color: INK_FAINT }}>
          🔍 Search 237 SACCOs...
        </Text>
      </View>

      {/* No SACCO suggestion card */}
      <View
        className="rounded-xl p-5 mb-4 items-center"
        style={{
          backgroundColor: SURFACE2,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: BORDER_MID,
        }}
      >
        <Text className="text-3xl mb-3">🏦</Text>
        <Text className="text-ink text-sm font-semibold mb-1">
          Not in a SACCO yet?
        </Text>
        <Text
          className="text-xs text-center leading-5 mb-4"
          style={{ color: INK_MUTED, paddingHorizontal: 4 }}
        >
          No problem. You can still create your account and join a SACCO directly
          from Saccosphere.
        </Text>
        <TouchableOpacity
          className="w-full rounded-xl py-3 items-center mb-2"
          style={{ backgroundColor: VIOLET }}
          onPress={() => router.push('/browse-saccos')}
        >
          <Text className="text-white text-xs font-semibold">
            Browse & join a SACCO →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-full rounded-xl py-3 items-center"
          style={{ borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE }}
          onPress={() => router.replace('/(member)')}
        >
          <Text className="text-xs font-semibold" style={{ color: INK_SOFT }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info text */}
      <Text
        className="text-xs text-center leading-5"
        style={{ color: INK_FAINT, paddingHorizontal: 8 }}
      >
        You can link SACCOs anytime from your profile. Your account will be created
        even without a linked SACCO.
      </Text>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}

import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'
import { Icon } from '../../../../ui/Icon'
import { useTheme } from '../../../../../theme/ThemeProvider'

export default function LoanSubmittedSuccess() {
  const { slug, ref } = useLocalSearchParams<{ slug: string; ref?: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
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
            <Icon name="check" size={20} color="#ffffff" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-xl font-bold mb-3" style={{ color: c.text }}>Application Submitted</Text>
        <Text className="text-xs text-center leading-5 mb-8 px-6" style={{ color: c.textMuted }}>
          Your loan application has been received by the SACCO. Your guarantors have been notified for approval.
        </Text>

        {/* Reference Box */}
        <View className="border rounded-2xl px-6 py-2 mb-8" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Text className="text-violet-400 text-xs font-bold text-center tracking-widest uppercase">
            REF: {loanRef}
          </Text>
        </View>

        {/* Details Card */}
        <View className="border rounded-2xl p-5 w-full mb-8" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          {[
            { label: 'Status', value: 'Under Review', color: '#fbbf24' },
            { label: 'Expected decision', value: '3–5 business days' },
            { label: 'Disbursement method', value: 'M-Pesa' },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className="flex-row justify-between py-3"
              style={i !== arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : undefined}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className="text-xs font-bold" style={{ color: row.color || c.text }}>{row.value}</Text>
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
          className="w-full border py-4 rounded-2xl items-center"
          style={{ backgroundColor: c.surface, borderColor: c.border }}
          onPress={() => router.push(`/(member)/profile`)}
        >
          <Text className="text-sm font-bold uppercase tracking-wider" style={{ color: c.textMuted }}>Track Applications</Text>
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </DeepSpaceBackground>
  )
}


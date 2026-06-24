import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useSacco } from '../../hooks/useSaccos'
import { useSaccoConfig } from '../../hooks/useSaccoConfig'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { data: sacco, isLoading, isError, refetch } = useSacco(slug)
  const { data: config } = useSaccoConfig(slug)

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-ink-muted text-xs">Loading SACCO profile...</Text>
      </View>
    )
  }

  if (isError || !sacco) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <Text className="text-ink text-sm font-semibold mb-2">SACCO profile unavailable</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text className="text-violet-500 text-xs font-semibold">Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const membership = config?.membership
  const requiredDocs = membership?.required_documents
    ?.filter((doc) => doc.required)
    .map((doc) => doc.label)
    .join(', ')

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface"
    >
      <View className="py-2.5 px-4 border-b border-border flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-ink-soft text-lg">Back</Text>
        </TouchableOpacity>
        <View className="ml-3">
          <Text className="text-ink text-sm font-semibold">{sacco.name}</Text>
          <Text className="text-ink-faint text-xs">{sacco.sector} · Open membership</Text>
        </View>
      </View>

      <View className="rounded-xl p-4.5 mb-3 text-center" style={{ backgroundColor: sacco.color }}>
        <View
          className="w-13 h-13 rounded-xl justify-center items-center mx-auto mb-2.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Text className="text-white text-lg font-bold">{sacco.initials}</Text>
        </View>
        <Text className="text-white text-base font-semibold mb-0.5">{sacco.name}</Text>
        <Text className="text-white/60 text-xs mb-2.5">SASRA Reg: {sacco.sasra_reg_no || 'Pending'}</Text>
        <View className="px-2.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Text className="text-white text-xs font-semibold">{sacco.status === 'active' ? 'Verified' : sacco.status}</Text>
        </View>
      </View>

      <View className="grid grid-cols-3 gap-2 mb-3">
        <View className="bg-surface2 rounded-xl p-2.5 text-center">
          <Text className="text-mint-600 text-base font-bold">{sacco.member_count.toLocaleString()}</Text>
          <Text className="text-ink-faint text-xs">Members</Text>
        </View>
        <View className="bg-surface2 rounded-xl p-2.5 text-center">
          <Text className="text-mint-600 text-base font-bold">{sacco.loan_rate_pct}%</Text>
          <Text className="text-ink-faint text-xs">Rate p.a.</Text>
        </View>
        <View className="bg-surface2 rounded-xl p-2.5 text-center">
          <Text className="text-mint-600 text-base font-bold">{sacco.loan_multiplier}x</Text>
          <Text className="text-ink-faint text-xs">Loan limit</Text>
        </View>
      </View>

      <View className="bg-surface border border-border rounded-xl p-3.5 mb-2.5">
        <Text className="text-ink text-xs font-semibold mb-2">Membership requirements</Text>
        {[
          { label: 'Min. age', value: `${membership?.min_age ?? 18} years` },
          {
            label: 'Monthly contribution',
            value: `KES ${(membership?.min_monthly_contribution_kes ?? 0).toLocaleString()} min`,
          },
          {
            label: 'Registration fee',
            value: `KES ${(membership?.registration_fee_kes ?? 0).toLocaleString()}`,
          },
          {
            label: 'Share capital',
            value: `KES ${(membership?.min_share_capital_kes ?? 0).toLocaleString()} min`,
          },
          { label: 'KYC docs required', value: requiredDocs || 'National ID' },
        ].map((row) => (
          <View key={row.label} className="flex-row justify-between py-2 border-b border-border last:border-b-0">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        className="w-full bg-violet-500 py-3 rounded-xl items-center mb-2"
        onPress={() => router.push(`/(member)/discover/${slug}/apply`)}
      >
        <Text className="text-white text-xs font-semibold">Apply to join</Text>
      </TouchableOpacity>

      <Text className="text-ink-faint text-xs text-center">Applications reviewed by the SACCO admin team.</Text>
      <View className="h-7.5" />
    </ScrollView>
  )
}
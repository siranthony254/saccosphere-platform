import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSacco } from '../../../hooks/useSaccos'
import { useSaccoConfig } from '../../../hooks/useSaccoConfig'

export default function SaccoProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  // Use real-time data with 30 second stale time for member count
  const { data: sacco, isLoading, isError, refetch } = useSacco(slug, { staleTime: 30_000 })
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(sacco?.slug ?? slug ?? '', { staleTime: 30_000 })

  if (isLoading || isLoadingConfig) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <ActivityIndicator color="#6D28D9" />
        <Text className="text-ink-muted text-xs mt-3">Loading SACCO details...</Text>
      </View>
    )
  }

  if (isError || !sacco) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-ink-muted text-xs mb-3">Failed to load SACCO details.</Text>
        <Text className="text-ink-faint text-xs mb-2">Slug: {slug}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text className="text-violet-500 text-xs font-semibold">Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      className="bg-surface flex-1"
    >
      {/* Top bar */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full bg-surface3 items-center justify-center">
          <Text className="text-ink-soft text-xs">←</Text>
        </TouchableOpacity>
        <View className="ml-2.5">
          <Text className="text-ink text-sm font-semibold">{sacco.name}</Text>
          <Text className="text-ink-faint text-xs">
            {sacco.sector} · {sacco.membership_type === 'open' ? 'Open membership' : 'Restricted'}
          </Text>
        </View>
      </View>

      {/* Hero header */}
      <View
        className="mx-4 mt-4 rounded-xl px-5 pb-5 pt-6 items-center"
        style={{ backgroundColor: sacco.color ?? '#6D28D9' }}
      >
        <View className="w-13 h-13 rounded-xl bg-white/15 items-center justify-center mb-2.5">
          <Text className="text-white text-lg font-bold">{sacco.initials}</Text>
        </View>
        <Text className="text-white text-base font-bold mb-0.5">{sacco.name}</Text>
        <Text className="text-white/60 text-xs mb-3 text-center">
          {sacco.established_year ? `Est. ${sacco.established_year} · ` : ''}
          {sacco.sasra_reg_no || 'SASRA Regulated'}
        </Text>
        <View className="bg-white/20 px-3 py-0.5 rounded-full">
          <Text className="text-white text-xs font-semibold">✓ SASRA Regulated</Text>
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row gap-2 mx-4 mt-4">
        {[
          { label: 'Members', value: sacco.member_count?.toLocaleString() ?? '—' },
          { label: 'Rate p.a.', value: sacco.default_interest_rate ? `${sacco.default_interest_rate}%` : '—' },
          { label: 'Loan limit', value: sacco.loan_multiplier ? `${sacco.loan_multiplier}×` : '—' },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 bg-surface2 rounded-xl py-3 items-center">
            <Text className="text-ink text-sm font-bold">{stat.value}</Text>
            <Text className="text-ink-faint text-xs mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Membership requirements - from config */}
      <View className="mx-4 mt-4 bg-surface border border-border rounded-xl p-3.5">
        <Text className="text-ink text-xs font-semibold mb-2">Membership requirements</Text>
        {[
          { label: 'Min. age', value: '18 years' },
          { label: 'Monthly contribution', value: `KES ${config?.membership.min_monthly_contribution_kes?.toLocaleString() ?? '1,000'} min` },
          { label: 'Registration fee', value: `KES ${config?.membership.registration_fee_kes?.toLocaleString() ?? '1,000'}` },
          { label: 'Share capital', value: `KES ${config?.membership.min_share_capital_kes?.toLocaleString() ?? '5,000'} min` },
          { label: 'KYC docs required', value: 'ID + photo + payslip' },
        ].map((req) => (
          <View
            key={req.label}
            className="flex-row justify-between py-1.5 border-b border-border last:border-b-0"
          >
            <Text className="text-ink-muted text-xs">{req.label}</Text>
            <Text className="text-ink text-xs font-semibold">{req.value}</Text>
          </View>
        ))}
      </View>

      {/* Apply button */}
      <View className="mx-4 mt-5">
        <TouchableOpacity
          className={`w-full py-3 rounded-xl items-center ${
            sacco.membership_type === 'open' ? 'bg-violet-500' : 'bg-surface2'
          }`}
          onPress={() => {
            if (sacco.membership_type === 'open') {
              router.push({
                pathname: '/(member)/discover/[slug]/apply',
                params: { slug: sacco.slug },
              })
            }
          }}
          disabled={sacco.membership_type !== 'open'}
        >
          <Text
            className={`text-xs font-semibold ${
              sacco.membership_type === 'open' ? 'text-white' : 'text-ink-faint'
            }`}
          >
            {sacco.membership_type === 'open' ? 'Apply to join →' : 'Restricted membership'}
          </Text>
        </TouchableOpacity>
        <Text className="text-ink-faint text-[10px] text-center mt-2">
          Applications are reviewed within 5–7 business days
        </Text>
      </View>
    </ScrollView>
  )
}

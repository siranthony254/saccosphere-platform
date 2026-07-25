import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSacco } from '../../../hooks/useSaccos'
import { useSaccoConfig } from '../../../hooks/useSaccoConfig'
import { DeepSpaceBackground } from '../../../components/DeepSpaceBackground'

export default function SaccoProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  
  // Use real-time data with 30 second stale time for member count
  const { data: sacco, isLoading, isError, refetch } = useSacco(slug, { staleTime: 30_000 })
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(sacco?.slug ?? slug ?? '', { staleTime: 30_000 })

  if (isLoading || isLoadingConfig) {
    return (
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-white/60 text-xs mt-3">Loading SACCO details...</Text>
        </View>
      </DeepSpaceBackground>
    )
  }

  if (isError || !sacco) {
    return (
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white/60 text-xs mb-3">Failed to load SACCO details.</Text>
          <Text className="text-white/40 text-xs mb-2">Slug: {slug}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-violet-500 text-xs font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      </DeepSpaceBackground>
    )
  }

  return (
    <DeepSpaceBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top }}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="px-4 py-2.5 border-b border-white/10 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
            <Text className="text-white/80 text-xs">←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-white text-sm font-semibold">{sacco.name}</Text>
            <Text className="text-white/60 text-xs">
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

            <View key={stat.label} className="flex-1 bg-white/5 rounded-xl py-3 items-center border border-white/5">
              <Text className="text-white text-sm font-bold">{stat.value}</Text>
              <Text className="text-white/60 text-xs mt-0.5">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Membership requirements - from config and sacco detail */}
        <View className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-3.5">
          <Text className="text-white/90 text-xs font-semibold mb-2">Membership requirements</Text>
          {[
            { label: 'Min. age', value: sacco.min_age ? `${sacco.min_age} years` : '18 years' },
            { label: 'Monthly contribution', value: sacco.min_monthly_contribution ? `KES ${sacco.min_monthly_contribution.toLocaleString()} min` : 'Not specified' },
            { label: 'Registration fee', value: sacco.registration_fee ? `KES ${sacco.registration_fee.toLocaleString()}` : 'Free' },
            { label: 'Share capital', value: sacco.min_share_capital ? `KES ${sacco.min_share_capital.toLocaleString()} min` : 'Not specified' },
            { label: 'KYC docs required', value: 'ID verification' },
          ].map((req) => (
            <View
              key={req.label}
              className="flex-row justify-between py-1.5 border-b border-white/5 last:border-b-0"
            >
              <Text className="text-white/60 text-xs">{req.label}</Text>
              <Text className="text-white/90 text-xs font-semibold">{req.value}</Text>
            </View>
          ))}
        </View>


        {/* Apply button */}
        <View className="mx-4 mt-5">
          <TouchableOpacity
            className={`w-full py-3 rounded-xl items-center ${
              sacco.membership_type === 'open' ? 'bg-violet-500' : 'bg-white/10'
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
                sacco.membership_type === 'open' ? 'text-white' : 'text-white/40'
              }`}
            >
              {sacco.membership_type === 'open' ? 'Apply to join →' : 'Restricted membership'}
            </Text>
          </TouchableOpacity>
          <Text className="text-white/40 text-[10px] text-center mt-2">
            Applications are reviewed within 5–7 business days
          </Text>
        </View>
      </ScrollView>
    </DeepSpaceBackground>
  )
}


import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useSacco } from '../../hooks/useSaccos'
import { useMembershipApplicationStore } from '../../store/useMembershipApplicationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { setSacco } = useMembershipApplicationStore()
  const { data: sacco, isLoading, error } = useSacco(slug)

  const handleApply = () => {
    if (sacco?.slug) {
      setSacco(sacco.slug)
      router.push(`/(member)/discover/${sacco.slug}/apply/step1`)
    }
  }

  if (isLoading) {
    return (
      <View className="bg-surface flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-ink-muted text-xs mt-3">Loading SACCO details...</Text>
      </View>
    )
  }

  if (error || !sacco) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
        className="bg-surface"
      >
        <View className="py-2.5 px-4 border-b border-border flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-ink-soft text-lg">←</Text>
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-ink text-sm font-semibold">SACCO Details</Text>
            <Text className="text-ink-faint text-xs">Unable to load</Text>
          </View>
        </View>
        <View className="bg-red-50 border border-red-200 rounded-xl p-4">
          <Text className="text-red-800 text-xs font-semibold mb-1">Failed to load SACCO</Text>
          <Text className="text-red-900 text-xs">
            {error instanceof Error ? error.message : 'Unable to fetch SACCO details. Please try again.'}
          </Text>
        </View>
      </ScrollView>
    )
  }

  const formatKes = (value: number) => `KES ${value.toLocaleString()}`

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface"
    >
      {/* Header */}
      <View className="py-2.5 px-4 border-b border-border flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-ink-soft text-lg">←</Text>
        </TouchableOpacity>
        <View className="ml-3">
          <Text className="text-ink text-sm font-semibold">{sacco.name}</Text>
          <Text className="text-ink-faint text-xs">
            {sacco.sector || 'SACCO'} · {sacco.membership_open ? 'Open membership' : 'Closed membership'}
          </Text>
        </View>
      </View>

      {/* SACCO Profile Card */}
      <View
        className="rounded-xl p-4.5 mb-3 items-center"
        style={{ backgroundColor: sacco.color || '#16a085' }}
      >
        <View
          className="w-13 h-13 rounded-xl justify-center items-center mb-2.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
        >
          <Text className="text-white text-lg font-bold">{sacco.initials || sacco.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text className="text-white text-base font-semibold mb-0.5">{sacco.name}</Text>
        <Text className="text-white/60 text-xs mb-2.5">
          Est. {sacco.established_year || 'N/A'} · {sacco.sasra_reg_no || 'No SASRA reg'}
        </Text>
        <View className="bg-white/20 px-2.5 py-0.5 rounded-full">
          <Text className="text-white text-xs font-semibold">✓ SASRA Regulated</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="grid grid-cols-3 gap-2 mb-3">
        <View className="bg-surface2 rounded-xl p-2.5 items-center">
          <Text className="text-mint-500 text-sm font-semibold">{sacco.member_count.toLocaleString()}</Text>
          <Text className="text-ink-faint text-xs">Members</Text>
        </View>
        <View className="bg-surface2 rounded-xl p-2.5 items-center">
          <Text className="text-mint-500 text-sm font-semibold">{sacco.default_interest_rate}%</Text>
          <Text className="text-ink-faint text-xs">Rate p.a.</Text>
        </View>
        <View className="bg-surface2 rounded-xl p-2.5 items-center">
          <Text className="text-mint-500 text-sm font-semibold">{sacco.loan_multiplier}x</Text>
          <Text className="text-ink-faint text-xs">Loan limit</Text>
        </View>
      </View>

      {/* Membership Requirements */}
      <View className="bg-surface border border-border rounded-xl p-3.5 mb-3">
        <Text className="text-ink text-xs font-semibold mb-2">Membership requirements</Text>
        
        <View className="flex-row justify-between py-2 border-b border-border">
          <Text className="text-ink-muted text-xs">Min. age</Text>
          <Text className="text-ink text-xs font-semibold">{sacco.min_age ?? 18} years</Text>
        </View>
        
        <View className="flex-row justify-between py-2 border-b border-border">
          <Text className="text-ink-muted text-xs">Monthly contribution</Text>
          <Text className="text-ink text-xs font-semibold">{formatKes(sacco.min_monthly_contribution ?? 1000)} min</Text>
        </View>
        
        <View className="flex-row justify-between py-2 border-b border-border">
          <Text className="text-ink-muted text-xs">Registration fee</Text>
          <Text className="text-ink text-xs font-semibold">{formatKes(sacco.registration_fee ?? 1000)}</Text>
        </View>
        
        <View className="flex-row justify-between py-2 border-b border-border">
          <Text className="text-ink-muted text-xs">Share capital</Text>
          <Text className="text-ink text-xs font-semibold">{formatKes(sacco.min_share_capital ?? 5000)} min</Text>
          {sacco.membership_open === false && (
            <View className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
              <Text className="text-yellow-500 font-bold mb-1">Closed to new members</Text>
              <Text className="text-yellow-500/80 text-sm">This SACCO is currently not accepting new membership applications.</Text>
            </View>
          )}

          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center shadow-lg ${(sacco.membership_open === false) ? 'bg-surface2' : 'bg-mint-500 shadow-mint-500/20'}`}
            onPress={() => router.push(`/(member)/discover/${sacco.slug}/apply`)}
            disabled={sacco.membership_open === false}
          >
            <Text className={`font-bold text-lg ${(sacco.membership_open === false) ? 'text-ink-faint' : 'text-slate-900'}`}>
              {sacco.membership_open === false ? 'Not accepting applications' : 'Apply for membership'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-between py-2">
          <Text className="text-ink-muted text-xs">KYC docs required</Text>
          <Text className="text-ink text-xs font-semibold">ID + photo + payslip</Text>
        </View>
      </View>

      <Text className="text-ink-faint text-xs text-center">
        Applications reviewed within {sacco.application_review_days ?? '5-7'} business days
      </Text>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}

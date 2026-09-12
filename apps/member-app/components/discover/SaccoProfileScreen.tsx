import { useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useSacco } from '../../hooks/useSaccos'
import { useTheme } from '../../theme/ThemeProvider'
import { CardBackdrop } from '../ui/CardBackdrop'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useRecentlyViewedStore } from '../../store/useRecentlyViewedStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { data: sacco, isLoading, error } = useSacco(slug)
  const saccoProfileBackdrop = usePreferencesStore((s) => s.cardBackdrops.saccoProfile)
  const hasSaccoProfileBackdrop = Boolean(saccoProfileBackdrop)
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addRecentlyViewed)

  useEffect(() => {
    if (!sacco) return
    addRecentlyViewed({ slug: sacco.slug, name: sacco.name, color: sacco.color, initials: sacco.initials })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sacco?.slug])

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>Loading SACCO details...</Text>
      </View>
    )
  }

  if (error || !sacco) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        style={{ backgroundColor: c.bg }}
      >
        <View style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={{ color: c.textMuted, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>SACCO Details</Text>
            <Text style={{ color: c.textFaint, fontSize: 12 }}>Unable to load</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 16 }}>
          <Text style={{ color: c.danger, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Failed to load SACCO</Text>
          <Text style={{ color: c.danger, fontSize: 12 }}>
            {error instanceof Error ? error.message : 'Unable to fetch SACCO details. Please try again.'}
          </Text>
        </View>
      </ScrollView>
    )
  }

  const formatKes = (value: number) => `KES ${value.toLocaleString()}`
  const isOpen = sacco.membership_type === 'open'

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
      style={{ backgroundColor: c.bg }}
    >
      {/* Header */}
      <View style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ color: c.textMuted, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{sacco.name}</Text>
          <Text style={{ color: c.textFaint, fontSize: 12 }}>
            {sacco.sector || 'SACCO'} · {isOpen ? 'Open membership' : 'Restricted membership'}
          </Text>
        </View>
      </View>

      {/* SACCO Profile Card — sacco.color is the SACCO's own brand colour,
          always vivid enough for white text/badges regardless of app theme.
          A nature backdrop (if the member picked one) replaces it entirely. */}
      <CardBackdrop
        slot="saccoProfile"
        style={{ borderRadius: 12, marginBottom: 12 }}
      >
        <View
          style={{ padding: 18, alignItems: 'center', backgroundColor: hasSaccoProfileBackdrop ? 'transparent' : sacco.color || '#16a085' }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{sacco.initials || sacco.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{sacco.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 10 }}>
            Est. {sacco.established_year || 'N/A'} · {sacco.sasra_reg_no || 'No SASRA reg'}
          </Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>SASRA Regulated</Text>
          </View>
        </View>
      </CardBackdrop>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: c.success, fontSize: 14, fontWeight: '600' }}>{sacco.member_count.toLocaleString()}</Text>
          <Text style={{ color: c.textFaint, fontSize: 12 }}>Members</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: c.success, fontSize: 14, fontWeight: '600' }}>{sacco.default_interest_rate}%</Text>
          <Text style={{ color: c.textFaint, fontSize: 12 }}>Rate p.a.</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: c.success, fontSize: 14, fontWeight: '600' }}>{sacco.loan_multiplier}x</Text>
          <Text style={{ color: c.textFaint, fontSize: 12 }}>Loan limit</Text>
        </View>
      </View>

      {/* Membership Requirements */}
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Membership requirements</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Min. age</Text>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.min_age ?? 18} years</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Monthly contribution</Text>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{formatKes(sacco.min_monthly_contribution ?? 1000)} min</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Registration fee</Text>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{formatKes(sacco.registration_fee ?? 1000)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Share capital</Text>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{formatKes(sacco.min_share_capital ?? 5000)} min</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>KYC docs required</Text>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>ID + photo + payslip</Text>
        </View>
      </View>

      {!isOpen && (
        <View style={{ marginBottom: 16, padding: 14, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 16 }}>
          <Text style={{ color: c.warning, fontWeight: '700', marginBottom: 4 }}>Closed to new members</Text>
          <Text style={{ color: c.warning, fontSize: 13 }}>This SACCO is currently not accepting new membership applications.</Text>
        </View>
      )}

      <TouchableOpacity
        style={{
          width: '100%',
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 16,
          backgroundColor: isOpen ? c.success : c.surfaceAlt,
        }}
        onPress={() => router.push(`/(member)/discover/${sacco.slug}/apply`)}
        disabled={!isOpen}
      >
        <Text style={{ fontWeight: '700', fontSize: 16, color: isOpen ? '#fff' : c.textFaint }}>
          {isOpen ? 'Apply for membership' : 'Not accepting applications'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: c.textFaint, fontSize: 12, textAlign: 'center' }}>
        Applications reviewed within {sacco.application_review_days ?? '5-7'} business days
      </Text>

      {/* Spacer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  )
}


import { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useSaccos } from '../../hooks/useSaccos'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sector, setSector] = useState('All')

  // Debounce search to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: saccos, isLoading, isError, refetch } = useSaccos({
    search: debouncedSearch || undefined,
    sector: sector === 'All' ? undefined : sector,
  })
  const { data: memberships } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships ?? [])
  const memberSaccoSlugs = new Set(activeMemberships.map(m => m.sacco_slug))

  // Extract unique sectors from loaded SACCOs
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(saccos?.map(s => s.sector).filter(Boolean) ?? [])
    return ['All', ...Array.from(uniqueSectors).sort()]
  }, [saccos])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Find a SACCO</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{saccos?.length} SACCOs · All SASRA regulated</Text>
      </View>

      {/* Member SACCOs section */}
      {activeMemberships.length > 0 && (
        <View style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
          <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>Your SACCOs</Text>
          {activeMemberships.map(membership => (
            <TouchableOpacity
              key={membership.id}
              style={{ backgroundColor: FROSTED_DARK, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER_WHITE }}
              onPress={() => router.push({ pathname: '/sacco/[slug]', params: { slug: membership.sacco_slug } })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: membership.sacco_color || VIOLET }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{membership.sacco_initials || 'SA'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>{membership.sacco_name}</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Member {membership.member_number}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ color: MINT, fontSize: 12, fontWeight: '600' }}>Active</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 14, backgroundColor: BACKGROUND }}>
        <TextInput
          style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 10, fontSize: 14, color: TEXT, backgroundColor: FROSTED_DARK }}
          placeholder="🔍  Search by name, sector, county..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={TEXT_MUTED}
        />
      </View>

      {/* Sector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: BACKGROUND, marginBottom: 0 }} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12, gap: 8 }}>
        {sectors.map(s => (
          <TouchableOpacity key={s} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: sector === s ? VIOLET : FROSTED_DARK, borderColor: sector === s ? VIOLET : BORDER_WHITE }} onPress={() => setSector(s)}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: sector === s ? '#fff' : TEXT_MUTED }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={{ paddingHorizontal: 14 }}>
        {isLoading ? (
          [1,2,3].map(i => <View key={i} style={{ height: 160, backgroundColor: FROSTED_DARK, borderRadius: 12, marginBottom: 12 }} />)
        ) : isError ? (
          <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 32 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 12 }}>Failed to load SACCOs.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>Try again</Text></TouchableOpacity>
          </View>
        ) : saccos?.filter(sacco => !memberSaccoSlugs.has(sacco.slug)).map(sacco => (
          <TouchableOpacity
            key={sacco.id}
            style={{ backgroundColor: FROSTED_DARK, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER_WHITE }}
            onPress={() => router.push({ pathname: '/(member)/discover/[slug]', params: { slug: sacco.id } })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: sacco.color }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{sacco.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>{sacco.name}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{sacco.sector} · {sacco.county}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: sacco.membership_type === 'open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: sacco.membership_type === 'open' ? MINT : '#F59E0B' }}>
                  {sacco.membership_type === 'open' ? 'Open' : 'Restricted'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: FROSTED, borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: TEXT, fontSize: 12, fontWeight: '700' }}>{sacco.member_count.toLocaleString()}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>Members</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: TEXT, fontSize: 12, fontWeight: '700' }}>{sacco.default_interest_rate}%</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>Rate p.a.</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: TEXT, fontSize: 12, fontWeight: '700' }}>{sacco.loan_multiplier}×</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>Loan limit</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: sacco.membership_type === 'open' ? VIOLET : FROSTED }}
              onPress={() =>
                sacco.membership_type === 'open' &&
                router.push({ pathname: '/(member)/discover/[slug]', params: { slug: sacco.slug } })
              }
              disabled={sacco.membership_type !== 'open'}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: sacco.membership_type === 'open' ? '#fff' : TEXT_MUTED }}>
                {sacco.membership_type === 'open' ? 'Apply to join →' : 'Restricted membership'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  )
}

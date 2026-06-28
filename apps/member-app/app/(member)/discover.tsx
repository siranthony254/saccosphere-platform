
import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSaccos } from '../../hooks/useSaccos'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'


const SECTORS = ['All', 'Community', 'Education', 'Energy', 'Government', 'Health']

export default function DiscoverScreen() {
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

  return (
    <ScrollView className="bg-surface2" keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View className="pt-13 px-4 pb-3 bg-surface border-b border-border">
        <Text className="text-ink text-xl font-bold">Find a SACCO</Text>
        <Text className="text-ink-faint text-xs mt-0.5">{saccos?.length} SACCOs · All SASRA regulated</Text>
      </View>

      {/* Member SACCOs section */}
      {activeMemberships.length > 0 && (
        <View className="px-3.5 py-3 bg-surface border-b border-border">
          <Text className="text-ink text-xs font-semibold mb-2.5">Your SACCOs</Text>
          {activeMemberships.map(membership => (
            <TouchableOpacity
              key={membership.id}
              className="bg-surface2 rounded-xl p-3 mb-2 border border-border"
              onPress={() => router.push({ pathname: '/sacco/[slug]', params: { slug: membership.sacco_slug } })}
            >
              <View className="flex-row items-center gap-2.5">
                <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: membership.sacco_color || '#6D28D9' }}>
                  <Text className="text-white text-xs font-bold">{membership.sacco_initials || 'SA'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-xs font-semibold">{membership.sacco_name}</Text>
                  <Text className="text-ink-faint text-xs">Member {membership.member_number}</Text>
                </View>
                <View className="bg-mint-50 px-2 py-0.5 rounded-lg">
                  <Text className="text-mint-700 text-xs font-semibold">Active</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View className="px-3.5 py-3.5 bg-surface">
        <TextInput
          className="border border-border rounded-xl p-2.5 text-sm text-ink-soft bg-surface3"
          placeholder="🔍  Search by name, sector, county..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Sector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-surface mb-0" contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12, gap: 8 }}>
        {SECTORS.map(s => (
          <TouchableOpacity key={s} className={`px-3.5 py-1.5 rounded-full border ${sector === s ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`} onPress={() => setSector(s)}>
            <Text className={`text-xs font-medium ${sector === s ? 'text-white' : 'text-ink-muted'}`}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View className="px-3.5">
        {isLoading ? (
          [1,2,3].map(i => <View key={i} className="h-40 bg-border rounded-xl mb-3" />)
        ) : isError ? (
          <View className="items-center px-8 py-8">
            <Text className="text-ink-muted text-xs mb-3">Failed to load SACCOs.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text className="text-violet-500 text-xs font-semibold">Try again</Text></TouchableOpacity>
          </View>
        ) : saccos?.filter(sacco => !memberSaccoSlugs.has(sacco.slug)).map(sacco => (
          <TouchableOpacity
            key={sacco.id}
            className="bg-surface rounded-xl p-3.5 mb-3 border border-border"
            onPress={() => router.push({ pathname: '/(member)/discover/[slug]', params: { slug: sacco.slug } })}
          >
            <View className="flex-row items-center gap-2.5 mb-3">
              <View className="w-10.5 h-10.5 rounded-lg items-center justify-center" style={{ backgroundColor: sacco.color }}>
                <Text className="text-white text-xs font-bold">{sacco.initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink text-xs font-semibold">{sacco.name}</Text>
                <Text className="text-ink-faint text-xs">{sacco.sector} · {sacco.county}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-lg ${sacco.membership_type === 'open' ? 'bg-mint-50' : 'bg-amber-50'}`}>
                <Text className={`text-xs font-semibold ${sacco.membership_type === 'open' ? 'text-mint-700' : 'text-amber-700'}`}>
                  {sacco.membership_type === 'open' ? 'Open' : 'Restricted'}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-around bg-surface2 rounded-lg p-2.5 mb-3">
              <View className="items-center">
                <Text className="text-ink text-xs font-bold">{sacco.member_count.toLocaleString()}</Text>
                <Text className="text-ink-faint text-xs mt-0.5">Members</Text>
              </View>
              <View className="items-center">
                <Text className="text-ink text-xs font-bold">{sacco.default_interest_rate}%</Text>
                <Text className="text-ink-faint text-xs mt-0.5">Rate p.a.</Text>
              </View>
              <View className="items-center">
                <Text className="text-ink text-xs font-bold">{sacco.loan_multiplier}×</Text>
                <Text className="text-ink-faint text-xs mt-0.5">Loan limit</Text>
              </View>
            </View>
            <TouchableOpacity
              className={`rounded-lg p-2.5 items-center ${sacco.membership_type === 'open' ? 'bg-violet-500' : 'bg-surface3'}`}
              onPress={() =>
                sacco.membership_type === 'open' &&
                router.push({ pathname: '/(member)/discover/[slug]', params: { slug: sacco.id } })
              }
              disabled={sacco.membership_type !== 'open'}
            >
              <Text className={`text-xs font-semibold ${sacco.membership_type === 'open' ? 'text-white' : 'text-ink-faint'}`}>
                {sacco.membership_type === 'open' ? 'Apply to join →' : 'Restricted membership'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

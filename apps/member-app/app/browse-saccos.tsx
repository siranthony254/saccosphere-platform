import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useState } from 'react'
import { useRegistrationStore } from '../store/useRegistrationStore'
import { useSaccos } from '../hooks/useSaccos'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const SECTORS = ['All', 'Community', 'Education', 'Health', 'Energy']

export default function BrowseSaccos() {
  const insets = useSafeAreaInsets()
  const { setSelectedSaccoSlug } = useRegistrationStore()
  const [selectedSector, setSelectedSector] = useState('All')
  const [search, setSearch] = useState('')
  const { data: saccos = [], isLoading, isError, refetch } = useSaccos({
    search: search || undefined,
    sector: selectedSector === 'All' ? undefined : selectedSector,
  })

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
          <Text className="text-ink text-sm font-semibold">Discover SACCOs</Text>
          <Text className="text-ink-faint text-xs">{saccos.length} available</Text>
          <Text className="text-ink-faint text-[10px] mt-1">Tap a SACCO to start your application.</Text>
        </View>
      </View>

      <View className="bg-surface2 rounded-xl p-3 mb-3">
        <TextInput
          className="text-ink-faint text-xs"
          placeholder="Search by name, sector, county..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View className="flex-row gap-1.5 flex-wrap mb-4">
        {SECTORS.map((sector) => (
          <TouchableOpacity
            key={sector}
            onPress={() => setSelectedSector(sector)}
            className={`px-3 py-1 rounded-full border ${
              selectedSector === sector ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'
            }`}
          >
            <Text className={`text-xs font-medium ${selectedSector === sector ? 'text-white' : 'text-ink-muted'}`}>
              {sector}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-ink-faint text-xs font-semibold uppercase tracking-wider mb-2">Most popular</Text>

      {isError ? (
        <View className="py-8 items-center">
          <Text className="text-ink-muted text-xs mb-2">Could not load SACCOs.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-violet-500 text-xs font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View className="py-8 items-center">
          <Text className="text-ink-muted text-xs">Loading SACCOs...</Text>
        </View>
      ) : (
        saccos.map((sacco) => (
          <TouchableOpacity
            key={sacco.id}
            onPress={() => {
              setSelectedSaccoSlug(sacco.slug)
              router.push('/(auth)/register')
            }}
            className="bg-surface border border-border rounded-xl p-3 mb-2.5"
          >
            <View className="flex-row items-center gap-2.5 mb-2">
              <View
                className="w-10 h-10 rounded-lg justify-center items-center"
                style={{ backgroundColor: sacco.color }}
              >
                <Text className="text-white text-xs font-bold">{sacco.initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink text-xs font-semibold">{sacco.name}</Text>
                <Text className="text-ink-faint text-xs">{sacco.sector} · {sacco.county}</Text>
              </View>
              <View className="bg-mint-100 px-2 py-0.5 rounded-md">
                <Text className="text-mint-700 text-xs font-semibold">Open</Text>
              </View>
            </View>
            <View className="grid grid-cols-3 gap-1.5 mb-2">
              <View className="bg-surface2 rounded-lg p-1.5 text-center">
                <Text className="text-ink text-xs font-semibold">{sacco.member_count.toLocaleString()}</Text>
                <Text className="text-ink-faint text-xs">Members</Text>
              </View>
              <View className="bg-surface2 rounded-lg p-1.5 text-center">
                <Text className="text-ink text-xs font-semibold">{sacco.loan_rate_pct}%</Text>
                <Text className="text-ink-faint text-xs">Rate p.a.</Text>
              </View>
              <View className="bg-surface2 rounded-lg p-1.5 text-center">
                <Text className="text-ink text-xs font-semibold">{sacco.loan_multiplier}x</Text>
                <Text className="text-ink-faint text-xs">Limit</Text>
              </View>
            </View>
            <View className="bg-violet-100 py-2 rounded-lg items-center">
              <Text className="text-violet-500 text-xs font-semibold">Apply to join</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View className="h-7.5" />
    </ScrollView>
  )
}

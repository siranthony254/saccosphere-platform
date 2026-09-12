
import { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useSaccos } from '../../hooks/useSaccos'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { DiscoverHero } from '../../components/discover/DiscoverHero'
import { CategoryTabs } from '../../components/discover/CategoryTabs'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useTheme } from '../../theme/ThemeProvider'


export default function DiscoverScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const [activeCategory, setActiveCategory] = useState('saccos')
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
  const visibleSaccos = saccos?.filter(sacco => !memberSaccoSlugs.has(sacco.slug)) ?? []

  // Extract unique sectors from loaded SACCOs
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(saccos?.map(s => s.sector).filter(Boolean) ?? [])
    return ['All', ...Array.from(uniqueSectors).sort()]
  }, [saccos])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
      <DiscoverHero search={search} onSearchChange={setSearch} insetTop={insets.top} />
      <CategoryTabs activeId={activeCategory} onSelect={setActiveCategory} />

      {activeCategory === 'saccos' && (
      <>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Find a SACCO</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{saccos?.length} SACCOs · All SASRA regulated</Text>
      </View>

      {/* Member SACCOs section */}
      {activeMemberships.length > 0 && (
        <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginBottom: 10 }}>Your SACCOs</Text>
          {activeMemberships.map(membership => (
            <TouchableOpacity
              key={membership.id}
              style={{ backgroundColor: c.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: c.border }}
              onPress={() => router.push({ pathname: '/sacco/[slug]', params: { slug: membership.sacco_slug } })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: membership.sacco_color || c.accent }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{membership.sacco_initials || 'SA'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{membership.sacco_name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Member {membership.member_number}</Text>
                </View>
                <Badge label="Active" variant="success" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12, gap: 8 }}>
        {sectors.map(s => (
          <TouchableOpacity key={s} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: sector === s ? c.accent : c.surface, borderColor: sector === s ? c.accent : c.border }} onPress={() => setSector(s)}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: sector === s ? '#fff' : c.textMuted }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={{ paddingHorizontal: 14 }}>
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} height={160} borderRadius={12} style={{ marginBottom: 12 }} />)
        ) : isError ? (
          <EmptyState
            icon="error"
            title="Failed to load SACCOs"
            description="Check your connection and try again."
          >
            <TouchableOpacity onPress={() => refetch()} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Try again</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : visibleSaccos.length === 0 ? (
          <EmptyState
            icon="search"
            title="No SACCOs found"
            description={search ? `Nothing matches "${search}". Try a different name, sector, or county.` : 'Try a different sector filter.'}
          />
        ) : visibleSaccos.map(sacco => (
          <TouchableOpacity
            key={sacco.id}
            style={{ backgroundColor: c.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: c.border }}
            onPress={() => router.push({ pathname: '/(member)/discover/[slug]', params: { slug: sacco.slug } })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: sacco.color }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{sacco.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{sacco.sector} · {sacco.county}</Text>
              </View>
              <Badge
                label={sacco.membership_type === 'open' ? 'Open' : 'Restricted'}
                variant={sacco.membership_type === 'open' ? 'success' : 'warning'}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{sacco.member_count.toLocaleString()}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Members</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{sacco.default_interest_rate}%</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Rate p.a.</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{sacco.loan_multiplier}×</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Loan limit</Text>
              </View>
            </View>
            <View
              style={{ borderRadius: 8, padding: 10, alignItems: 'center', backgroundColor: sacco.membership_type === 'open' ? c.accent : c.surfaceAlt }}
              className="flex-row items-center justify-center gap-2"
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: sacco.membership_type === 'open' ? '#fff' : c.textMuted }}>
                {sacco.membership_type === 'open' ? 'Apply to join' : 'Restricted membership'}
              </Text>
              {sacco.membership_type === 'open' && <Icon name="arrow-right" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      </>
      )}
    </ScrollView>
    </SafeAreaView>
  )
}

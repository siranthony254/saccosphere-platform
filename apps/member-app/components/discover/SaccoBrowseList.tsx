import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSaccos } from '../../hooks/useSaccos'
import { useTheme } from '../../theme/ThemeProvider'
import type { Sacco } from '@saccosphere/schemas'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const SECTORS = ['All', 'Community', 'Education', 'Health', 'Energy']

interface SaccoBrowseListProps {
  title: string
  subtitle: string
  onSelectSacco: (sacco: Sacco) => void
}

/**
 * Shared list/search/filter markup for browse-saccos.tsx and
 * discover-browse.tsx — identical except for the header copy and what
 * happens when a SACCO card is tapped.
 */
export function SaccoBrowseList({ title, subtitle, onSelectSacco }: SaccoBrowseListProps) {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const [selectedSector, setSelectedSector] = useState('All')
  const [search, setSearch] = useState('')
  const { data: saccos = [], isLoading, isError, refetch } = useSaccos({
    search: search || undefined,
    sector: selectedSector === 'All' ? undefined : selectedSector,
  })

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
      style={{ backgroundColor: c.bg }}
    >
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: c.textMuted, fontSize: 18 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{title}</Text>
          <Text style={{ color: c.textFaint, fontSize: 12 }}>{saccos.length} available</Text>
          <Text style={{ color: c.textFaint, fontSize: 10, marginTop: 4 }}>{subtitle}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <TextInput
          style={{ color: c.text, fontSize: 12 }}
          placeholder="Search by name, sector, county..."
          placeholderTextColor={c.textFaint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {SECTORS.map((sector) => {
          const selected = selectedSector === sector
          return (
            <TouchableOpacity
              key={sector}
              onPress={() => setSelectedSector(sector)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: selected ? c.accent : c.surface,
                borderColor: selected ? c.accent : c.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: selected ? '#fff' : c.textMuted }}>
                {sector}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={{ color: c.textFaint, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        Most popular
      </Text>

      {isError ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>Could not load SACCOs.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Loading SACCOs...</Text>
        </View>
      ) : (
        saccos.map((sacco) => {
          const isOpen = sacco.membership_type === 'open'
          return (
            <TouchableOpacity
              key={sacco.id}
              onPress={() => onSelectSacco(sacco)}
              style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, marginBottom: 10 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: sacco.color }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{sacco.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.name}</Text>
                  <Text style={{ color: c.textFaint, fontSize: 12 }}>{sacco.sector} · {sacco.county}</Text>
                </View>
                <View style={{ backgroundColor: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: isOpen ? c.success : c.warning, fontSize: 12, fontWeight: '600' }}>
                    {isOpen ? 'Open' : 'Restricted'}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 6, alignItems: 'center' }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.member_count.toLocaleString()}</Text>
                  <Text style={{ color: c.textFaint, fontSize: 12 }}>Members</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 6, alignItems: 'center' }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.default_interest_rate}%</Text>
                  <Text style={{ color: c.textFaint, fontSize: 12 }}>Rate p.a.</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 8, padding: 6, alignItems: 'center' }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{sacco.loan_multiplier}x</Text>
                  <Text style={{ color: c.textFaint, fontSize: 12 }}>Limit</Text>
                </View>
              </View>
              <View style={{ backgroundColor: isOpen ? c.accentSoft : c.surfaceAlt, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: isOpen ? c.accent : c.textFaint, fontSize: 12, fontWeight: '600' }}>
                  {isOpen ? 'Apply to join' : 'Restricted membership'}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

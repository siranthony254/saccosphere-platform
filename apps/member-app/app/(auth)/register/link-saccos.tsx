import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { useSaccos } from '../../../hooks/useSaccos'
import { useIsAuthenticated } from '../../../store/useAuthStore'
import { useLinkMembership } from '../../../hooks/useLinkMembership'
import { useMemberships } from '../../../hooks/useMembership'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'
const MINT_LIGHT = '#E6F7F1'
const MINT_500 = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function LinkSaccos() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const {
    step1,
    setLinkedSaccos,
    selectedSaccoSlug: selectedSlugFromStore,
    setSelectedSaccoSlug,
  } = useRegistrationStore()
  const [selected, setSelected] = useState<string[]>(
    selectedSlugFromStore ? [selectedSlugFromStore] : []
  )
  const { data: saccos = [], isLoading: saccosLoading } = useSaccos({
    search: search || undefined,
  })
  const { mutate: linkMembership, isPending: isLinkPending } = useLinkMembership()
  const isAuthenticated = useIsAuthenticated()
  const { data: memberships = [] } = useMemberships()

  // Merge already-membership data into results for lookup
  const existingSlugs = useMemo(
    () => new Set(memberships.map((m) => m.sacco_slug)),
    [memberships]
  )

  const toggle = (slug: string) => {
    setSelected((prev) => (prev.includes(slug) ? [] : [slug]))
  }

  const selectedSaccoSlug = selectedSlugFromStore ?? selected[0] ?? null

  const routeAfterRegister = async () => {
    const slug = selectedSaccoSlug
    if (!slug) {
      router.replace('/(member)')
      return
    }

    try {
      const myMemberships = memberships.length > 0 ? memberships : await api.member.getMemberships()
      const existingMembership = myMemberships.find((m) => m.sacco_slug === slug)
      if (existingMembership) {
        setLinkedSaccos([slug])
        router.replace('/(member)')
      } else {
        router.push(`/(member)/discover/${slug}/apply`)
      }
    } catch {
      router.push('/(auth)/register/success')
    }
  }

  const handleFinish = () => {
    if (!step1) return
    setLinkedSaccos(selected)

    if (!isAuthenticated) {
      Alert.alert('Session not ready', 'Please sign in, then continue linking your SACCO.')
      router.replace('/(auth)/login')
      return
    }

    if (selected.length > 0 && selected[0]) {
      // Try linking membership for the selected SACCO
      linkMembership(
        { sacco_slug: selected[0], member_number: '' },
        {
          onSuccess: () => router.replace('/(member)'),
          onError: () => routeAfterRegister(),
        }
      )
      return
    }

    routeAfterRegister()
  }

  const handleContinueWithoutSacco = () => {
    setSelected([])
    setSelectedSaccoSlug(null)
    setLinkedSaccos([])

    if (!isAuthenticated) {
      Alert.alert('Session not ready', 'Please sign in, then continue.')
      router.replace('/(auth)/login')
      return
    }

    router.replace('/(member)')
  }

  const pending = isLinkPending

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: PADDING_H,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.top + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Step progress bar */}
      <View className="flex-row gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i < 4 ? VIOLET : BORDER_WHITE }}
          />
        ))}
      </View>
      <Text className="text-xs mb-3" style={{ color: TEXT_MUTED }}>
        Step 4 of 4 — Link your SACCOs
      </Text>

      {/* Brand */}
      <Text
        className="text-sm font-bold mb-4"
        style={{ color: VIOLET, fontFamily: 'Fraunces_700Bold' }}
      >
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-base font-bold mb-1" style={{ color: TEXT }}>
        Which SACCOs are you a member of?
      </Text>
      <Text className="text-xs mb-4" style={{ color: TEXT_MUTED, lineHeight: 18 }}>
        Select all that apply. You can add more later.
      </Text>

      {/* Search */}
      <View
        className="border rounded-xl p-3 text-sm mb-3"
        style={{ borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
      >
        <Text className="text-xs" style={{ color: TEXT_MUTED }}>
          🔍 Search {saccos.length || 237} SACCOs...
        </Text>
      </View>
      <TextInput
        className="absolute opacity-0 left-0 right-0"
        style={{ height: 0 }}
        value={search}
        onChangeText={setSearch}
        placeholder="Search SACCOs..."
        placeholderTextColor={TEXT_MUTED}
      />

      {/* SACCO list */}
      {saccosLoading ? (
        <View className="py-8 items-center">
          <Text className="text-xs" style={{ color: TEXT_MUTED }}>
            Loading SACCOs...
          </Text>
        </View>
      ) : (
        saccos.map((sacco) => {
          const isSelected = selected.includes(sacco.slug)
          const isAlreadyLinked = existingSlugs.has(sacco.slug)
          return (
            <TouchableOpacity
              key={sacco.id}
              className="flex-row items-center p-3 rounded-xl mb-2"
              style={{
                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : FROSTED_DARK,
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? MINT : BORDER_WHITE,
                opacity: isAlreadyLinked ? 0.6 : 1,
              }}
              onPress={() => toggle(sacco.slug)}
              disabled={isAlreadyLinked}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: sacco.color || VIOLET }}
              >
                <Text className="text-white text-xs font-bold">
                  {sacco.initials || 'SA'}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-xs font-semibold" style={{ color: TEXT }}>{sacco.name}</Text>
                <Text className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                  {sacco.sector}
                  {isAlreadyLinked ? ' · Already linked' : ''}
                </Text>
              </View>
              {isSelected && (
                <Text
                  className="text-xs font-bold"
                  style={{ color: MINT, fontSize: 16 }}
                >
                  ✓
                </Text>
              )}
              {!isSelected && (
                <View
                  className="w-4 h-4 rounded-full"
                  style={{
                    borderWidth: 2,
                    borderColor: BORDER_WHITE,
                  }}
                />
              )}
            </TouchableOpacity>
          )
        })
      )}

      {/* My SACCO isn't listed */}
      <TouchableOpacity className="mt-2 mb-4">
        <Text
          className="text-xs font-semibold text-center"
          style={{ color: VIOLET }}
        >
          My SACCO isn't listed →
        </Text>
      </TouchableOpacity>

      {/* Finish */}
      <TouchableOpacity
        className="rounded-xl py-3.5 items-center mb-2"
        style={{ backgroundColor: VIOLET, opacity: pending || !step1 ? 0.6 : 1 }}
        onPress={handleFinish}
        disabled={pending || !step1}
      >
        {pending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Finish setup →</Text>
        )}
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity
        onPress={handleContinueWithoutSacco}
        className="rounded-xl py-3 border items-center mb-3"
        style={{
          borderColor: BORDER_WHITE,
          backgroundColor: FROSTED_DARK,
        }}
        disabled={pending || !step1}
      >
        <Text className="text-xs font-semibold" style={{ color: TEXT }}>
          Not in a SACCO yet? Browse & join
        </Text>
        <Text className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
          Your account will work without a linked SACCO
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

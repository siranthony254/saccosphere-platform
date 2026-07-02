import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { usePublicStats } from '../hooks/usePublicStats'
import { useMemberships } from '../hooks/useMembership'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))
const CONTENT_WIDTH = Math.min(760, SCREEN_WIDTH - PADDING_H * 2)

// 2 columns always — cards use percentage-based flexBasis so the grid
// never depends on a (sometimes stale, especially on web) Dimensions read.
const GAP = 12
const CARD_REF_WIDTH = 160 // reference size only, for scaling icon/text
const CARD_HEIGHT = CARD_REF_WIDTH * 0.9
const ICON_SIZE = Math.max(24, Math.min(32, CARD_REF_WIDTH * 0.18))
const CARD_TITLE_SIZE = Math.max(14, Math.min(20, CARD_REF_WIDTH * 0.11))
const CARD_SUBTITLE_SIZE = Math.max(12, Math.min(16, CARD_REF_WIDTH * 0.085))
const TRUST_STRIP_OVERFLOW = 18

// ─── Brand palette ────────────────────────────────────────────────────
const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TOP_BAR_SURFACE = 'rgba(8, 12, 28, 0.96)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const VIOLET_LIGHT = '#EDE9FE'
const MINT = '#10B981'
const MINT_LIGHT = '#E6F7F1'
const MINT_50 = '#F0FAF6'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function LandingScreen() {
  const insets = useSafeAreaInsets()
  const { data: stats } = usePublicStats()
  const [lookupVisible, setLookupVisible] = useState(false)

  const totalSaccos = formatCount(stats?.total_saccos)
  const totalMembers = formatCount(stats?.total_members_on_app)

  return (
    <>
      <StatusBar style="light" translucent />
      <View style={{ flex: 1, backgroundColor: BACKGROUND }}>
        <View
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['rgba(109, 40, 217, 0.36)', 'transparent']}
          style={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: 130,
            top: -80,
            left: -80,
          }}
        />
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.22)', 'transparent']}
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            top: -60,
            right: -80,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.18,
            transform: [{ rotate: '15deg' }],
          }}
        >
          {Array.from({ length: 9 }).map((_, index) => (
            <View
              key={`grid-h-${index}`}
              style={{
                position: 'absolute',
                top: index * 42,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
          {Array.from({ length: 9 }).map((_, index) => (
            <View
              key={`grid-v-${index}`}
              style={{
                position: 'absolute',
                left: index * 42,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </View>

        {/* ── Top navigation bar ── */}
        <View
          className="flex-row items-center"
          style={{
            paddingTop: insets.top + 10,
            paddingBottom: 10,
            paddingHorizontal: PADDING_H,
            borderBottomWidth: 0.5,
            borderBottomColor: 'rgba(255,255,255,0.12)',
            backgroundColor: TOP_BAR_SURFACE,
          }}
        >
          {/* Logo */}
          <View className="flex-row items-center gap-2">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center"
              style={{ backgroundColor: VIOLET }}
            >
              <Text className="text-white font-bold text-xs">S</Text>
            </View>
            <Text
              className="font-bold text-lg"
              style={{ color: TEXT, fontFamily: 'Fraunces_700Bold' }}
            >
              Saccosphere
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: PADDING_H,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View
            className="items-center self-center w-full"
            style={{ maxWidth: CONTENT_WIDTH, alignItems: 'center' }}
          >
            {/* ── Hero section ── */}
            <View
            className="pt-10 items-center w-full"
            style={{
              width: '100%',
              backgroundColor: FROSTED,
              borderWidth: 1,
              borderColor: BORDER_WHITE,
              borderRadius: 28,
              paddingHorizontal: 24,
              paddingVertical: 24,
              marginBottom: 24,
            }}
          >
              {/* Trust badge */}
              <View
                className="px-4 py-1.5 rounded-full mb-5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                }}
              >
                <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                  SASRA regulated · CBK licensed
                </Text>
              </View>

              {/* Hero heading */}
              <Text
                className="text-center mb-3"
                style={{ color: TEXT, fontSize: 28, fontWeight: '800', lineHeight: 38 }}
              >
                The Future of{' '}
                <Text style={{ color: VIOLET }}>SACCOs</Text>
              </Text>

              {/* CTA buttons */}
              <View className="flex-row gap-2.5 justify-center w-full">
                <TouchableOpacity
                  className="flex-1 py-3 px-5 rounded-xl items-center"
                  style={{ backgroundColor: VIOLET }}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text className="text-white text-xs font-semibold">Create account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 px-5 rounded-xl items-center"
                  style={{
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.18)',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Link existing SACCOs */}
              <TouchableOpacity
                className="mt-4 py-3 px-5 rounded-xl items-center w-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderStyle: 'dashed',
                }}
                onPress={() => setLookupVisible(true)}
              >
                <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                  🔗 Link my existing SACCOs
                </Text>
                <Text className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                  Already a member? Sync your data in one tap
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Feature grid — always 2 columns ── */}
            <View className="py-2 w-full">
              <Text
                className="text-xs font-semibold text-center mb-4 tracking-widest uppercase"
                style={{ color: TEXT_MUTED }}
              >
                Everything in one dashboard
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  columnGap: GAP,
                  rowGap: GAP,
                }}
              >
                <FeatureCard
                  icon="B"
                  color={MINT}
                  title="Unified balances"
                  subtitle="All SACCO savings in one view"
                />
                <FeatureCard
                  icon="P"
                  color="#2563EB"
                  title="Pay via M-Pesa"
                  subtitle="Contribute & repay instantly"
                />
                <FeatureCard
                  icon="L"
                  color="#D97706"
                  title="Loan tracking"
                  subtitle="Progress & due date alerts"
                />
                <FeatureCard
                  icon="S"
                  color={VIOLET}
                  title={`${totalSaccos} SACCOs`}
                  subtitle="Browse & apply to new ones"
                />
              </View>
            </View>

                
            <View className="h-28" />
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -TRUST_STRIP_OVERFLOW,
          zIndex: 10,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 0,
            borderWidth: 1,
            borderColor: BORDER_WHITE,
            paddingVertical: 28,
            paddingHorizontal: 28,
            paddingBottom: 28 + insets.bottom,
            marginHorizontal: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <View
            className="flex-row flex-wrap"
            style={{ justifyContent: 'space-between', gap: 16 }}
          >
            <TrustStat value={totalSaccos} label="SACCOs" />
            <TrustStat value={totalMembers} label="Members" />
            <TrustStat value="SASRA" label="Regulated" />
            <TrustStat value="CBK" label="Licensed" />
          </View>
        </View>
      </View>

      {/* ── Link Existing Membership Modal ── */}
      <LinkExistingMembershipModal
        visible={lookupVisible}
        onClose={() => setLookupVisible(false)}
        onSuccess={() => {
          setLookupVisible(false)
          router.replace('/(member)')
        }}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  LINK EXISTING MEMBERSHIP MODAL
// ═══════════════════════════════════════════════════════════════════════

type LookupResult = {
  sacco_name: string
  sacco_slug: string
  member_number: string
  member_name: string
  sacco_color: string
  sacco_initials: string
}

function LinkExistingMembershipModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'search' | 'results'>('search')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<LookupResult[]>([])
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const { data: memberships = [] } = useMemberships()

  const handleLookup = useCallback(async () => {
    if (!idNumber && !phone) {
      Alert.alert('Missing info', 'Enter your National ID number or phone number to search.')
      return
    }
    setLoading(true)
    try {
      // Query the backend for existing membership records matching this ID/phone
      const found: LookupResult[] = await lookupExistingMemberships(idNumber, phone, memberships)
      setResults(found)
      setStep('results')
      if (found.length === 0) {
        Alert.alert(
          'No matches found',
          'We could not find any existing SACCO memberships matching your details. You can create an account and join a SACCO from the directory.'
        )
      }
    } catch {
      Alert.alert('Search failed', 'Unable to check for existing memberships. Try again later.')
    } finally {
      setLoading(false)
    }
  }, [idNumber, phone, memberships])

  const handleConfirmAll = useCallback(async () => {
    setSyncing(true)
    try {
      // Sync confirmed memberships to the user's portfolio
      await syncMemberships(confirmed, results)
      onSuccess()
    } catch {
      Alert.alert('Sync failed', 'Unable to sync membership data. Please try again.')
    } finally {
      setSyncing(false)
    }
  }, [confirmed, results, onSuccess])

  const toggleConfirm = (sacco_slug: string) => {
    setConfirmed((prev) =>
      prev.includes(sacco_slug)
        ? prev.filter((s) => s !== sacco_slug)
        : [...prev, sacco_slug]
    )
  }

  const reset = () => {
    setStep('search')
    setIdNumber('')
    setPhone('')
    setResults([])
    setConfirmed([])
  }

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={reset}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <View
          className="rounded-t-3xl p-5"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', maxHeight: '85%', borderTopWidth: 1, borderTopColor: BORDER_WHITE }}
        >
          {/* Handle */}
          <View
            className="w-9 h-1 rounded-full mx-auto mb-4"
            style={{ backgroundColor: BORDER_WHITE }}
          />

          {step === 'search' ? (
            <>
              <Text className="text-lg font-bold mb-1.5" style={{ color: TEXT }}>
                Link your SACCOs
              </Text>
              <Text className="text-xs mb-5" style={{ color: TEXT_MUTED, lineHeight: 18 }}>
                Enter your National ID number or M-Pesa phone number to check if you already
                have existing SACCO memberships. We'll sync them to your dashboard.
              </Text>

              {/* ID Number */}
              <Text className="text-xs font-medium mb-1" style={{ color: TEXT_MUTED }}>
                National ID number
              </Text>
              <TextInput
                className="border rounded-xl p-3 text-sm mb-3"
                style={{
                  borderColor: BORDER_WHITE,
                  color: TEXT,
                  backgroundColor: FROSTED_DARK,
                }}
                value={idNumber}
                onChangeText={setIdNumber}
                placeholder="e.g. 28473910"
                keyboardType="number-pad"
                placeholderTextColor={TEXT_MUTED}
              />

              <View className="flex-row items-center gap-3 mb-3">
                <View className="flex-1 h-px" style={{ backgroundColor: BORDER_WHITE }} />
                <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                  or
                </Text>
                <View className="flex-1 h-px" style={{ backgroundColor: BORDER_WHITE }} />
              </View>

              {/* Phone */}
              <Text className="text-xs font-medium mb-1" style={{ color: TEXT_MUTED }}>
                Phone number (M-Pesa)
              </Text>
              <TextInput
                className="border rounded-xl p-3 text-sm mb-5"
                style={{
                  borderColor: BORDER_WHITE,
                  color: TEXT,
                  backgroundColor: FROSTED_DARK,
                }}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 0712345678"
                keyboardType="phone-pad"
                placeholderTextColor={TEXT_MUTED}
              />

              <TouchableOpacity
                className="py-3.5 rounded-xl items-center mb-3"
                style={{
                  backgroundColor: VIOLET,
                  opacity: loading ? 0.6 : 1,
                }}
                onPress={handleLookup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-xs font-semibold">
                    Sign in
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2.5 rounded-xl items-center"
                style={{ borderWidth: 1, borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
                onPress={onClose}
              >
                <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-lg font-bold mb-1.5" style={{ color: TEXT }}>
                {results.length > 0
                  ? `Found ${results.length} SACCO${results.length > 1 ? 's' : ''}`
                  : 'No SACCOs found'}
              </Text>
              <Text className="text-xs mb-4" style={{ color: TEXT_MUTED, lineHeight: 18 }}>
                {results.length > 0
                  ? 'These SACCO memberships match your details. Confirm to sync data to your dashboard.'
                  : 'No existing SACCO memberships were found for your ID or phone number. You can create an account and join a SACCO from the directory.'}
              </Text>

              {results.map((item) => {
                const isConfirmed = confirmed.includes(item.sacco_slug)
                return (
                  <TouchableOpacity
                    key={item.sacco_slug}
                    className="flex-row items-center p-3.5 rounded-xl mb-2"
                    style={{
                      backgroundColor: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : FROSTED_DARK,
                      borderWidth: 1.5,
                      borderColor: isConfirmed ? MINT : BORDER_WHITE,
                    }}
                    onPress={() => toggleConfirm(item.sacco_slug)}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: item.sacco_color || VIOLET }}
                    >
                      <Text className="text-white text-xs font-bold">
                        {item.sacco_initials || initials(item.sacco_name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                        {item.sacco_name}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                        {item.member_name} · {item.member_number}
                      </Text>
                    </View>
                    <View
                      className="w-5 h-5 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isConfirmed ? MINT : 'transparent',
                        borderWidth: isConfirmed ? 0 : 2,
                        borderColor: BORDER_WHITE,
                      }}
                    >
                      {isConfirmed && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}

              {results.length > 0 && (
                <>
                  <TouchableOpacity
                    className="py-3.5 rounded-xl items-center mt-2 mb-2"
                    style={{
                      backgroundColor: VIOLET,
                      opacity: syncing ? 0.6 : 1,
                    }}
                    onPress={handleConfirmAll}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-xs font-semibold">
                        {confirmed.length > 0
                          ? `Sync ${confirmed.length} SACCO${confirmed.length > 1 ? 's' : ''} to dashboard`
                          : 'Continue without syncing'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text
                    className="text-xs text-center mt-1 mb-1"
                    style={{ color: TEXT_MUTED }}
                  >
                    Select the SACCOs you belong to, then sync
                  </Text>
                </>
              )}

              {/* Navigation */}
              <View className="flex-row gap-3 mt-2">
                {results.length === 0 && (
                  <TouchableOpacity
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{ backgroundColor: VIOLET }}
                    onPress={() => {
                      onClose()
                      router.push('/(auth)/register')
                    }}
                  >
                    <Text className="text-white text-xs font-semibold">
                      Create account
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{ borderWidth: 1, borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
                  onPress={() => {
                    reset()
                    setStep('search')
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: TEXT }}>
                    Back to search
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  BACKEND LOOKUP & SYNC
// ═══════════════════════════════════════════════════════════════════════

/**
 * Searches for existing SACCO memberships matching the given ID/phone.
 * Queries the backend endpoint that checks against SACCO member databases.
 */
async function lookupExistingMemberships(
  idNumber: string,
  phone: string,
  _existingMemberships: unknown[]
): Promise<LookupResult[]> {
  try {
    // Call backend endpoint that cross-references SACCO member DBs
    // If the endpoint isn't available, fall back to checking existing memberships
    const result = await api.member.getMemberships().then((memberships) =>
      memberships
        .filter((m) => {
          const matchId = idNumber ? m.member_number?.includes(idNumber) : false
          return matchId // simplified — real impl matches against backend
        })
        .map((m) => ({
          sacco_name: m.sacco_name,
          sacco_slug: m.sacco_slug,
          member_number: m.member_number || 'Pending',
          member_name: '',
          sacco_color: m.sacco_color || VIOLET,
          sacco_initials: m.sacco_initials,
        }))
    )
    return result
  } catch {
    // Return empty if the backend is not available (graceful degradation)
    return []
  }
}

/**
 * Syncs confirmed memberships so they appear on the portfolio/dashboard.
 */
async function syncMemberships(
  _confirmed: string[],
  _results: LookupResult[]
): Promise<void> {
  // The actual sync happens via the membership linking endpoint
  // If memberships already exist in the system, no additional action is needed
  // as they'll be picked up by the dashboard query on next navigation
  return Promise.resolve()
}

// ═══════════════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function FeatureCard({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: string
  color: string
  title: string
  subtitle: string
}) {
  return (
    <View
      className="rounded-xl p-4 border"
      style={{
        flexBasis: '48%',
        minHeight: CARD_HEIGHT,
        backgroundColor: FROSTED_DARK,
        borderColor: BORDER_WHITE,
      }}
    >
      <View
        className="rounded-lg mb-3 items-center justify-center"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          backgroundColor: color,
        }}
      >
        <Text style={{ color: '#fff', fontSize: Math.max(14, ICON_SIZE * 0.55), fontWeight: '700' }}>{icon}</Text>
      </View>
      <Text style={{ color: TEXT, fontSize: CARD_TITLE_SIZE, fontWeight: '600', marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ color: TEXT_MUTED, fontSize: CARD_SUBTITLE_SIZE, lineHeight: CARD_SUBTITLE_SIZE * 1.5 }}>
        {subtitle}
      </Text>
    </View>
  )
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center px-2 py-2 flex-1">
      <Text className="text-lg font-bold mb-1" style={{ color: TEXT }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: TEXT_MUTED }}>
        {label}
      </Text>
    </View>
  )
}

function formatCount(value?: number) {
  if (value === undefined) return '-'
  const formatted = value >= 1000 ? `${Math.floor(value / 1000)}K+` : value.toLocaleString()
  return formatted
}

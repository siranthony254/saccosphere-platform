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
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { usePublicStats } from '../hooks/usePublicStats'
import { useMemberships } from '../hooks/useMembership'
import { api } from '@saccosphere/api-client'
import { Icon } from '../components/ui/Icon'
import { useTheme } from '../theme/ThemeProvider'
import { AppBackground } from '../theme/AppBackground'

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
const TOP_BAR_SURFACE = 'rgba(8, 12, 28, 0.96)'

export default function LandingScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: stats } = usePublicStats()

  const totalSaccos = formatCount(stats?.total_saccos)
  const totalMembers = formatCount(stats?.total_members_on_app)

  return (
    <>
      <StatusBar style="light" translucent />
      <AppBackground>
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
              style={{ backgroundColor: c.accent }}
            >
              <Text className="text-white font-bold text-xs">S</Text>
            </View>
            <Text
              className="font-bold text-lg"
              style={{ color: c.text, fontFamily: 'Fraunces_700Bold' }}
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
              backgroundColor: c.surfaceAlt,
              borderWidth: 1,
              borderColor: c.border,
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
                <Text className="text-xs font-semibold" style={{ color: c.text }}>
                  SASRA regulated · CBK licensed
                </Text>
              </View>

              {/* Hero heading */}
              <Text
                className="text-center mb-3"
                style={{ color: c.text, fontSize: 28, fontWeight: '800', lineHeight: 38 }}
              >
                The Future of{' '}
                <Text style={{ color: c.accent }}>SACCOs</Text>
              </Text>

              {/* CTA buttons */}
              <View className="flex-row gap-2.5 justify-center w-full">
                <TouchableOpacity
                  className="flex-1 py-3 px-5 rounded-xl items-center"
                  style={{ backgroundColor: c.accent }}
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
                  <Text className="text-xs font-semibold" style={{ color: c.text }}>
                    Log in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Feature grid — always 2 columns ── */}
            <View className="py-2 w-full">
              <Text
                className="text-xs font-semibold text-center mb-4 tracking-widest uppercase"
                style={{ color: c.textMuted }}
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
                  color={c.success}
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
                  color={c.accent}
                  title={`${totalSaccos} SACCOs`}
                  subtitle="Browse & apply to new ones"
                />
              </View>
            </View>

                
            <View className="h-28" />
          </View>
        </ScrollView>

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
            borderColor: c.border,
            paddingVertical: 28,
            paddingHorizontal: 28,
            paddingBottom: 28 + insets.bottom,
            marginHorizontal: 0,
            elevation: 8,
            ...Platform.select({
              web: { boxShadow: '0px 10px 24px rgba(0,0,0,0.08)' },
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
              },
            }),
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
      </AppBackground>

    </>
  )
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
  const { colors: c } = useTheme()
  return (
    <View
      className="rounded-xl p-4 border"
      style={{
        flexBasis: '48%',
        minHeight: CARD_HEIGHT,
        backgroundColor: c.surface,
        borderColor: c.border,
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
      <Text style={{ color: c.text, fontSize: CARD_TITLE_SIZE, fontWeight: '600', marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: CARD_SUBTITLE_SIZE, lineHeight: CARD_SUBTITLE_SIZE * 1.5 }}>
        {subtitle}
      </Text>
    </View>
  )
}

function TrustStat({ value, label }: { value: string; label: string }) {
  const { colors: c } = useTheme()
  return (
    <View className="items-center px-2 py-2 flex-1">
      <Text className="text-lg font-bold mb-1" style={{ color: c.text }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: c.textMuted }}>
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

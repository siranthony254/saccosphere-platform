import { useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import type { Dashboard, Membership, Transaction } from '@saccosphere/schemas'
import { useDashboard } from '../../hooks/useDashboard'
import { useLoans } from '../../hooks/useLoans'
import { useMemberships } from '../../hooks/useMembership'
import { usePublicStats } from '../../hooks/usePublicStats'
import { useCurrentUser } from '../../store/useAuthStore'
import { useSaccoViewStore } from '../../store/useSaccoViewStore'
import SaccoSelectModal from '../SaccoSelectModal'
import { DeepSpaceBackground } from '../DeepSpaceBackground'
import {
  getActiveMemberships,
  getDisplayName,
  getInitials,
  getMembershipSavings,
  getPendingMemberships,
} from '../../lib/membership'
import { Badge } from '../ui/Badge'
import { Icon, type IconName } from '../ui/Icon'
import { BalanceToggle } from '../ui/BalanceToggle'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

type QuickAction = 'contribute' | 'loan' | 'statement' | 'repay'

// ─── Brand palette constants ──────────────────────────────────────────────
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function HomeScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const dashboardQuery = useDashboard()
  const membershipsQuery = useMemberships()
  const { data: publicStats } = usePublicStats()
  const { setActiveSacco } = useSaccoViewStore()
  const user = useCurrentUser()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<QuickAction | null>(null)

  // Use membershipsQuery as the authoritative source for context switching.
  // Fall back to dashboard memberships only while membershipsQuery hasn't responded yet.
  const allMemberships = useMemo(() => {
    if (membershipsQuery.data !== undefined) return membershipsQuery.data
    return dashboardQuery.data?.memberships ?? []
  }, [dashboardQuery.data?.memberships, membershipsQuery.data])

  const activeMemberships = useMemo(() => getActiveMemberships(allMemberships), [allMemberships])
  const pendingMemberships = useMemo(() => getPendingMemberships(allMemberships), [allMemberships])
  const activeSlugs = useMemo(() => new Set(activeMemberships.map((m) => m.sacco_slug)), [activeMemberships])
  const dashboard = useMemo(() => {
    if (!dashboardQuery.data) {
      return {
        total_balance: 0,
        total_savings: 0,
        active_loans_balance: 0,
        sacco_count: 0,
        memberships: [],
        recent_transactions: [],
      }
    }
    return dashboardQuery.data
  }, [dashboardQuery.data])

  // Show spinner until we have a definitive answer on memberships (the context gate).
  const isLoading = membershipsQuery.isLoading || (membershipsQuery.data === undefined && dashboardQuery.isLoading)
  const isRefreshing = dashboardQuery.isRefetching || membershipsQuery.isRefetching
  const isError = membershipsQuery.isError && membershipsQuery.data === undefined

  const refetch = async () => {
    await Promise.all([dashboardQuery.refetch(), membershipsQuery.refetch()])
  }

  const handleQuickAction = (action: QuickAction) => {
    if (activeMemberships.length === 0) {
      router.push('/(member)/discover')
      return
    }
    if (action === 'repay') {
      router.push('/(member)/loan-repayment')
      return
    }
    if (action === 'loan') {
      router.push({ pathname: '/sacco/[slug]/loans', params: { slug: activeMemberships[0].sacco_slug } })
      return
    }
    if (activeMemberships.length === 1) {
      navigateToSaccoAction(action, activeMemberships[0].sacco_slug)
      return
    }
    setCurrentAction(action)
    setPickerVisible(true)
  }

  const handleSaccoSelect = (slug: string) => {
    setActiveSacco(slug)
    router.push({ pathname: '/sacco/[slug]', params: { slug } })
  }

  if (isLoading) {
    return (
      <DeepSpaceBackground>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={['bottom', 'left', 'right']}>
          <ActivityIndicator color={c.success} size="small" />
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>Loading your dashboard...</Text>
        </SafeAreaView>
      </DeepSpaceBackground>
    )
  }

  if (isError) {
    return (
      <DeepSpaceBackground>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }} edges={['bottom', 'left', 'right']}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8 }}>Could not load your SACCOs</Text>
          <Text style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', marginBottom: 20 }}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Try again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </DeepSpaceBackground>
    )
  }

  const name = getDisplayName(user?.first_name, user?.last_name)
  const initials = getInitials(user?.first_name, user?.last_name)
  const isMorning = new Date().getHours() < 12
  const greeting = isMorning ? 'Good morning' : 'Good afternoon'

  return (
    <DeepSpaceBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={c.success} colors={[c.success]} />
          }
        >
        {/* ── Top bar ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: c.bg,
            borderBottomWidth: 0.5,
            borderBottomColor: c.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: 10, color: c.textMuted, fontWeight: '500' }}>{greeting}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>{name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(member)/notifications')}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Icon name="bell" size={16} color={c.text} />
              <View
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: c.bg,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(member)/profile')}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Dashboard content ── */}
        <View style={{ padding: 16 }}>
          {activeMemberships.length > 0 && pendingMemberships.length > 0 ? (
            <PendingBanner pendingMemberships={pendingMemberships} />
          ) : null}

          {activeMemberships.length === 0 && pendingMemberships.length === 0 ? (
            <NoSaccoDashboard publicStats={publicStats} />
          ) : activeMemberships.length === 0 ? (
            <PendingOnlyDashboard pendingMemberships={pendingMemberships} />
          ) : activeMemberships.length === 1 ? (
            <SingleSaccoDashboard
              membership={activeMemberships[0]}
              transactions={dashboard.recent_transactions}
              onAction={handleQuickAction}
              onViewDetail={() => handleSaccoSelect(activeMemberships[0].sacco_slug)}
            />
          ) : (
            <UnifiedDashboard
              dashboard={dashboard}
              memberships={activeMemberships}
              onAction={handleQuickAction}
              onSelectSacco={handleSaccoSelect}
            />
          )}
        </View>
      </ScrollView>
      <SaccoSelectModal
        visible={pickerVisible}
        onClose={() => {
          setPickerVisible(false)
          setCurrentAction(null)
        }}
        onSelect={(slug) => {
          if (currentAction) navigateToSaccoAction(currentAction, slug)
        }}
        title={
          currentAction === 'contribute' || currentAction === 'repay'
            ? 'Make Contribution'
            : currentAction === 'loan'
              ? 'Apply for Loan'
              : 'View Statement'
        }
        subtitle="Select one of your active SACCOs to continue"
      />
      </SafeAreaView>
    </DeepSpaceBackground>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  NO SACCO — Screen 26
// ═══════════════════════════════════════════════════════════════════════════

function NoSaccoDashboard({ publicStats }: { publicStats: { total_saccos?: number; total_members_on_app?: number } | undefined }) {
  const { colors: c } = useTheme()
  const saccoCount = publicStats?.total_saccos ?? 0

  return (
    <View>
      {/* ── Empty state hero ── */}
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: c.border,
          borderRadius: 16,
          paddingVertical: 32,
          paddingHorizontal: 18,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: 'rgba(109, 40, 217, 0.15)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Icon name="bank" size={28} color={c.accent} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6 }}>
          No SACCOs linked yet
        </Text>
        <Text
          style={{
            fontSize: 12, color: c.textMuted, lineHeight: 20,
            textAlign: 'center', marginBottom: 20, paddingHorizontal: 8,
          }}
        >
          Join a SACCO to start saving, get loans, and grow your money. Saccosphere connects you to {saccoCount > 0 ? saccoCount.toLocaleString() : 'registered'} SACCOs.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(member)/discover')}
          style={{
            backgroundColor: c.accent, borderRadius: 12,
            paddingVertical: 12, width: '100%', alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
            Browse & join a SACCO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(member)/discover')}
          style={{
            backgroundColor: c.surfaceAlt, borderRadius: 12,
            paddingVertical: 12, width: '100%', alignItems: 'center',
          }}
        >
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '500' }}>
            Link existing membership
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
//  PENDING ONLY

// ═══════════════════════════════════════════════════════════════════════════

function PendingOnlyDashboard({ pendingMemberships }: { pendingMemberships: Membership[] }) {
  const { colors: c } = useTheme()
  const primary = pendingMemberships[0]

  return (
    <View>
      <View
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderWidth: 1,
          borderColor: '#F59E0B',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FDBA74', marginBottom: 4 }}>
          Application under review
        </Text>
        <Text style={{ fontSize: 12, color: c.textMuted, lineHeight: 20, marginBottom: 10 }}>
          {primary?.sacco_name ?? 'Your SACCO'} is reviewing your application. You can keep browsing other SACCOs while you wait.
        </Text>
        <InfoRow label="Reference" value={primary?.member_number || primary?.id || 'Pending'} />
        <InfoRow label="Submitted" value={formatDate(primary?.applied_at)} />
        <InfoRow label="Status" value={formatMembershipStatus(primary?.status)} />
      </View>

      <View
        style={{
          backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 14, marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
          Application Tracker
        </Text>
        <TrackerStep label="Submitted" active />
        <TrackerStep label="Under review" active={primary?.status === 'under_review'} />
        <TrackerStep label="Decision" />
      </View>

      {pendingMemberships.length > 1 ? (
        <View
          style={{
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14, marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: c.textMuted, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
            Other Applications
          </Text>
          {pendingMemberships.slice(1).map((m) => (
            <InfoRow key={m.id} label={m.sacco_name} value={formatMembershipStatus(m.status)} />
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        onPress={() => router.push('/(member)/discover')}
        style={{
          backgroundColor: c.accent, borderRadius: 12,
          paddingVertical: 12, alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
          Browse more SACCOs
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function PendingBanner({ pendingMemberships }: { pendingMemberships: Membership[] }) {
  const { colors: c } = useTheme()
  const names = pendingMemberships.map((m) => m.sacco_name).join(', ')
  return (
    <View
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FDBA74' }}>Pending application</Text>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
        {names} {pendingMemberships.length === 1 ? 'is' : 'are'} under review. Active SACCOs remain available below.
      </Text>
    </View>
  )
}

//  SINGLE SACCO 

function SingleSaccoDashboard({
  membership,
  transactions,
  onAction,
  onViewDetail,
}: {
  membership: Membership
  transactions: Transaction[]
  onAction: (action: QuickAction) => void
  onViewDetail?: () => void
}) {
  const { colors: c, isDark } = useTheme()
  const overlayGlow = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const overlayGlowSoft = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const money = useMoney()
  const { data: loans = [] } = useLoans({ sacco: membership.sacco_slug })
  const activeLoan = loans.find((l) => l.status === 'active' || l.status === 'disbursed' || l.status === 'approved')
  const totalSavings = getMembershipSavings(membership)

  return (
    <View>
      {/* ── Balance hero card — tap to view SACCO detail ── */}
      <TouchableOpacity
        onPress={onViewDetail}
        activeOpacity={onViewDetail ? 0.85 : 1}
        style={{
          backgroundColor: c.card,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 20,
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: overlayGlow,
          }}
        />
        <View
          style={{
            position: 'absolute', bottom: -40, left: 20,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: overlayGlowSoft,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text
            style={{
              fontSize: 10, color: c.textMuted,
              letterSpacing: 0.6, textTransform: 'uppercase',
            }}
          >
            Total savings — {membership.sacco_name.toUpperCase()}
          </Text>
          {onViewDetail && (
            <View className="flex-row items-center gap-1">
              <Text style={{ fontSize: 10, color: c.textFaint, letterSpacing: 0.3 }}>View detail</Text>
              <Icon name="arrow-right" size={10} color={c.textFaint} />
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 30, fontWeight: '700', color: c.text, lineHeight: 34,
            }}
          >
            {money(totalSavings + membership.share_capital)}
          </Text>
          <BalanceToggle />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <StatLight label="BOSA" value={money(membership.bosa_balance)} />
          <StatLight label="FOSA" value={money(membership.fosa_balance)} />
          <StatLight label="Loan limit" value={money(membership.loan_limit)} />
        </View>
      </TouchableOpacity>

      {/* ── Quick actions ── */}
      <QuickActions onAction={onAction} isSingle />

      {/* ── Account breakdown ── */}
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 14,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: c.text, marginBottom: 8 }}>
          Account breakdown
        </Text>
        <InfoRow label="BOSA savings" value={money(membership.bosa_balance)} />
        <InfoRow label="FOSA savings" value={money(membership.fosa_balance)} />
        <InfoRow label="Share capital" value={money(membership.share_capital)} />

        <InfoRow
          label="Loan limit"
          value={money(membership.loan_limit)}
          valueColor={c.success}
        />
      </View>

      {/* ── Active loan card ── */}
      {activeLoan ? (
        <View
          style={{
            backgroundColor: c.surface,
            borderWidth: 1, borderColor: c.border,
            borderRadius: 14, padding: 14,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>Active loan</Text>
            <Badge
              label={activeLoan.status === 'active' || activeLoan.status === 'disbursed' ? 'In repayment' : 'Approved'}
              variant="warning"
            />
          </View>
          <InfoRow label={activeLoan.loan_product_label} value={money(activeLoan.amount_requested)} />
          <View
            style={{
              height: 5, backgroundColor: c.surfaceAlt, borderRadius: 3,
              overflow: 'hidden', marginTop: 6, marginBottom: 4,
            }}
          >
            <View
              style={{
                height: '100%', backgroundColor: c.success, borderRadius: 3,
                width: `${getLoanProgress(activeLoan.amount_requested, activeLoan.balance_remaining)}%`,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row', justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 10, color: c.textMuted }}>
              {getLoanProgress(activeLoan.amount_requested, activeLoan.balance_remaining)}% repaid
            </Text>
            <Text style={{ fontSize: 10, color: c.textMuted }}>
              Remaining: {money(activeLoan.balance_remaining)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/sacco/[slug]/pay',
                params: { slug: membership.sacco_slug, type: 'repayment', loanId: activeLoan.id },
              })
            }
            style={{
              backgroundColor: c.accent, borderRadius: 12,
              paddingVertical: 10, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              Pay instalment via M-Pesa
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Recent activity ── */}
      <RecentTransactions transactions={transactions} title="Recent activity" />
    </View>
  )
}

//  UNIFIED (multi-SACCO)

function UnifiedDashboard({
  dashboard,
  memberships,
  onAction,
  onSelectSacco,
}: {
  dashboard: Dashboard
  memberships: Membership[]
  onAction: (action: QuickAction) => void
  onSelectSacco: (slug: string) => void
}) {
  const { colors: c, isDark } = useTheme()
  const overlayGlow = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const overlayGlowSoft = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const money = useMoney()
  return (
    <View>
      {/* ── Total portfolio hero card ── */}
      <View
        style={{
          backgroundColor: c.card,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 20,
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: overlayGlow,
          }}
        />
        <View
          style={{
            position: 'absolute', bottom: -40, left: 20,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: overlayGlowSoft,
          }}
        />
        <Text
          style={{
            fontSize: 10, color: c.textMuted,
            letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
          }}
        >
          Total portfolio value
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 30, fontWeight: '700', color: c.text, lineHeight: 34,
            }}
          >
            {money(dashboard.total_balance)}
          </Text>
          <BalanceToggle />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <StatLight label="Savings" value={money(dashboard.total_savings)} />
          <StatLight label="Active loans" value={money(dashboard.active_loans_balance)} />
          <StatLight label="SACCOs" value={`${memberships.length} linked`} />
        </View>
      </View>

      {/* ── Quick actions ── */}
      <QuickActions onAction={onAction} isSingle={false} />

      {/* ── My SACCOs ── */}
      <Text
        style={{
          fontSize: 10, fontWeight: '600', letterSpacing: 0.6,
          color: c.textMuted, marginBottom: 8, marginTop: 4, textTransform: 'uppercase',
        }}
      >
        My SACCOs
      </Text>
      {memberships.map((membership) => (
        <SaccoRow
          key={membership.id}
          membership={membership}
          onPress={() => onSelectSacco(membership.sacco_slug)}
        />
      ))}
      <TouchableOpacity
        onPress={() => router.push('/(member)/discover')}
        style={{ paddingVertical: 10, marginBottom: 12 }}
      >
        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
          + Add another SACCO
        </Text>
      </TouchableOpacity>

      {/* ── Recent activity ── */}
      <RecentTransactions transactions={dashboard.recent_transactions} title="Recent activity — all active SACCOs" />
    </View>
  )
}

//  SHARED COMPONENTS

function QuickActions({
  onAction,
  isSingle,
}: {
  onAction: (action: QuickAction) => void
  isSingle: boolean
}) {
  if (isSingle) {
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <QuickActionButton label="Contribute" icon="card" tone="mint" onPress={() => onAction('contribute')} />
        <QuickActionButton label="Apply loan" icon="loan" tone="blue" onPress={() => onAction('loan')} />
        <QuickActionButton label="Statement" icon="file" tone="amber" onPress={() => onAction('statement')} />
        <QuickActionButton label="Add SACCO" icon="plus" tone="violet" onPress={() => router.push('/(member)/discover')} />
      </View>
    )
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 16,
      }}
    >
      <QuickActionButton label="Contribute" icon="card" tone="mint" onPress={() => onAction('contribute')} />
      <QuickActionButton label="Pay loan" icon="withdraw" tone="blue" onPress={() => onAction('repay')} />
      <QuickActionButton label="Apply loan" icon="loan" tone="amber" onPress={() => onAction('loan')} />
      <QuickActionButton label="Statement" icon="file" tone="violet" onPress={() => onAction('statement')} />
    </View>
  )
}

function QuickActionButton({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string
  icon: IconName
  tone: 'mint' | 'blue' | 'amber' | 'violet'
  onPress: () => void
}) {
  const { colors: c } = useTheme()
  const bgMap = {
    mint: 'rgba(16, 185, 129, 0.08)',
    blue: 'rgba(37, 99, 235, 0.06)',
    amber: 'rgba(245, 158, 11, 0.08)',
    violet: 'rgba(109, 40, 217, 0.08)',
  }

  const iconColor = {
    mint: '#10B981',
    blue: '#2563EB',
    amber: '#D97706',
    violet: '#6D28D9',
  }

  return (
    <TouchableOpacity style={{ alignItems: 'center', flex: 1 }} onPress={onPress}>
      <View
        style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: bgMap[tone],
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Icon name={icon} size={20} color={iconColor[tone]} />
      </View>
      <Text style={{ fontSize: 9, fontWeight: '500', color: c.textMuted, textAlign: 'center', lineHeight: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function SaccoRow({ membership, onPress }: { membership: Membership; onPress: () => void }) {
  const { colors: c } = useTheme()
  const money = useMoney()
  const totalSavings = getMembershipSavings(membership)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        padding: 13,
        marginBottom: 10,
      }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: membership.sacco_color || c.accent,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
          {membership.sacco_initials || 'SA'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{membership.sacco_name}</Text>
        <Text style={{ fontSize: 10, color: c.textMuted }}>
          Member No. {membership.member_number || 'Pending'}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{money(totalSavings)}</Text>
        <Text style={{ fontSize: 9, color: c.textMuted }}>Savings</Text>
      </View>
      <Icon name="arrow-right" size={14} color={c.textMuted} />
    </TouchableOpacity>
  )
}

function RecentTransactions({ transactions, title }: { transactions: Transaction[]; title: string }) {
  const { colors: c } = useTheme()
  return (
    <View>
      <Text
        style={{
          fontSize: 10, fontWeight: '600', letterSpacing: 0.6,
          color: c.textMuted, marginBottom: 8, textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: c.surface,
          borderWidth: 1, borderColor: c.border,
          borderRadius: 14, padding: 12,
        }}
      >
        {transactions.length > 0 ? (
          transactions.map((txn) => <TransactionRow key={txn.id} transaction={txn} />)
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>
            No recent activity yet.
          </Text>
        )}
      </View>
    </View>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const { colors: c } = useTheme()
  const money = useMoney()
  const isCredit = transaction.direction === 'credit'
  const type = transaction.txn_type.toLowerCase()

  const getIcon = (): IconName => {
    if (type === 'contribution' || type === 'deposit') return 'savings'
    if (type === 'loan_repayment') return 'withdraw'
    if (type === 'loan_disbursement') return 'loan'
    if (type === 'withdrawal') return 'withdraw'
    if (type === 'transfer') return 'transfer'
    if (type === 'dividend') return 'dividend'
    return 'card'
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        borderBottomWidth: 0.5,
        borderBottomColor: c.border,
      }}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(220, 38, 38, 0.15)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name={getIcon()} size={16} color={isCredit ? c.success : '#F87171'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: c.text }}>
          {transaction.description}
        </Text>
        <Text style={{ fontSize: 10, color: c.textMuted }}>
          {transaction.sacco_name} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 12, fontWeight: '600',
          color: isCredit ? c.success : '#F87171',
        }}
      >
        {isCredit ? '+' : '-'}{money(transaction.amount)}
      </Text>
    </View>
  )
}

function StatLight({ label, value }: { label: string; value: string }) {
  const { colors: c } = useTheme()
  return (
    <View>
      <Text style={{ fontSize: 9, color: c.textMuted, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>{value}</Text>
    </View>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const { colors: c } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 7,
        borderBottomWidth: 0.5,
        borderBottomColor: c.border,
      }}
    >
      <Text style={{ fontSize: 11, color: c.textMuted }}>{label}</Text>
      <Text
        style={{
          fontSize: 11, fontWeight: '600', color: valueColor ?? c.text,
          textAlign: 'right', flex: 1, marginLeft: 12,
        }}
      >
        {value}
      </Text>
    </View>
  )
}

function TrackerStep({ label, active }: { label: string; active?: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: active ? c.success : c.surfaceAlt,
          borderWidth: active ? 0 : 1,
          borderColor: c.border,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {active ? (
          <Icon name="check" size={12} color="#fff" />
        ) : (
          <View className="w-1 h-1 rounded-full" style={{ backgroundColor: c.textFaint }} />
        )}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? c.text : c.textMuted }}>
        {label}
      </Text>
    </View>
  )
}

//  HELPERS
function navigateToSaccoAction(action: QuickAction, slug: string) {
  if (action === 'contribute') {
    router.push({ pathname: '/sacco/[slug]/pay', params: { slug } })
    return
  }
  if (action === 'repay') {
    router.push('/(member)/loan-repayment')
    return
  }
  if (action === 'loan') {
    router.push({ pathname: '/sacco/[slug]/loans', params: { slug } })
    return
  }
  router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })
}

function formatDate(value?: string | null) {
  if (!value) return 'Pending'
  return new Date(value).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMembershipStatus(status?: string) {
  if (!status) return 'Pending'
  return status.replace(/_/g, ' ')
}

function getLoanProgress(amountRequested?: number, balanceRemaining?: number) {
  if (!amountRequested || amountRequested <= 0) return 0
  const repaid = amountRequested - Number(balanceRemaining ?? 0)
  return Math.max(0, Math.min(100, Math.round((repaid / amountRequested) * 100)))
}

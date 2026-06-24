import { useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import type { Dashboard, Membership, Transaction } from '@saccosphere/schemas'
import { useDashboard } from '../../hooks/useDashboard'
import { useLoans } from '../../hooks/useLoans'
import { useMemberships } from '../../hooks/useMembership'
import { usePublicStats } from '../../hooks/usePublicStats'
import { useCurrentUser } from '../../store/useAuthStore'
import { useSaccoViewStore } from '../../store/useSaccoViewStore'
import SaccoSelectModal from '../SaccoSelectModal'
import {
  getActiveMemberships,
  getDisplayName,
  getInitials,
  getMembershipSavings,
  getPendingMemberships,
} from '../../lib/membership'

type QuickAction = 'contribute' | 'loan' | 'statement' | 'repay'

const money = (value?: number | null) => `KES ${Number(value ?? 0).toLocaleString('en-KE')}`

// ─── Brand palette constants ──────────────────────────────────────────────
const NAVY = '#06091A'
const VIOLET = '#6D28D9'
const MINT = '#10B981'
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
  const dashboardQuery = useDashboard()
  const membershipsQuery = useMemberships()
  const { data: publicStats } = usePublicStats()
  const { setActiveSacco } = useSaccoViewStore()
  const user = useCurrentUser()
  const [pickerVisible, setPickerVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<QuickAction | null>(null)

  const allMemberships = useMemo(() => {
    const memberships = membershipsQuery.data ?? []
    return memberships.length > 0 ? memberships : dashboardQuery.data?.memberships ?? []
  }, [dashboardQuery.data?.memberships, membershipsQuery.data])

  const activeMemberships = useMemo(() => getActiveMemberships(allMemberships), [allMemberships])
  const pendingMemberships = useMemo(() => getPendingMemberships(allMemberships), [allMemberships])
  const activeSlugs = useMemo(() => new Set(activeMemberships.map((m) => m.sacco_slug)), [activeMemberships])
  const dashboard = useMemo(
    () => buildDashboard(dashboardQuery.data, activeMemberships, activeSlugs),
    [activeMemberships, activeSlugs, dashboardQuery.data]
  )

  const isLoading = dashboardQuery.isLoading && membershipsQuery.isLoading
  const isRefreshing = dashboardQuery.isRefetching || membershipsQuery.isRefetching

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
      <View style={{ flex: 1, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={MINT} size="small" />
        <Text style={{ color: INK_MUTED, fontSize: 12, marginTop: 12 }}>Loading your dashboard...</Text>
      </View>
    )
  }

  const name = getDisplayName(user?.first_name, user?.last_name)
  const initials = getInitials(user?.first_name, user?.last_name)
  const isMorning = new Date().getHours() < 12
  const greeting = isMorning ? 'Good morning' : 'Good afternoon'

  return (
    <>
      <ScrollView
        style={{ backgroundColor: SURFACE2 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor={MINT} colors={[MINT]} />
        }
      >
        {/* ── Top bar ── */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: SURFACE,
            borderBottomWidth: 0.5,
            borderBottomColor: BORDER,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={{ fontSize: 10, color: INK_FAINT, fontWeight: '500' }}>{greeting}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: INK }}>{name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(member)/notifications')}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: SURFACE3, alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Text style={{ fontSize: 13 }}>🔔</Text>
              <View
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: SURFACE,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(member)/profile')}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center',
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
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  NO SACCO — Screen 26
// ═══════════════════════════════════════════════════════════════════════════

function NoSaccoDashboard({ publicStats }: { publicStats: { total_saccos?: number; total_members_on_app?: number } | undefined }) {
  const saccoCount = publicStats?.total_saccos ?? 237
  publicStats?.total_members_on_app // available for future use

  return (
    <View>
      {/* ── Empty state hero ── */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: BORDER_MID,
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
            backgroundColor: 'rgba(109, 40, 217, 0.1)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 28 }}>🏦</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginBottom: 6 }}>
          No SACCOs linked yet
        </Text>
        <Text
          style={{
            fontSize: 12, color: INK_MUTED, lineHeight: 20,
            textAlign: 'center', marginBottom: 20, paddingHorizontal: 8,
          }}
        >
          Join a SACCO to start saving, get loans, and grow your money. Saccosphere connects you to {saccoCount.toLocaleString()} registered SACCOs.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(member)/discover')}
          style={{
            backgroundColor: VIOLET, borderRadius: 12,
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
            backgroundColor: SURFACE3, borderRadius: 12,
            paddingVertical: 12, width: '100%', alignItems: 'center',
          }}
        >
          <Text style={{ color: INK_SOFT, fontSize: 12, fontWeight: '500' }}>
            Link existing membership
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Why join benefit cards ── */}
      <Text
        style={{
          fontSize: 10, fontWeight: '600', letterSpacing: 0.6,
          color: INK_FAINT, marginBottom: 10, textTransform: 'uppercase',
        }}
      >
        Why join a SACCO?
      </Text>
      <BenefitCard
        icon="💰"
        title="Borrow up to 3× your savings"
        subtitle="At rates as low as 10.5% p.a. — far below banks"
        bgColor="rgba(16, 185, 129, 0.08)"
        titleColor="#064E3B"
        subtitleColor={MINT}
      />
      <BenefitCard
        icon="📈"
        title="Earn annual dividends"
        subtitle="Your shares grow in value every year"
        bgColor="rgba(37, 99, 235, 0.06)"
        titleColor="#1E3A5F"
        subtitleColor="#2563EB"
      />
      <BenefitCard
        icon="🤝"
        title="Member-owned & trusted"
        subtitle={`All ${saccoCount.toLocaleString()} SACCOs are SASRA regulated`}
        bgColor="rgba(245, 158, 11, 0.08)"
        titleColor="#78350F"
        subtitleColor="#D97706"
      />
    </View>
  )
}

function BenefitCard({
  icon, title, subtitle, bgColor, titleColor, subtitleColor,
}: {
  icon: string
  title: string
  subtitle: string
  bgColor: string
  titleColor: string
  subtitleColor: string
}) {
  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: titleColor, marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 11, color: subtitleColor }}>{subtitle}</Text>
      </View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
//  PENDING ONLY
// ═══════════════════════════════════════════════════════════════════════════

function PendingOnlyDashboard({ pendingMemberships }: { pendingMemberships: Membership[] }) {
  const primary = pendingMemberships[0]

  return (
    <View>
      <View
        style={{
          backgroundColor: '#FEF3C7',
          borderWidth: 1,
          borderColor: '#F59E0B',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#78350F', marginBottom: 4 }}>
          Application under review
        </Text>
        <Text style={{ fontSize: 12, color: '#7a4f08', lineHeight: 20, marginBottom: 10 }}>
          {primary?.sacco_name ?? 'Your SACCO'} is reviewing your application. You can keep browsing other SACCOs while you wait.
        </Text>
        <InfoRow label="Reference" value={primary?.member_number || primary?.id || 'Pending'} />
        <InfoRow label="Submitted" value={formatDate(primary?.applied_at)} />
        <InfoRow label="Status" value={formatMembershipStatus(primary?.status)} />
      </View>

      <View
        style={{
          backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
          borderRadius: 14, padding: 14, marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '600', color: INK_FAINT, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
          Application Tracker
        </Text>
        <TrackerStep label="Submitted" active />
        <TrackerStep label="Under review" active={primary?.status === 'under_review'} />
        <TrackerStep label="Decision" />
      </View>

      {pendingMemberships.length > 1 ? (
        <View
          style={{
            backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
            borderRadius: 14, padding: 14, marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: INK_FAINT, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
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
          backgroundColor: VIOLET, borderRadius: 12,
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
  const names = pendingMemberships.map((m) => m.sacco_name).join(', ')
  return (
    <View
      style={{
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#78350F' }}>Pending application</Text>
      <Text style={{ fontSize: 11, color: '#7a4f08', marginTop: 4 }}>
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
}: {
  membership: Membership
  transactions: Transaction[]
  onAction: (action: QuickAction) => void
}) {
  const { data: loans = [] } = useLoans({ sacco: membership.sacco_slug })
  const activeLoan = loans.find((l) => l.status === 'active' || l.status === 'disbursed' || l.status === 'approved')
  const totalSavings = getMembershipSavings(membership)

  return (
    <View>
      {/* ── Balance hero card ── */}
      <View
        style={{
          backgroundColor: NAVY,
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
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
        <View
          style={{
            position: 'absolute', bottom: -40, left: 20,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        />
        <Text
          style={{
            fontSize: 10, color: 'rgba(255,255,255,0.5)',
            letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
          }}
        >
          Total savings — {membership.sacco_name.toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: 30, fontWeight: '700', color: '#fff',
            lineHeight: 34, marginBottom: 14,
          }}
        >
          {money(totalSavings + membership.share_capital)}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <StatLight label="BOSA" value={money(membership.bosa_balance)} />
          <StatLight label="FOSA" value={money(membership.fosa_balance)} />
          <StatLight label="Loan limit" value={money(membership.loan_limit)} />
        </View>
      </View>

      {/* ── Quick actions ── */}
      <QuickActions onAction={onAction} isSingle />

      {/* ── Account breakdown ── */}
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1, borderColor: BORDER,
          borderRadius: 14, padding: 14,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '600', color: INK, marginBottom: 8 }}>
          Account breakdown
        </Text>
        <InfoRow label="BOSA savings" value={money(membership.bosa_balance)} />
        <InfoRow label="FOSA savings" value={money(membership.fosa_balance)} />
        <InfoRow label="Share capital" value={money(membership.share_capital)} />
        <InfoRow label="Dividends credited" value={money(membership.total_dividends)} />
        <InfoRow
          label="Loan limit"
          value={money(membership.loan_limit)}
          valueColor={MINT}
        />
      </View>

      {/* ── Active loan card ── */}
      {activeLoan ? (
        <View
          style={{
            backgroundColor: SURFACE,
            borderWidth: 1, borderColor: BORDER,
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
            <Text style={{ fontSize: 12, fontWeight: '600', color: INK }}>Active loan</Text>
            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#78350F' }}>
                {activeLoan.status === 'active' || activeLoan.status === 'disbursed' ? 'In repayment' : 'Approved'}
              </Text>
            </View>
          </View>
          <InfoRow label={activeLoan.loan_product_label} value={money(activeLoan.amount_requested)} />
          <View
            style={{
              height: 5, backgroundColor: SURFACE3, borderRadius: 3,
              overflow: 'hidden', marginTop: 6, marginBottom: 4,
            }}
          >
            <View
              style={{
                height: '100%', backgroundColor: MINT, borderRadius: 3,
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
            <Text style={{ fontSize: 10, color: INK_FAINT }}>
              {getLoanProgress(activeLoan.amount_requested, activeLoan.balance_remaining)}% repaid
            </Text>
            <Text style={{ fontSize: 10, color: INK_FAINT }}>
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
              backgroundColor: VIOLET, borderRadius: 12,
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
  return (
    <View>
      {/* ── Total portfolio hero card ── */}
      <View
        style={{
          backgroundColor: NAVY,
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
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />
        <View
          style={{
            position: 'absolute', bottom: -40, left: 20,
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        />
        <Text
          style={{
            fontSize: 10, color: 'rgba(255,255,255,0.5)',
            letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
          }}
        >
          Total portfolio value
        </Text>
        <Text
          style={{
            fontSize: 30, fontWeight: '700', color: '#fff',
            lineHeight: 34, marginBottom: 14,
          }}
        >
          {money(dashboard.total_balance)}
        </Text>
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
          color: INK_FAINT, marginBottom: 8, marginTop: 4, textTransform: 'uppercase',
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
        <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
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
        <QuickActionButton label="Contribute" icon="💳" tone="mint" onPress={() => onAction('contribute')} />
        <QuickActionButton label="Apply loan" icon="🏦" tone="blue" onPress={() => onAction('loan')} />
        <QuickActionButton label="Statement" icon="📄" tone="amber" onPress={() => onAction('statement')} />
        <QuickActionButton label="Add SACCO" icon="➕" tone="violet" onPress={() => router.push('/(member)/discover')} />
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
      <QuickActionButton label="Contribute" icon="💳" tone="mint" onPress={() => onAction('contribute')} />
      <QuickActionButton label="Pay loan" icon="📤" tone="blue" onPress={() => onAction('repay')} />
      <QuickActionButton label="Apply loan" icon="🏦" tone="amber" onPress={() => onAction('loan')} />
      <QuickActionButton label="Statement" icon="📄" tone="violet" onPress={() => onAction('statement')} />
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
  icon: string
  tone: 'mint' | 'blue' | 'amber' | 'violet'
  onPress: () => void
}) {
  const bgMap = {
    mint: 'rgba(16, 185, 129, 0.08)',
    blue: 'rgba(37, 99, 235, 0.06)',
    amber: 'rgba(245, 158, 11, 0.08)',
    violet: 'rgba(109, 40, 217, 0.08)',
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
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 9, fontWeight: '500', color: INK_MUTED, textAlign: 'center', lineHeight: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function SaccoRow({ membership, onPress }: { membership: Membership; onPress: () => void }) {
  const totalSavings = getMembershipSavings(membership)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 14,
        padding: 13,
        marginBottom: 10,
      }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: membership.sacco_color || VIOLET,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
          {membership.sacco_initials || 'SA'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: INK }}>{membership.sacco_name}</Text>
        <Text style={{ fontSize: 10, color: INK_FAINT }}>
          {membership.sacco_slug.includes('stima') ? 'Energy sector' :
           membership.sacco_slug.includes('teacher') ? 'Education sector' :
           membership.sacco_slug.includes('unaitas') ? 'Community' :
           membership.sacco_slug.includes('police') ? 'Government' : ''} · Member {membership.member_number || membership.status}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: INK }}>{money(totalSavings)}</Text>
        <Text style={{ fontSize: 9, color: INK_FAINT }}>Savings</Text>
      </View>
      <Text style={{ fontSize: 14, color: INK_FAINT, marginLeft: 2 }}>{'>'}</Text>
    </TouchableOpacity>
  )
}

function RecentTransactions({ transactions, title }: { transactions: Transaction[]; title: string }) {
  return (
    <View>
      <Text
        style={{
          fontSize: 10, fontWeight: '600', letterSpacing: 0.6,
          color: INK_FAINT, marginBottom: 8, textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: SURFACE,
          borderWidth: 1, borderColor: BORDER,
          borderRadius: 14, padding: 12,
        }}
      >
        {transactions.length > 0 ? (
          transactions.map((txn) => <TransactionRow key={txn.id} transaction={txn} />)
        ) : (
          <Text style={{ color: INK_FAINT, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>
            No recent activity yet.
          </Text>
        )}
      </View>
    </View>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.direction === 'credit'

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
      }}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.08)',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 12, color: isCredit ? MINT : '#DC2626', fontWeight: '600' }}>
          {isCredit ? '↑' : '↓'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: INK }}>
          {transaction.description}
        </Text>
        <Text style={{ fontSize: 10, color: INK_FAINT }}>
          {transaction.sacco_name} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 12, fontWeight: '600',
          color: isCredit ? MINT : '#DC2626',
        }}
      >
        {isCredit ? '+' : '-'}{money(transaction.amount)}
      </Text>
    </View>
  )
}

function StatLight({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{value}</Text>
    </View>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 7,
        borderBottomWidth: 0.5,
        borderBottomColor: BORDER,
      }}
    >
      <Text style={{ fontSize: 11, color: INK_MUTED }}>{label}</Text>
      <Text
        style={{
          fontSize: 11, fontWeight: '600', color: valueColor ?? INK,
          textAlign: 'right', flex: 1, marginLeft: 12,
        }}
      >
        {value}
      </Text>
    </View>
  )
}

function TrackerStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View
        style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: active ? MINT : SURFACE3,
          borderWidth: active ? 0 : 1,
          borderColor: BORDER,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 10, fontWeight: '700',
            color: active ? '#fff' : INK_FAINT,
          }}
        >
          {active ? '✓' : '○'}
        </Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? INK : INK_MUTED }}>
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

function buildDashboard(
  dashboard: Dashboard | undefined,
  activeMemberships: Membership[],
  activeSlugs: Set<string>
): Dashboard {
  const totalSavings = activeMemberships.reduce((sum, m) => sum + getMembershipSavings(m), 0)
  const shareCapital = activeMemberships.reduce((sum, m) => sum + m.share_capital, 0)
  const recentTransactions = (dashboard?.recent_transactions ?? []).filter((t) =>
    activeSlugs.has(t.sacco_slug)
  )

  return {
    total_balance: Number(dashboard?.total_balance ?? 0) || totalSavings + shareCapital,
    total_savings: Number(dashboard?.total_savings ?? 0) || totalSavings,
    active_loans_balance: Number(dashboard?.active_loans_balance ?? 0),
    sacco_count: activeMemberships.length,
    memberships: activeMemberships,
    recent_transactions: recentTransactions,
  }
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

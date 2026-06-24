import { useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useLoans } from '../../../../hooks/useLoans'
import { useMemberships } from '../../../../hooks/useMembership'
import { getActiveMemberships, getMembershipSavings } from '../../../../lib/membership'

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

const SACCO_COLORS: Record<string, string> = {
  'stima-sacco': '#0070ba',
  'teachers-sacco': '#7c3aed',
  'unaitas-sacco': '#16a085',
  'kenya-police-sacco': '#c0392b',
  'imarika-sacco': '#2980b9',
}

const SACCO_INITIALS: Record<string, string> = {
  'stima-sacco': 'ST',
  'teachers-sacco': 'TS',
  'unaitas-sacco': 'UN',
  'kenya-police-sacco': 'KP',
  'imarika-sacco': 'IK',
}

export default function SaccoLoanSelectorScreen() {
  const { data: memberships = [], isLoading } = useMemberships()
  const { data: loans = [] } = useLoans()

  const activeMemberships = useMemo(() => getActiveMemberships(memberships), [memberships])
  const canCompare = activeMemberships.length > 1

  const handleApply = (slug: string) => {
    router.push({ pathname: '/(member)/sacco/[slug]/loans/apply', params: { slug } })
  }

  const handleCompare = () => {
    router.push({ pathname: '/(member)/sacco/[slug]/compare', params: { slug: activeMemberships[0].sacco_slug } })
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={VIOLET} />
        <Text style={{ color: INK_MUTED, fontSize: 12, marginTop: 12 }}>Loading SACCOs...</Text>
      </View>
    )
  }

  if (activeMemberships.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>🏦</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: INK, marginBottom: 6 }}>No SACCOs linked</Text>
        <Text style={{ fontSize: 12, color: INK_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
          Join a SACCO first to apply for a loan.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(member)/discover')}
          style={{
            backgroundColor: VIOLET,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Browse SACCOs</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: SURFACE2 }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: SURFACE,
          borderBottomWidth: 0.5,
          borderBottomColor: BORDER,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(109, 40, 217, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 18 }}>🏦</Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: INK }}>Apply for a loan</Text>
        <Text style={{ fontSize: 12, color: INK_MUTED, marginTop: 4 }}>
          Choose a SACCO to apply from
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Compare banner — shown if multiple SACCOs */}
        {canCompare && (
          <View
            style={{
              backgroundColor: 'rgba(109, 40, 217, 0.06)',
              borderWidth: 1,
              borderColor: 'rgba(109, 40, 217, 0.15)',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(109, 40, 217, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>⚖️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: INK, marginBottom: 2 }}>
                Compare loan options
              </Text>
              <Text style={{ fontSize: 11, color: INK_MUTED, lineHeight: 16 }}>
                See interest rates and terms across all your SACCOs side-by-side
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCompare}
              style={{
                backgroundColor: VIOLET,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Compare</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.6,
            color: INK_FAINT,
            marginBottom: 10,
            textTransform: 'uppercase',
          }}
        >
          Your active SACCOs
        </Text>

        {activeMemberships.map((membership) => {
          const totalSavings = getMembershipSavings(membership)
          const saccoColor = SACCO_COLORS[membership.sacco_slug] || membership.sacco_color || VIOLET
          const initials = SACCO_INITIALS[membership.sacco_slug] || membership.sacco_initials || 'SA'
          const activeLoanCount = loans.filter(
            (l) =>
              l.sacco_slug === membership.sacco_slug &&
              (l.status === 'active' || l.status === 'disbursed' || l.status === 'approved')
          ).length

          return (
            <TouchableOpacity
              key={membership.id}
              onPress={() => handleApply(membership.sacco_slug)}
              activeOpacity={0.7}
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: saccoColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: INK }}>{membership.sacco_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Text style={{ fontSize: 10, color: INK_FAINT }}>
                    Savings: KES {totalSavings.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 10, color: INK_FAINT }}>·</Text>
                  <Text style={{ fontSize: 10, color: MINT, fontWeight: '500' }}>
                    Limit: KES {membership.loan_limit.toLocaleString()}
                  </Text>
                </View>
                {activeLoanCount > 0 && (
                  <View
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9, color: '#D97706', fontWeight: '500' }}>
                      {activeLoanCount} active loan{activeLoanCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: INK_FAINT, fontSize: 18 }}>{'>'}</Text>
            </TouchableOpacity>
          )
        })}

        {/* Existing active loans */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.6,
            color: INK_FAINT,
            marginTop: 8,
            marginBottom: 10,
            textTransform: 'uppercase',
          }}
        >
          Your existing loans
        </Text>

        {loans.length > 0 ? (
          loans.map((loan) => (
            <View
              key={loan.id}
              style={{
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: INK }}>{loan.sacco_name}</Text>
                <StatusBadge status={loan.status} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: INK_MUTED }}>{loan.loan_product_label}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: INK }}>
                  KES {loan.amount_requested.toLocaleString()}
                </Text>
              </View>
              {(loan.status === 'active' || loan.status === 'disbursed') && (
                <View style={{ marginTop: 6 }}>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: SURFACE3,
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        backgroundColor: MINT,
                        borderRadius: 2,
                        width: `${getRepaymentProgress(loan)}%`,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 9, color: INK_FAINT }}>
                    {getRepaymentProgress(loan)}% repaid · Remaining: KES {(loan.balance_remaining ?? 0).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View
            style={{
              backgroundColor: SURFACE,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 12,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, color: INK_MUTED }}>No active loans yet</Text>
            <Text style={{ fontSize: 10, color: INK_FAINT, marginTop: 2 }}>
              Select a SACCO above to start your application
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    disbursed: { label: 'In repayment', bg: '#FEF3C7', text: '#78350F' },
    active: { label: 'In repayment', bg: '#FEF3C7', text: '#78350F' },
    approved: { label: 'Approved', bg: '#E6F7F1', text: '#064E3B' },
    disbursement_pending: { label: 'Disbursement', bg: '#E8F1FB', text: '#0C447C' },
    closed: { label: 'Closed', bg: '#F3F4F6', text: '#6B7280' },
    submitted: { label: 'Pending', bg: '#EDE9FE', text: '#4C1D95' },
    guarantors_pending: { label: 'Guarantors', bg: '#FEF3C7', text: '#78350F' },
    under_review: { label: 'Review', bg: '#E8F1FB', text: '#0C447C' },
    rejected: { label: 'Rejected', bg: '#FDEAEA', text: '#791F1F' },
  }
  const c = config[status] || { label: status.replace(/_/g, ' '), bg: SURFACE3, text: INK_MUTED }
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 }}>
      <Text style={{ fontSize: 9, fontWeight: '600', color: c.text }}>{c.label}</Text>
    </View>
  )
}

function getRepaymentProgress(loan: { amount_requested: number; balance_remaining?: number }) {
  if (!loan.amount_requested || loan.amount_requested <= 0) return 0
  const repaid = loan.amount_requested - (loan.balance_remaining ?? 0)
  return Math.max(0, Math.min(100, Math.round((repaid / loan.amount_requested) * 100)))
}

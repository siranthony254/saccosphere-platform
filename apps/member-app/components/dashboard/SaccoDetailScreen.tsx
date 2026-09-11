import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useLoans } from '../../hooks/useLoans'
import { DeepSpaceBackground } from '../DeepSpaceBackground'
import { useMoney, getLoanProgress } from '../../lib/money'
import { BalanceToggle } from '../ui/BalanceToggle'
import { useTheme } from '../../theme/ThemeProvider'

export default function SaccoDetailScreen() {
  const { colors: c } = useTheme()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { data: membership, isLoading, refetch, isRefetching } = useMembershipBySacco(slug)
  const { data: loans } = useLoans({ sacco: slug })

  const activeLoan = loans?.find(l => l.status === 'active' || l.status === 'disbursed')

  if (isLoading) return (
    <DeepSpaceBackground>
      <View style={{ paddingTop: insets.top + 20 }} className="px-4 gap-3">
        {[1, 2, 3].map(i => <View key={i} className="h-30 rounded-xl" style={{ backgroundColor: c.surface }} />)}
      </View>
    </DeepSpaceBackground>
  )
  if (!membership) return (
    <DeepSpaceBackground>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-xs" style={{ color: c.textMuted }}>Membership not found for this SACCO.</Text>
      </View>
    </DeepSpaceBackground>
  )

  const totalSavings = membership.bosa_balance + membership.fosa_balance

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
      >
        {/* Header */}
        <View className="px-4 py-2.5 flex-row items-center" style={{ borderBottomWidth: 1, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.surfaceAlt }}>
            <Text className="text-xs" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-sm font-semibold" style={{ color: c.text }}>{membership.sacco_name}</Text>
            <Text className="text-xs" style={{ color: c.textMuted }}>Member No. {membership.member_number}</Text>
          </View>
        </View>

        {/* Balance hero */}
        <View className="p-5 items-center mb-0 mt-4 mx-4 rounded-2xl" style={{ backgroundColor: (membership.sacco_color || c.accent) + '25' }}>
          <Text className="text-xs tracking-wider mb-1" style={{ color: c.textMuted }}>Total savings balance</Text>
          <View className="flex-row items-center gap-2.5 mb-1">
            <Text className="text-3xl font-bold" style={{ color: c.text }}>{money(totalSavings)}</Text>
            <BalanceToggle />
          </View>
          <View className="px-2.5 py-0.5 rounded-full mt-1" style={{ backgroundColor: c.surfaceAlt }}>
            <Text className="text-[10px] font-medium" style={{ color: c.textMuted }}>Active Member</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-2.5 px-4 py-4">
          <TouchableOpacity
            className="flex-1 rounded-xl p-3.5 items-center"
            style={{ backgroundColor: c.accent }}
            onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug } })}
          >
            <Text className="text-xs font-semibold" style={{ color: c.onAccent }}>Contribute</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-xl p-3.5 items-center"
            style={{ borderWidth: 1, borderColor: c.accent, backgroundColor: c.accentSoft }}
            onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply', params: { slug } })}
          >
            <Text className="text-xs font-semibold" style={{ color: c.accent }}>Apply for loan</Text>
          </TouchableOpacity>
        </View>

        {/* Account breakdown */}
        <View className="mx-4 mb-3 rounded-2xl p-4" style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
          <Text className="text-xs font-semibold mb-3" style={{ color: c.text }}>Account breakdown</Text>
          {[
            { label: 'BOSA savings', value: membership.bosa_balance || 0 },
            { label: 'FOSA savings', value: membership.fosa_balance || 0 },
            { label: 'Share capital', value: membership.share_capital || 0 },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2.5"
              style={i !== arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : undefined}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className="text-xs font-semibold" style={{ color: c.text }}>{money(row.value)}</Text>
            </View>
          ))}
          <View className="mt-2 pt-2 flex-row justify-between" style={{ borderTopWidth: 1, borderTopColor: c.border }}>
            <Text className="text-xs" style={{ color: c.textMuted }}>Loan limit</Text>
            <Text className="text-xs font-semibold" style={{ color: c.success }}>{money(membership.loan_limit || 0)}</Text>
          </View>
        </View>

        {/* Active loan */}
        {activeLoan ? (
          <View className="mx-4 mb-3 rounded-2xl p-4" style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-semibold" style={{ color: c.text }}>Active loan</Text>
              <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: c.warning + '33', borderWidth: 1, borderColor: c.warning + '4D' }}>
                <Text className="text-[10px] font-bold uppercase" style={{ color: c.warning }}>Repaying</Text>
              </View>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-xs" style={{ color: c.textMuted }}>{activeLoan.loan_product_label}</Text>
              <Text className="text-xs font-semibold" style={{ color: c.text }}>{money(activeLoan.amount_requested)}</Text>
            </View>

            {/* Progress bar */}
            <View className="h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: c.surfaceAlt }}>
              <View className="h-full" style={{
                backgroundColor: c.success,
                width: `${getLoanProgress(activeLoan.amount_requested, activeLoan.balance_remaining)}%`
              }} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-[10px]" style={{ color: c.textFaint }}>
                {getLoanProgress(activeLoan.amount_requested, activeLoan.balance_remaining)}% repaid
              </Text>
              <Text className="text-[10px]" style={{ color: c.textFaint }}>Next: {activeLoan.next_payment_date || 'TBD'}</Text>
            </View>

            <TouchableOpacity
              className="rounded-xl p-3.5 items-center mt-4"
              style={{ backgroundColor: c.accent }}
              onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug, type: 'repayment', loanId: activeLoan.id } })}
            >
              <Text className="text-xs font-semibold" style={{ color: c.onAccent }}>Pay instalment via M-Pesa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-4 mb-3 rounded-2xl p-5 items-center" style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
            <Text className="text-xs font-semibold mb-1" style={{ color: c.text }}>Active loan</Text>
            <Text className="text-xs" style={{ color: c.textFaint }}>No active loans found</Text>
          </View>
        )}

        {/* Quick links */}
        <View className="flex-row gap-3 px-4 py-2">
          <TouchableOpacity
            className="flex-1 rounded-xl p-3.5 items-center"
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}
            onPress={() => router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })}
          >
            <Text className="text-xs font-medium" style={{ color: c.textMuted }}>View statement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-xl p-3.5 items-center"
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}
            onPress={() => router.push({ pathname: '/sacco/[slug]/compare', params: { slug } })}
          >
            <Text className="text-xs font-medium" style={{ color: c.textMuted }}>Compare loans</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

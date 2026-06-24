import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useLoans } from '../../hooks/useLoans'

export default function SaccoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: membership, isLoading, refetch, isRefetching } = useMembershipBySacco(slug)
  const { data: loans } = useLoans({ sacco: slug })

  const activeLoan = loans?.find(l => l.status === 'active' || l.status === 'disbursed')

  if (isLoading) return (
    <View className="px-4 gap-3">
      {[1,2,3].map(i => <View key={i} className="h-30 bg-border rounded-xl" />)}
    </View>
  )
  if (!membership) return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-ink-muted text-xs">Membership not found for this SACCO.</Text>
    </View>
  )

  const totalSavings = membership.bosa_balance + membership.fosa_balance

  return (
    <ScrollView
      className="bg-surface2"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
    >
      {/* Balance hero */}
      <View className="p-5 items-center mb-0" style={{ backgroundColor: membership.sacco_color + '18' }}>
        <Text className="text-ink-muted text-xs tracking-wider mb-1">Total savings balance</Text>
        <Text className="text-3xl font-bold mb-1" style={{ color: membership.sacco_color }}>KES {totalSavings.toLocaleString()}</Text>
        <Text className="text-ink-faint text-xs">Member No. {membership.member_number}</Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-2.5 px-3.5 py-3.5">
        <TouchableOpacity
          className="flex-1 bg-violet-500 rounded-xl p-3 items-center"
          onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/pay', params: { slug } })}
        >
          <Text className="text-white text-xs font-semibold">Contribute</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 border-2 border-violet-500 rounded-xl p-3 items-center"
          onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/loans/apply', params: { slug } })}
        >
          <Text className="text-violet-500 text-xs font-semibold">Apply for loan</Text>
        </TouchableOpacity>
      </View>

      {/* Account breakdown */}
      <View className="bg-surface mx-3.5 mt-0 mb-3 rounded-xl p-4 border border-border">
        <Text className="text-ink text-xs font-semibold mb-2.5">Account breakdown</Text>
        {[
          { label: 'BOSA savings', value: membership.bosa_balance },
          { label: 'FOSA savings', value: membership.fosa_balance },
          { label: 'Share capital', value: membership.share_capital },
          { label: 'Dividends (2023)', value: membership.total_dividends },
        ].map(row => (
          <View key={row.label} className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">KES {row.value.toLocaleString()}</Text>
          </View>
        ))}
        <View className="flex-row justify-between py-2 border-b border-border">
          <Text className="text-ink-muted text-xs">Loan limit</Text>
          <Text className="text-mint-500 text-xs font-semibold">KES {membership.loan_limit.toLocaleString()}</Text>
        </View>
      </View>

      {/* Active loan */}
      {activeLoan && (
        <View className="bg-surface mx-3.5 mb-3 rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-ink text-xs font-semibold mb-2.5">Active loan</Text>
            <View className="bg-amber-50 px-2 py-0.5 rounded-lg"><Text className="text-amber-700 text-xs font-semibold">In repayment</Text></View>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border"><Text className="text-ink-muted text-xs">{activeLoan.loan_product_label}</Text><Text className="text-ink text-xs font-semibold">KES {activeLoan.amount_requested.toLocaleString()}</Text></View>

          {/* Progress bar */}
          <View className="h-1 bg-border rounded overflow-hidden mt-2">
            <View className="h-full bg-mint-500 rounded" style={{
              width: `${Math.round(((activeLoan.amount_requested - (activeLoan.balance_remaining ?? 0)) / activeLoan.amount_requested) * 100)}%`
            }} />
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-ink-faint text-xs">
              {Math.round(((activeLoan.amount_requested - (activeLoan.balance_remaining ?? 0)) / activeLoan.amount_requested) * 100)}% repaid
            </Text>
            <Text className="text-ink-faint text-xs">Next: {activeLoan.next_payment_date}</Text>
          </View>

          <TouchableOpacity
            className="bg-violet-500 rounded-xl p-3 items-center mt-2"
            onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/pay', params: { slug, type: 'repayment', loanId: activeLoan.id } })}
          >
            <Text className="text-white text-xs font-semibold">Pay instalment via M-Pesa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick links */}
      <View className="flex-row gap-2.5 px-3.5 py-3.5 pt-0">
        <TouchableOpacity className="flex-1 bg-surface rounded-xl p-3 items-center border border-border" onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/statement', params: { slug } })}>
          <Text className="text-ink-soft text-xs font-medium">📄  View statement</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-surface rounded-xl p-3 items-center border border-border" onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/compare', params: { slug } })}>
          <Text className="text-ink-soft text-xs font-medium">⚖️  Compare loans</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

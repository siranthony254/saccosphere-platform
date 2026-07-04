import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useLoans } from '../../hooks/useLoans'
import { DeepSpaceBackground } from '../DeepSpaceBackground'

export default function SaccoDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { data: membership, isLoading, refetch, isRefetching } = useMembershipBySacco(slug)
  const { data: loans } = useLoans({ sacco: slug })

  const activeLoan = loans?.find(l => l.status === 'active' || l.status === 'disbursed')

  if (isLoading) return (
    <DeepSpaceBackground>
      <View style={{ paddingTop: insets.top + 20 }} className="px-4 gap-3">
        {[1, 2, 3].map(i => <View key={i} className="h-30 bg-white/5 rounded-xl" />)}
      </View>
    </DeepSpaceBackground>
  )
  if (!membership) return (
    <DeepSpaceBackground>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-white/60 text-xs">Membership not found for this SACCO.</Text>
      </View>
    </DeepSpaceBackground>
  )

  const totalSavings = membership.bosa_balance + membership.fosa_balance

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
      >
        {/* Header */}
        <View className="px-4 py-2.5 border-b border-white/10 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
            <Text className="text-white/80 text-xs">←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-white text-sm font-semibold">{membership.sacco_name}</Text>
            <Text className="text-white/60 text-xs">Member No. {membership.member_number}</Text>
          </View>
        </View>

        {/* Balance hero */}
        <View className="p-5 items-center mb-0 mt-4 mx-4 rounded-2xl" style={{ backgroundColor: membership.sacco_color + '25' }}>
          <Text className="text-white/60 text-xs tracking-wider mb-1">Total savings balance</Text>
          <Text className="text-3xl font-bold mb-1 text-white">KES {totalSavings.toLocaleString()}</Text>
          <View className="bg-white/10 px-2.5 py-0.5 rounded-full mt-1">
            <Text className="text-white/80 text-[10px] font-medium">Active Member</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-2.5 px-4 py-4">
          <TouchableOpacity
            className="flex-1 bg-violet-500 rounded-xl p-3.5 items-center"
            onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug } })}
          >
            <Text className="text-white text-xs font-semibold">Contribute</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border border-violet-500/50 bg-violet-500/10 rounded-xl p-3.5 items-center"
            onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply', params: { slug } })}
          >
            <Text className="text-violet-400 text-xs font-semibold">Apply for loan</Text>
          </TouchableOpacity>
        </View>

        {/* Account breakdown */}
        <View className="bg-white/5 mx-4 mb-3 rounded-2xl p-4 border border-white/10">
          <Text className="text-white/90 text-xs font-semibold mb-3">Account breakdown</Text>
          {[
            { label: 'BOSA savings', value: membership.bosa_balance || 0 },
            { label: 'FOSA savings', value: membership.fosa_balance || 0 },
            { label: 'Share capital', value: membership.share_capital || 0 },
          ].map((row, i, arr) => (

            <View key={row.label} className={`flex-row justify-between py-2.5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className="text-white text-xs font-semibold">KES {row.value.toLocaleString()}</Text>
            </View>
          ))}
          <View className="mt-2 pt-2 border-t border-white/10 flex-row justify-between">
            <Text className="text-white/60 text-xs">Loan limit</Text>
            <Text className="text-mint-400 text-xs font-semibold">KES {(membership.loan_limit || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Active loan */}
        {activeLoan ? (
          <View className="bg-white/5 mx-4 mb-3 rounded-2xl p-4 border border-white/10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/90 text-xs font-semibold">Active loan</Text>
              <View className="bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                <Text className="text-amber-400 text-[10px] font-bold uppercase">Repaying</Text>
              </View>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-white/60 text-xs">{activeLoan.loan_product_label}</Text>
              <Text className="text-white text-xs font-semibold">KES {activeLoan.amount_requested.toLocaleString()}</Text>
            </View>

            {/* Progress bar */}
            <View className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <View className="h-full bg-mint-500" style={{
                width: `${Math.round(((activeLoan.amount_requested - (activeLoan.balance_remaining ?? 0)) / activeLoan.amount_requested) * 100)}%`
              }} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-white/40 text-[10px]">
                {Math.round(((activeLoan.amount_requested - (activeLoan.balance_remaining ?? 0)) / activeLoan.amount_requested) * 100)}% repaid
              </Text>
              <Text className="text-white/40 text-[10px]">Next: {activeLoan.next_payment_date || 'TBD'}</Text>
            </View>

            <TouchableOpacity
              className="bg-violet-600 rounded-xl p-3.5 items-center mt-4"
              onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug, type: 'repayment', loanId: activeLoan.id } })}
            >
              <Text className="text-white text-xs font-semibold">Pay instalment via M-Pesa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white/5 mx-4 mb-3 rounded-2xl p-5 border border-white/10 items-center">
            <Text className="text-white/90 text-xs font-semibold mb-1">Active loan</Text>
            <Text className="text-white/40 text-xs">No active loans found</Text>
          </View>
        )}

        {/* Quick links */}
        <View className="flex-row gap-3 px-4 py-2">
          <TouchableOpacity
            className="flex-1 bg-white/5 rounded-xl p-3.5 items-center border border-white/10"
            onPress={() => router.push({ pathname: '/sacco/[slug]/statement', params: { slug } })}
          >
            <Text className="text-white/80 text-xs font-medium">📄 View statement</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white/5 rounded-xl p-3.5 items-center border border-white/10"
            onPress={() => router.push({ pathname: '/sacco/[slug]/compare', params: { slug } })}
          >
            <Text className="text-white/80 text-xs font-medium">⚖️ Compare loans</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </DeepSpaceBackground>
  )
}


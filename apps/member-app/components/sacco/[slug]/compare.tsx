
import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useLoanComparison } from '../../../hooks/useLoans'

export default function LoanCompareScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [amount, setAmount] = useState('150000')
  const [months, setMonths] = useState('24')
  const { data: comparison, isLoading } = useLoanComparison(parseFloat(amount || '0'), parseInt(months))

  const best = comparison?.reduce((a, b) => a.monthly_instalment < b.monthly_instalment ? a : b)

  return (
    <ScrollView className="bg-surface2" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="text-ink text-xl font-bold mb-1">Compare loan options</Text>
      <Text className="text-ink-faint text-xs mb-4">Across all your SACCOs</Text>

      {best && (
        <View className="bg-mint-50 rounded-xl p-3 mb-4">
          <Text className="text-mint-700 text-xs leading-5">
            💡 <Text className="font-semibold">Smart suggestion:</Text> For KES {parseFloat(amount).toLocaleString()} over {months} months,{' '}
            <Text className="font-bold">{best.sacco_name}</Text> saves you the most in interest.
          </Text>
        </View>
      )}

      <View className="flex-row gap-3 mb-5">
        <View className="flex-1">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">Amount (KES)</Text>
          <TextInput className="border border-border rounded-xl p-3 text-base text-ink bg-surface" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
        </View>
        <View className="w-25">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">Months</Text>
          <View className="flex-row gap-1">
            {['12', '24', '36'].map(m => (
              <TouchableOpacity key={m} className={`flex-1 p-2 rounded-lg border items-center ${months === m ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`} onPress={() => setMonths(m)}>
                <Text className={`text-xs font-semibold ${months === m ? 'text-white' : 'text-ink-muted'}`}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {isLoading ? (
        [1,2].map(i => <View key={i} className="h-40 bg-border rounded-xl mb-3" />)
      ) : (
        comparison?.map(item => (
          <View key={item.sacco_slug} className={`bg-surface rounded-xl p-3.5 mb-3 border relative ${item === best ? 'border-violet-500 border-2' : 'border-border'}`}>
            {item === best && <View className="absolute -top-2.5 right-3.5 bg-violet-500 px-2.5 py-0.5 rounded-lg"><Text className="text-white text-xs font-bold">Best rate</Text></View>}
            <View className="flex-row items-center gap-2.5 mb-3">
              <View className="w-9.5 h-9.5 rounded-lg items-center justify-center" style={{ backgroundColor: item.sacco_color }}>
                <Text className="text-white text-xs font-bold">{item.sacco_initials}</Text>
              </View>
              <View>
                <Text className="text-ink text-xs font-semibold">{item.sacco_name}</Text>
                <Text className="text-ink-faint text-xs">{item.loan_product_label}</Text>
              </View>
            </View>
            <View className="flex-row justify-around bg-surface2 rounded-lg p-3 mb-3">
              {[
                { label: 'Rate p.a.', value: `${item.interest_rate_pct}%` },
                { label: 'Monthly', value: `KES ${item.monthly_instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
                { label: 'Total cost', value: `KES ${item.total_repayable.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
              ].map(s => (
                <View key={s.label} className="items-center">
                  <Text className="text-ink text-xs font-bold">{s.value}</Text>
                  <Text className="text-ink-faint text-xs mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              className={`rounded-lg p-2.5 items-center ${item === best ? 'bg-violet-500' : 'border border-violet-500'}`}
              onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply', params: { slug: item.sacco_slug } })}
            >
              <Text className={`text-xs font-semibold ${item === best ? 'text-white' : 'text-violet-500'}`}>
                Apply at {item.sacco_name} →
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text className="text-ink-faint text-xs text-center mt-2">Rates as of April 2024. Subject to SACCO board approval.</Text>
    </ScrollView>
  )
}

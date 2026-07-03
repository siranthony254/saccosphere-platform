import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLoanComparison } from '../../../hooks/useLoans'
import { DeepSpaceBackground } from '../../DeepSpaceBackground'

export default function LoanCompareScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const [amount, setAmount] = useState('150000')
  const [months, setMonths] = useState('24')
  const { data: comparison, isLoading } = useLoanComparison(parseFloat(amount || '0'), parseInt(months))

  const best = comparison?.length ? comparison.reduce((a, b) => a.monthly_instalment < b.monthly_instalment ? a : b) : undefined

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
      >
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-white/60 text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Compare loan options</Text>
        </View>
        <Text className="text-white/60 text-xs mb-6 ml-8">Across all your SACCOs</Text>

        {best && (
          <View className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
            <Text className="text-violet-200 text-xs leading-5">
              💡 <Text className="font-semibold text-white">Smart suggestion:</Text> For KES {parseFloat(amount).toLocaleString()} over {months} months,{' '}
              <Text className="font-bold text-violet-400">{best.sacco_name}</Text> saves you the most in interest.
            </Text>
          </View>
        )}

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Amount (KES)</Text>
            <TextInput
              className="border border-white/10 rounded-2xl p-4 text-base text-white bg-white/5"
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
          <View className="w-25">
            <Text className="text-white/60 text-[10px] font-bold uppercase mb-2 ml-1">Months</Text>
            <View className="flex-row gap-1">
              {['12', '24', '36'].map(m => (
                <TouchableOpacity
                  key={m}
                  className={`flex-1 p-2.5 rounded-xl border items-center justify-center ${months === m ? 'bg-violet-500 border-violet-500' : 'bg-white/5 border-white/10'}`}
                  onPress={() => setMonths(m)}
                >
                  <Text className={`text-xs font-bold ${months === m ? 'text-white' : 'text-white/40'}`}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {isLoading ? (
          [1, 2].map(i => <View key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl mb-4" />)
        ) : (
          comparison?.map(item => (
            <View key={item.sacco_slug} className={`bg-white/5 rounded-2xl p-4 mb-4 border relative ${item === best ? 'border-violet-500/50 border-2' : 'border-white/10'}`}>
              {item === best && (
                <View className="absolute -top-2.5 right-4 bg-violet-500 px-3 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold uppercase">Best rate</Text>
                </View>
              )}
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: item.sacco_color }}>
                  <Text className="text-white text-xs font-bold">{item.sacco_initials}</Text>
                </View>
                <View>
                  <Text className="text-white text-xs font-semibold">{item.sacco_name}</Text>
                  <Text className="text-white/40 text-[10px]">{item.loan_product_label}</Text>
                </View>
              </View>
              <View className="flex-row justify-around bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
                {[
                  { label: 'Rate p.a.', value: `${item.interest_rate_pct}%` },
                  { label: 'Monthly', value: `KES ${item.monthly_instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
                  { label: 'Total cost', value: `KES ${item.total_repayable.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
                ].map(s => (
                  <View key={s.label} className="items-center">
                    <Text className="text-white text-xs font-bold">{s.value}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5 uppercase">{s.label}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                className={`rounded-xl p-3.5 items-center ${item === best ? 'bg-violet-600' : 'border border-violet-500/50'}`}
                onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply', params: { slug: item.sacco_slug } })}
              >
                <Text className={`text-xs font-semibold ${item === best ? 'text-white' : 'text-violet-400'}`}>
                  Apply at {item.sacco_name} →
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text className="text-white/30 text-[10px] text-center mt-4">Rates as of April 2024. Subject to SACCO board approval.</Text>
      </ScrollView>
    </DeepSpaceBackground>
  )
}


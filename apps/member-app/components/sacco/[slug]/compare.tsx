import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLoanComparison } from '../../../hooks/useLoans'
import { DeepSpaceBackground } from '../../DeepSpaceBackground'
import { useTheme } from '../../../theme/ThemeProvider'

export default function LoanCompareScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const [amount, setAmount] = useState('150000')
  const [months, setMonths] = useState('24')
  const { data: comparison, isLoading } = useLoanComparison(parseFloat(amount || '0'), parseInt(months))

  const best = comparison?.length ? comparison.reduce((a, b) => a.monthly_instalment < b.monthly_instalment ? a : b) : undefined

  return (
    <DeepSpaceBackground>
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="mr-3">
            <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: c.text }}>Compare loan options</Text>
        </View>
        <Text className="text-xs mb-6 ml-8" style={{ color: c.textMuted }}>Across all your SACCOs</Text>

        {best && (
          <View className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6">
            <Text className="text-violet-200 text-xs leading-5">
              <Text className="font-semibold" style={{ color: c.text }}>Smart suggestion:</Text> For KES {parseFloat(amount).toLocaleString()} over {months} months,{' '}
              <Text className="font-bold text-violet-400">{best.sacco_name}</Text> saves you the most in interest.
            </Text>
          </View>
        )}

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase mb-2 ml-1" style={{ color: c.textMuted }}>Amount (KES)</Text>
            <TextInput
              className="border rounded-2xl p-4 text-base"
              style={{ borderColor: c.border, backgroundColor: c.surface, color: c.text }}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholderTextColor={c.textFaint}
            />
          </View>
          <View className="w-25">
            <Text className="text-[10px] font-bold uppercase mb-2 ml-1" style={{ color: c.textMuted }}>Months</Text>
            <View className="flex-row gap-1">
              {['12', '24', '36'].map(m => {
                const selected = months === m
                return (
                  <TouchableOpacity
                    key={m}
                    className={`flex-1 p-2.5 rounded-xl border items-center justify-center ${selected ? 'bg-violet-500 border-violet-500' : ''}`}
                    style={!selected ? { backgroundColor: c.surface, borderColor: c.border } : undefined}
                    onPress={() => setMonths(m)}
                  >
                    <Text className="text-xs font-bold" style={{ color: selected ? '#FFFFFF' : c.textFaint }}>{m}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        {isLoading ? (
          [1, 2].map(i => <View key={i} className="h-40 rounded-2xl mb-4 border" style={{ backgroundColor: c.surface, borderColor: c.border }} />)
        ) : (
          comparison?.map(item => (
            <View
              key={item.sacco_slug}
              className={`rounded-2xl p-4 mb-4 border relative ${item === best ? 'border-violet-500/50 border-2' : ''}`}
              style={{ backgroundColor: c.surface, ...(item === best ? {} : { borderColor: c.border }) }}
            >
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
                  <Text className="text-xs font-semibold" style={{ color: c.text }}>{item.sacco_name}</Text>
                  <Text className="text-[10px]" style={{ color: c.textFaint }}>{item.loan_product_label}</Text>
                </View>
              </View>
              <View className="flex-row justify-around rounded-xl p-3 mb-4" style={{ backgroundColor: c.surfaceAlt }}>
                {[
                  { label: 'Rate p.a.', value: `${item.interest_rate_pct}%` },
                  { label: 'Monthly', value: `KES ${item.monthly_instalment.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
                  { label: 'Total cost', value: `KES ${item.total_repayable.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` },
                ].map(s => (
                  <View key={s.label} className="items-center">
                    <Text className="text-xs font-bold" style={{ color: c.text }}>{s.value}</Text>
                    <Text className="text-[10px] mt-0.5 uppercase" style={{ color: c.textFaint }}>{s.label}</Text>
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

        <Text className="text-[10px] text-center mt-4" style={{ color: c.textFaint }}>
          Rates as of {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}. Subject to SACCO board approval.
        </Text>
      </KeyboardAwareScrollView>
    </DeepSpaceBackground>
  )
}


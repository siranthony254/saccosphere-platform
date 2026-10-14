import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useSaccoConfig } from '../../../../hooks/useSaccoConfig'
import { useWhatIf } from '../../../../hooks/useLoanAppraisal'
import { useMoney } from '../../../../lib/money'
import { useTheme } from '../../../../theme/ThemeProvider'

export default function LoanWhatIfScreen() {
  const { colors: c } = useTheme()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: config } = useSaccoConfig(slug)
  const products = config?.loan_products ?? []

  const [productKey, setProductKey] = useState<string | null>(null)
  const selectedProduct = products.find((p) => p.key === productKey) ?? products[0] ?? null

  const whatIf = useWhatIf()

  const calculate = () => {
    if (!selectedProduct) return
    whatIf.mutate({ loanTypeId: selectedProduct.key })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Check your eligibility</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>See what you could qualify for — no application needed</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {products.length === 0 ? (
          <Text style={{ color: c.textMuted, fontSize: 13 }}>No loan products are configured for this SACCO yet.</Text>
        ) : (
          <>
            <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Loan product</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {products.map((p) => {
                const on = (productKey ?? products[0]?.key) === p.key
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setProductKey(p.key)}
                    style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : c.surface }}
                  >
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{p.label}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
                      {p.interest_rate_pct}% p.a. · up to {p.max_months} months
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity
              onPress={calculate}
              disabled={!selectedProduct || whatIf.isPending}
              style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: !selectedProduct || whatIf.isPending ? 0.6 : 1, marginBottom: 20 }}
            >
              {whatIf.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Calculate</Text>}
            </TouchableOpacity>

            {whatIf.isError ? (
              <Text style={{ color: c.danger, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                {(whatIf.error as any)?.message || 'Could not calculate eligibility — you may need an approved membership in this SACCO first.'}
              </Text>
            ) : null}

            {whatIf.data ? (
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: c.textMuted, fontSize: 11 }}>You could qualify for up to</Text>
                    <Text style={{ color: c.success, fontSize: 24, fontWeight: '800' }}>{money(whatIf.data.max_amount)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: c.textMuted, fontSize: 11 }}>Est. monthly instalment</Text>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{money(whatIf.data.instalment)}</Text>
                  </View>
                </View>
                {whatIf.data.reasons.length > 0 ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12, gap: 6 }}>
                    {whatIf.data.reasons.map((reason: string, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                        <Text style={{ color: c.textFaint, fontSize: 12 }}>•</Text>
                        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 17, flex: 1 }}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

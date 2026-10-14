import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useAcceptLoanOffer, useLoanOffer } from '../../hooks/useLoanAppraisal'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

export default function LoanOfferScreen() {
  const { colors: c } = useTheme()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { data: offer, isLoading } = useLoanOffer(id ?? null)
  const accept = useAcceptLoanOffer()

  const handleAccept = () => {
    if (!id) return
    accept.mutate(id, {
      onSuccess: () => Alert.alert('Offer accepted', 'You have accepted this loan offer.'),
      onError: (err: any) => {
        if (err?.status === 409) {
          Alert.alert('Already accepted', 'This loan offer has already been accepted.')
          return
        }
        Alert.alert('Could not accept', err?.message || 'Please try again.')
      },
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Loan offer</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>The true cost of this loan, before it disburses</Text>
      </View>

      {isLoading || !offer ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 }}>
            <Row label="Principal" value={money(offer.principal)} c={c} />
            <Row label="Term" value={`${offer.term_months} months`} c={c} />
            <Row label="Interest rate" value={`${offer.interest_rate}% p.a.`} c={c} />
            <Row label="Total interest" value={money(offer.total_interest)} c={c} />
            <Row label="Processing fee" value={money(offer.processing_fee)} c={c} />
            <Row label="Insurance fee" value={money(offer.insurance_fee)} c={c} />
          </View>

          <View style={{ backgroundColor: 'rgba(109,40,217,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(109,40,217,0.2)', padding: 16, marginBottom: 20 }}>
            <Row label="Total cost of credit" value={money(offer.total_cost_of_credit)} c={c} bold />
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(109,40,217,0.15)' }}>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 2 }}>Effective annual rate</Text>
              <Text style={{ color: c.accent, fontSize: 22, fontWeight: '800' }}>{offer.effective_annual_rate}%</Text>
              <Text style={{ color: c.textFaint, fontSize: 10, marginTop: 4, lineHeight: 15 }}>
                The true compounded yearly rate, including fees — not just the nominal interest rate above. This
                can read meaningfully higher on fee-heavy products.
              </Text>
            </View>
          </View>

          {offer.accepted ? (
            <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', padding: 16, alignItems: 'center' }}>
              <Text style={{ color: c.success, fontSize: 13, fontWeight: '700' }}>You've accepted this offer</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAccept}
              disabled={accept.isPending}
              style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: accept.isPending ? 0.6 : 1 }}
            >
              {accept.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Accept this offer</Text>}
            </TouchableOpacity>
          )}
          <Text style={{ color: c.textFaint, fontSize: 10, textAlign: 'center', marginTop: 12, lineHeight: 15 }}>
            Accepting is one-time and cannot be undone.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Row({ label, value, c, bold }: { label: string; value: string; c: any; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: bold ? 13 : 12, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: bold ? 13 : 12, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  )
}

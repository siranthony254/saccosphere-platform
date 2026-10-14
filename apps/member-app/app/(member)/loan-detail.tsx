import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useLoan } from '../../hooks/useLoans'
import { useAppraisalSummary, useLoanOffer } from '../../hooks/useLoanAppraisal'
import { Badge } from '../../components/ui/Badge'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'


const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  approved: 'success',
  active: 'success',
  disbursed: 'success',
  closed: 'neutral',
  rejected: 'error',
  defaulted: 'error',
  submitted: 'warning',
  under_review: 'warning',
  guarantors_pending: 'warning',
  disbursement_pending: 'warning',
}

function date(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LoanDetailScreen() {
  const { colors: c } = useTheme()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { data: loan, isLoading } = useLoan(id ?? '')
  const { data: appraisal } = useAppraisalSummary(loan?.id ?? null)
  const { data: offer } = useLoanOffer(loan?.id ?? null)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Loan details</Text>
      </View>

      {isLoading || !loan ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{loan.loan_product_label}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{loan.sacco_name} · Ref {loan.ref}</Text>
              </View>
              <Badge label={loan.status.replace(/_/g, ' ')} variant={STATUS_VARIANT[loan.status] ?? 'neutral'} />
            </View>
            <Row label="Amount" value={money(loan.amount_requested)} />
            <Row label="Term" value={`${loan.period_months} months`} />
            <Row label="Interest rate" value={`${loan.interest_rate}% p.a.`} />
            <Row label="Monthly instalment" value={money(loan.monthly_instalment)} />
            <Row label="Total repayable" value={money(loan.total_repayable)} />
            <Row label="Outstanding" value={money(loan.balance_remaining)} />
          </View>

          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 }}>
            <Row label="Applied" value={date(loan.submitted_at)} />
            <Row label="Approved" value={date(loan.approved_at)} />
            <Row label="Disbursed" value={date(loan.disbursed_at)} />
            {loan.purpose ? <Row label="Purpose" value={loan.purpose} /> : null}
          </View>

          {loan.status === 'rejected' && loan.rejection_reason ? (
            <View style={{ backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', padding: 16, marginBottom: 14 }}>
              <Text style={{ color: c.danger, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Why this was rejected
              </Text>
              <Text style={{ color: c.text, fontSize: 13, lineHeight: 19 }}>{loan.rejection_reason}</Text>
            </View>
          ) : null}

          {appraisal ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 }}>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Why this amount
              </Text>
              {appraisal.reasons.map((reason: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: c.textFaint, fontSize: 13 }}>•</Text>
                  <Text style={{ color: c.text, fontSize: 12, lineHeight: 18, flex: 1 }}>{reason}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {offer ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(member)/loan-offer', params: { id: loan.id } } as any)}
              style={{
                backgroundColor: offer.accepted ? c.surface : c.accent,
                borderRadius: 14,
                borderWidth: offer.accepted ? 1 : 0,
                borderColor: c.border,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Text style={{ color: offer.accepted ? c.text : '#fff', fontSize: 13, fontWeight: '700' }}>
                  {offer.accepted ? 'Loan offer accepted' : 'Review your loan offer'}
                </Text>
                <Text style={{ color: offer.accepted ? c.textMuted : 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 }}>
                  {offer.accepted ? 'Cost-of-credit disclosure' : 'See the true cost of this loan before it disburses'}
                </Text>
              </View>
              <Text style={{ color: offer.accepted ? c.textMuted : '#fff', fontSize: 16 }}>{'>'}</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useLoans } from '../../hooks/useLoans'
import { useMemberships } from '../../hooks/useMembership'

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'

export default function LoanRepaymentRoute() {
  const { data: loans = [], isLoading } = useLoans()
  const { data: memberships = [] } = useMemberships()
  const repayableLoans = useMemo(
    () => loans.filter((loan) => ['active', 'disbursed', 'approved', 'disbursement_pending'].includes(loan.status)),
    [loans]
  )

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={VIOLET} />
        <Text style={{ color: INK_MUTED, fontSize: 12, marginTop: 10 }}>Loading your loans...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: SURFACE2 }} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
      <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 14 }}>
        <Text style={{ color: INK, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>Pay loan</Text>
        <Text style={{ color: INK_MUTED, fontSize: 12, lineHeight: 18 }}>
          Select the loan you want to pay. We will load its SACCO and payment details automatically.
        </Text>
      </View>

      {repayableLoans.length === 0 ? (
        <View style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: BORDER }}>
          <Text style={{ fontSize: 30, marginBottom: 8 }}>KES</Text>
          <Text style={{ color: INK, fontSize: 15, fontWeight: '700', marginBottom: 5 }}>No loans to pay</Text>
          <Text style={{ color: INK_MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            Active and approved loans from your SACCOs will appear here.
          </Text>
        </View>
      ) : (
        repayableLoans.map((loan) => {
          const membership = memberships.find((item) => item.sacco_slug === loan.sacco_slug || item.sacco_name === loan.sacco_name)
          const amountDue = loan.next_payment_amount ?? loan.monthly_instalment ?? loan.balance_remaining ?? loan.amount_requested
          return (
            <TouchableOpacity
              key={loan.id}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/sacco/[slug]/pay',
                  params: {
                    slug: loan.sacco_slug || membership?.sacco_slug || '',
                    type: 'repayment',
                    loanId: loan.id,
                  },
                })
              }
              style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View>
                  <Text style={{ color: INK, fontSize: 14, fontWeight: '700' }}>{loan.sacco_name || membership?.sacco_name}</Text>
                  <Text style={{ color: INK_FAINT, fontSize: 11, marginTop: 2 }}>{loan.loan_product_label}</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: MINT, fontSize: 10, fontWeight: '700' }}>{loan.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: BORDER }}>
                <Text style={{ color: INK_MUTED, fontSize: 12 }}>Amount due</Text>
                <Text style={{ color: INK, fontSize: 13, fontWeight: '700' }}>KES {Math.round(amountDue).toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
                <Text style={{ color: INK_MUTED, fontSize: 12 }}>Outstanding</Text>
                <Text style={{ color: INK, fontSize: 12, fontWeight: '600' }}>
                  KES {Math.round(loan.balance_remaining ?? loan.amount_requested).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )
}

import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, Modal } from 'react-native'
import { router } from 'expo-router'
import { useLoans } from '../../hooks/useLoans'
import { useMemberships } from '../../hooks/useMembership'
import { api } from '@saccosphere/api-client'

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.07)'

interface ScheduleItem {
  instalment_number: number
  due_date: string
  principal: number
  interest: number
  amount: number
  balance_after: number
  status: string
}

export default function LoanRepaymentRoute() {
  const { data: loans = [], isLoading } = useLoans()
  const { data: memberships = [] } = useMemberships()
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState<any | null>(null)
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  const repayableLoans = useMemo(
    () => loans.filter((loan) => ['active', 'disbursed', 'approved', 'disbursement_pending'].includes(loan.status)),
    [loans]
  )

  const handleOpenSchedule = async (loan: any) => {
    setSelectedScheduleLoan(loan)
    setLoadingSchedule(true)
    try {
      const schedule = await api.loans.getSchedule(loan.id)
      setScheduleData(schedule)
    } catch (err) {
      console.error('Failed to load loan schedule:', err)
      setScheduleData([])
    } finally {
      setLoadingSchedule(false)
    }
  }

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
          Select a loan to initiate payment or inspect its full reducing-balance amortization repayment schedule.
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
            <View
              key={loan.id}
              style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 12 }}
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
                <Text style={{ color: INK_MUTED, fontSize: 12 }}>Outstanding Balance</Text>
                <Text style={{ color: INK, fontSize: 12, fontWeight: '600' }}>
                  KES {Math.round(loan.balance_remaining ?? loan.amount_requested).toLocaleString()}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenSchedule(loan)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: VIOLET, alignItems: 'center', backgroundColor: 'rgba(109, 40, 217, 0.05)' }}
                >
                  <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '700' }}>📅 View Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
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
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: VIOLET, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>📱 Pay via M-Pesa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })
      )}

      {/* Repayment Schedule Drawer Modal */}
      <Modal visible={Boolean(selectedScheduleLoan)} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ color: INK, fontSize: 17, fontWeight: '700' }}>Amortization Schedule</Text>
                <Text style={{ color: INK_MUTED, fontSize: 12 }}>{selectedScheduleLoan?.loan_product_label || 'Loan'} • KES {(selectedScheduleLoan?.amount_requested ?? 0).toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedScheduleLoan(null)} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18, color: INK_MUTED, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingSchedule ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={VIOLET} size="large" />
                <Text style={{ color: INK_MUTED, fontSize: 12, marginTop: 12 }}>Fetching schedule breakdown...</Text>
              </View>
            ) : scheduleData.length === 0 ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Text style={{ color: INK_MUTED, fontSize: 13 }}>No schedule generated for this loan yet.</Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 4 }}>
                {scheduleData.map((item) => {
                  const isPaid = item.status === 'PAID'
                  const isOverdue = item.status === 'OVERDUE'
                  return (
                    <View
                      key={item.instalment_number}
                      style={{
                        backgroundColor: SURFACE2,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: isPaid ? 'rgba(16,185,129,0.3)' : isOverdue ? 'rgba(239,68,68,0.3)' : BORDER,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={{ color: INK, fontSize: 13, fontWeight: '700' }}>Instalment #{item.instalment_number}</Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                            backgroundColor: isPaid ? 'rgba(16,185,129,0.15)' : isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: isPaid ? MINT : isOverdue ? '#EF4444' : '#D97706',
                            }}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: INK_MUTED, fontSize: 11 }}>Due Date</Text>
                        <Text style={{ color: INK, fontSize: 11, fontWeight: '600' }}>{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: INK_MUTED, fontSize: 11 }}>Principal / Interest</Text>
                        <Text style={{ color: INK, fontSize: 11 }}>
                          KES {item.principal.toLocaleString()} / KES {item.interest.toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 0.5, borderTopColor: BORDER }}>
                        <Text style={{ color: INK, fontSize: 12, fontWeight: '700' }}>Total Amount</Text>
                        <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '700' }}>KES {item.amount.toLocaleString()}</Text>
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

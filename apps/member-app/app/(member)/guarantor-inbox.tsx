import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useGuarantorStatement } from '../../hooks/useGuarantors'
import { Icon } from '../../components/ui/Icon'
import { EmptyState } from '../../components/ui/EmptyState'
import { useTheme } from '../../theme/ThemeProvider'

type Pledge = {
  id: string
  loan_id: string
  borrower_name: string
  sacco_name: string
  status: string
  guarantee_amount: number
  released_amount: number
  current_exposure: number
  requested_at: string | null
  responded_at: string | null
}

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  PENDING: { bg: 'rgba(245,158,11,0.15)', label: 'Awaiting your response' },
  APPROVED: { bg: 'rgba(16,185,129,0.15)', label: 'Active' },
  SUBSTITUTED: { bg: 'rgba(148,163,184,0.15)', label: 'Substituted' },
  RELEASED: { bg: 'rgba(148,163,184,0.15)', label: 'Released' },
  DECLINED: { bg: 'rgba(239,68,68,0.15)', label: 'Declined' },
  EXPIRED: { bg: 'rgba(148,163,184,0.15)', label: 'Expired' },
}

export default function GuarantorInbox() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data, isLoading, refetch, isRefetching } = useGuarantorStatement()

  const pledges: Pledge[] = data?.pledges ?? []
  const pending = pledges.filter((p) => p.status === 'PENDING')
  const resolved = pledges.filter((p) => p.status !== 'PENDING')

  const openRequest = (p: Pledge) => {
    router.push({
      pathname: '/(member)/guarantor-respond',
      params: {
        loanId: p.loan_id,
        guarantorId: p.id,
        borrowerName: p.borrower_name,
        saccoName: p.sacco_name,
        amount: String(p.guarantee_amount),
      },
    } as any)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Icon name="arrow-right" size={24} color={c.text} rotate={180} /></TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>My Guarantees</Text>
        </View>

        <View style={{ padding: 16 }}>
          {isLoading ? (
            <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
          ) : (
            <>
              {data ? (
                <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: c.border, gap: 10 }}>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Your guarantee capacity</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>Total savings</Text>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>KES {data.total_savings.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>Currently guaranteeing</Text>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>KES {data.active_guarantees.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>Available capacity</Text>
                    <Text style={{ color: c.success, fontSize: 12, fontWeight: '700' }}>KES {data.available_capacity.toLocaleString()}</Text>
                  </View>
                </View>
              ) : null}

              {pending.length > 0 ? (
                <>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>Needs your response</Text>
                  {pending.map((p) => (
                    <View key={p.id} style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(109, 40, 217, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="guarantor" size={20} color={c.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{p.borrower_name}</Text>
                          <Text style={{ color: c.textMuted, fontSize: 12 }}>{p.sacco_name} · KES {p.guarantee_amount.toLocaleString()}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => openRequest(p)}
                        style={{ backgroundColor: c.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Review Request</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : null}

              {resolved.length > 0 ? (
                <>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: pending.length > 0 ? 8 : 0, marginBottom: 10 }}>All guarantees</Text>
                  {resolved.map((p) => {
                    const style = STATUS_STYLE[p.status] ?? STATUS_STYLE.EXPIRED
                    return (
                      <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{p.borrower_name}</Text>
                          <Text style={{ color: c.textMuted, fontSize: 11 }}>{p.sacco_name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>KES {p.current_exposure.toLocaleString()}</Text>
                          <View style={{ backgroundColor: style.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: c.text }}>{style.label}</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </>
              ) : null}

              {pledges.length === 0 ? (
                <EmptyState
                  icon="guarantor"
                  title="No guarantees yet"
                  description="When your friends or colleagues ask you to guarantee their loans, they'll appear here."
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

function formatDate(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MemberDividendsScreen() {
  const insets = useSafeAreaInsets()

  const { data: dividendPayouts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['memberDividendPayouts'],
    queryFn: () => api.member.getDividendPayouts(),
  })

  const totalNetDividends = dividendPayouts.reduce((sum, d) => sum + d.net_dividend, 0)
  const lastCreditedAt = dividendPayouts[0]?.disbursed_at ?? null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 52 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={MINT} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: FROSTED, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow-right" size={16} color={TEXT_MUTED} className="rotate-180" />
            </TouchableOpacity>
            <View>
              <Text style={{ color: TEXT, fontSize: 19, fontWeight: '700' }}>Annual Dividends</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Dividends credited to your SACCO savings</Text>
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ backgroundColor: 'rgba(109, 40, 217, 0.2)', borderWidth: 1, borderColor: 'rgba(109, 40, 217, 0.4)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Total Dividends Received
            </Text>
            <Text style={{ color: TEXT, fontSize: 26, fontWeight: '800' }}>
              KES {totalNetDividends.toLocaleString()}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-2">
              <Icon name="check" size={14} color={MINT} />
              <Text style={{ color: MINT, fontSize: 11, fontWeight: '600' }}>
                Credited directly to your SACCO savings
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <View style={{ flex: 1, backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
                Payments
              </Text>
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700', marginTop: 3 }}>
                {dividendPayouts.length}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
                Last credited
              </Text>
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700', marginTop: 3 }}>
                {formatDate(lastCreditedAt)}
              </Text>
            </View>
          </View>

          {/* History */}
          <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
            Dividend Payments
          </Text>

          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={VIOLET} size="large" />
              <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 10 }}>Loading dividend payments...</Text>
            </View>
          ) : dividendPayouts.length === 0 ? (
            <View style={{ backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 14, padding: 24, alignItems: 'center' }}>
              <View className="mb-3 w-12 h-12 rounded-full bg-white/5 items-center justify-center">
                <Icon name="dividend" size={24} color={TEXT_MUTED} />
              </View>
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>No dividends yet</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                When your SACCO board disburses an annual dividend, the amount credited to your savings will appear here.
              </Text>
            </View>
          ) : (
            dividendPayouts.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: FROSTED_DARK,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="dividend" size={20} color={MINT} />
                    <View>
                      <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700' }}>
                        Financial Year {item.financial_year}
                      </Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>{item.sacco_name}</Text>
                    </View>
                  </View>
                  <Badge label="Credited" variant="success" />
                </View>

                <View style={{ borderTopWidth: 0.5, borderTopColor: BORDER_WHITE, paddingTop: 8, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Credited on</Text>
                    <Text style={{ color: TEXT, fontSize: 11, fontWeight: '600' }}>{formatDate(item.disbursed_at)}</Text>
                  </View>
                  {!!item.reference && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Reference</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>{item.reference}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 0.5, borderTopColor: BORDER_WHITE }}>
                    <Text style={{ color: TEXT, fontSize: 12, fontWeight: '700' }}>Amount credited</Text>
                    <Text style={{ color: MINT, fontSize: 13, fontWeight: '800' }}>KES {item.net_dividend.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))
          )}

          <Text style={{ color: TEXT_MUTED, fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 12 }}>
            Amounts shown are the net dividend credited to your savings. For the full gross / withholding-tax breakdown, contact your SACCO.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

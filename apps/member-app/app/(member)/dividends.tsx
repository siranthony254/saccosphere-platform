import { useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function MemberDividendsScreen() {
  const insets = useSafeAreaInsets()

  const { data: dividendPayouts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['memberDividendPayouts'],
    queryFn: () => api.member.getDividendPayouts(),
  })

  const totalNetDividends = dividendPayouts
    .filter((d: any) => d.status === 'DISBURSED' || d.status === 'APPROVED' || d.status === 'COMPLETED')
    .reduce((sum: number, d: any) => sum + d.net_dividend, 0)

  const totalShareCapital = dividendPayouts.length > 0 ? Math.max(...dividendPayouts.map((d: any) => d.share_capital)) : 0
  const totalTaxPaid = dividendPayouts.reduce((sum: number, d: any) => sum + d.withholding_tax, 0)

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
              <Text style={{ color: TEXT_MUTED, fontSize: 14 }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={{ color: TEXT, fontSize: 19, fontWeight: '700' }}>Annual Dividends</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Declared Board Dividends & Tax Statements</Text>
            </View>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ backgroundColor: 'rgba(109, 40, 217, 0.2)', borderWidth: 1, borderColor: 'rgba(109, 40, 217, 0.4)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Total Dividends Disbursed
            </Text>
            <Text style={{ color: TEXT, fontSize: 26, fontWeight: '800' }}>
              KES {totalNetDividends.toLocaleString()}
            </Text>
            <Text style={{ color: MINT, fontSize: 11, fontWeight: '600', marginTop: 4 }}>
              ✓ Automatically credited to your SACCO wallet
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <View style={{ flex: 1, backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
                Share Capital Base
              </Text>
              <Text style={{ color: TEXT, fontSize: 15, fontWeight: '700', marginTop: 3 }}>
                KES {totalShareCapital.toLocaleString()}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
                Withholding Tax (5%)
              </Text>
              <Text style={{ color: '#F87171', fontSize: 15, fontWeight: '700', marginTop: 3 }}>
                KES {totalTaxPaid.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Statements List Section */}
          <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>
            Dividend Statements History
          </Text>

          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={VIOLET} size="large" />
              <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 10 }}>Loading dividend statements...</Text>
            </View>
          ) : dividendPayouts.length === 0 ? (
            <View style={{ backgroundColor: FROSTED_DARK, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 14, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>💎</Text>
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>No Dividend Statements</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                Annual dividend declarations from your SACCO board will appear here automatically.
              </Text>
            </View>
          ) : (
            dividendPayouts.map((item: any) => {
              const isDisbursed = item.status === 'DISBURSED' || item.status === 'COMPLETED' || item.status === 'APPROVED'
              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: FROSTED_DARK,
                    borderWidth: 1,
                    borderColor: isDisbursed ? 'rgba(16, 185, 129, 0.3)' : BORDER_WHITE,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>💎</Text>
                      <View>
                        <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700' }}>
                          Financial Year {item.financial_year}
                        </Text>
                        {item.rate_pct > 0 && (
                          <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Dividend Rate: {item.rate_pct}% p.a.</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: isDisbursed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDisbursed ? MINT : '#F59E0B' }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={{ borderTopWidth: 0.5, borderTopColor: BORDER_WHITE, paddingTop: 8, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Eligible Share Capital</Text>
                      <Text style={{ color: TEXT, fontSize: 11, fontWeight: '600' }}>KES {item.share_capital.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Gross Dividend</Text>
                      <Text style={{ color: TEXT, fontSize: 11, fontWeight: '600' }}>KES {item.gross_dividend.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11 }}>Withholding Tax (5%)</Text>
                      <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '600' }}>-KES {item.withholding_tax.toLocaleString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 0.5, borderTopColor: BORDER_WHITE }}>
                      <Text style={{ color: TEXT, fontSize: 12, fontWeight: '700' }}>Net Dividend Disbursed</Text>
                      <Text style={{ color: MINT, fontSize: 13, fontWeight: '800' }}>KES {item.net_dividend.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

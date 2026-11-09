import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { Skeleton } from '../../components/ui/Skeleton'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

type ProtectedDepositRow = {
  sacco_id: string
  sacco_name: string
  protected_limit: string
  covered_balance: string
  amount_within_cover: string
  amount_above_cover: string
}

// Self-scoped, no sacco id needed — GET /dashboard/protected-deposit/
// (api.protectedDeposits.getMemberProtectedDeposit) resolves every one of
// the member's own approved memberships server-side.
export default function DepositProtectionScreen() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const money = useMoney()
  const { data, isLoading } = useQuery({
    queryKey: ['protected-deposit'],
    queryFn: () => api.protectedDeposits.getMemberProtectedDeposit() as Promise<ProtectedDepositRow[]>,
  })
  const rows = data ?? []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={14} color={c.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Deposit Protection</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>How much of your savings is covered per SACCO</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="security" size={16} color={c.accent} />
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>Deposit Guarantee Fund</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>
            Each SACCO you belong to protects a portion of your BOSA and FOSA savings up to a set limit. Share capital isn't covered — it's a separate, non-withdrawable membership stake, not a deposit.
          </Text>
        </View>

        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={110} borderRadius={12} />
            <Skeleton height={110} borderRadius={12} />
          </View>
        ) : rows.length === 0 ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>No active SACCO memberships yet.</Text>
          </View>
        ) : (
          rows.map((row) => {
            const covered = Number(row.covered_balance)
            const limit = Number(row.protected_limit)
            const withinCover = Number(row.amount_within_cover)
            const aboveCover = Number(row.amount_above_cover)
            const coveredPct = limit > 0 ? Math.min(100, Math.round((withinCover / limit) * 100)) : 0
            return (
              <View key={row.sacco_id} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>{row.sacco_name}</Text>

                <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden', marginBottom: 10 }}>
                  <View style={{ height: 6, width: `${coveredPct}%`, backgroundColor: aboveCover > 0 ? c.warning : c.success, borderRadius: 3 }} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Your BOSA + FOSA savings</Text>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{money(covered)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>Protected up to</Text>
                  <Text style={{ color: c.success, fontSize: 12, fontWeight: '700' }}>{money(limit)}</Text>
                </View>
                {aboveCover > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                    <Text style={{ color: c.warning, fontSize: 12 }}>Above the protected limit</Text>
                    <Text style={{ color: c.warning, fontSize: 12, fontWeight: '700' }}>{money(aboveCover)}</Text>
                  </View>
                )}
              </View>
            )
          })
        )}

        <Text style={{ color: c.textFaint, fontSize: 10, lineHeight: 15, marginTop: 4 }}>
          This is an indicator, not an active payout — the Deposit Guarantee Fund scheme takes effect once gazetted by the regulator.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

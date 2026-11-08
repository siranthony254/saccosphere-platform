import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useDashboardActivity } from '../../hooks/useDashboard'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Skeleton } from '../../components/ui/Skeleton'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

const PAGE_SIZE = 20
const MAX_LIMIT = 100

type ActivityItem = {
  type: 'PAYMENT' | 'REPAYMENT'
  amount: number
  description: string
  date: string
  sacco_name: string | null
  reference: string
}

function iconFor(type: ActivityItem['type']): IconName {
  return type === 'REPAYMENT' ? 'loan' : 'card'
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// A full, cross-SACCO activity history — merges completed payments and
// paid loan instalments (see dashboard.engines.activity_feed on the
// backend), unlike the home screen's "recent activity" card which only
// shows the member's last 10 transactions of any status.
export default function ActivityScreen() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const money = useMoney()
  const [limit, setLimit] = useState(PAGE_SIZE)
  const { data, isLoading, isFetching } = useDashboardActivity(limit)
  const items = (data ?? []) as ActivityItem[]
  const canLoadMore = limit < MAX_LIMIT && items.length >= limit

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={14} color={c.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Activity</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Payments and loan instalments across all your SACCOs</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24 }}>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={56} borderRadius={12} />
            <Skeleton height={56} borderRadius={12} />
            <Skeleton height={56} borderRadius={12} />
          </View>
        ) : items.length === 0 ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>No activity yet.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 4 }}>
            {items.map((item, index) => (
              <View
                key={`${item.reference}-${index}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: index === items.length - 1 ? 0 : 0.5, borderBottomColor: c.border }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={iconFor(item.type)} size={16} color={c.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: c.text }}>{item.description}</Text>
                  <Text style={{ fontSize: 10, color: c.textMuted }}>{item.sacco_name ?? 'Saccosphere'} · {formatDate(item.date)}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text }}>{money(item.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {canLoadMore && (
          <TouchableOpacity
            onPress={() => setLimit((l) => Math.min(l + PAGE_SIZE, MAX_LIMIT))}
            disabled={isFetching}
            style={{ marginTop: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
          >
            {isFetching ? <ActivityIndicator color={c.textMuted} /> : <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Load more</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

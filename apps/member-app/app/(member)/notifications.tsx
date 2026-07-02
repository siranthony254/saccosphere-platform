import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification } from '@saccosphere/schemas'

const TYPE_ICONS: Record<string, string> = {
  loan_approved: '✅', loan_rejected: '❌', loan_disbursed: '💰',
  guarantor_request: '🤝', guarantor_response: '👍', contribution_received: '✓',
  instalment_due: '⏰', membership_approved: '🎉', membership_rejected: '❌',
  dividend_credited: '🎉', system: '📢',
}

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

const TYPE_COLORS: Record<string, string> = {
  loan_disbursed: 'rgba(16, 185, 129, 0.15)', guarantor_request: 'rgba(109, 40, 217, 0.15)',
  instalment_due: 'rgba(245, 158, 11, 0.15)', default: FROSTED_DARK,
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications()

  const unread = notifications?.filter(n => !n.is_read) ?? []
  const read = notifications?.filter(n => n.is_read) ?? []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={MINT} />}
      >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Notifications</Text>
        <TouchableOpacity><Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>Mark all read</Text></TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: BACKGROUND }}>
        {['All', 'Loans', 'Payments', 'Alerts'].map(p => (
          <TouchableOpacity key={p} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: p === 'All' ? VIOLET : FROSTED_DARK, borderColor: p === 'All' ? VIOLET : BORDER_WHITE }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: p === 'All' ? '#fff' : TEXT_MUTED }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 14 }}>
          {[1,2,3].map(i => <View key={i} style={{ height: 80, backgroundColor: FROSTED_DARK, borderRadius: 12, marginBottom: 8 }} />)}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 14 }}>
          {unread.length > 0 && (
            <>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>New · {unread.length} unread</Text>
              {unread.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
          {read.length > 0 && (
            <>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Earlier</Text>
              {read.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  )
}

function NotifItem({ notification: n }: { notification: Notification }) {
  const iconBg = TYPE_COLORS[n.type] ?? TYPE_COLORS.default
  const icon = TYPE_ICONS[n.type] ?? '📢'
  const timeAgo = getTimeAgo(n.created_at)

  return (
    <TouchableOpacity style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, alignItems: 'flex-start', backgroundColor: !n.is_read ? 'rgba(16, 185, 129, 0.15)' : FROSTED_DARK, borderWidth: 1, borderColor: !n.is_read ? MINT : BORDER_WHITE }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: iconBg }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600', marginBottom: 2 }}>{n.title}</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>{n.body}</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{timeAgo}</Text>
      </View>
      {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginTop: 4, flexShrink: 0 }} />}
    </TouchableOpacity>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

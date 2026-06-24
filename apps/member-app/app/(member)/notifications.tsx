import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useNotifications } from '../../hooks/useNotifications'
import type { Notification } from '@saccosphere/schemas'

const TYPE_ICONS: Record<string, string> = {
  loan_approved: '✅', loan_rejected: '❌', loan_disbursed: '💰',
  guarantor_request: '🤝', guarantor_response: '👍', contribution_received: '✓',
  instalment_due: '⏰', membership_approved: '🎉', membership_rejected: '❌',
  dividend_credited: '🎉', system: '📢',
}

const TYPE_COLORS: Record<string, string> = {
  loan_disbursed: '#e6f7f1', guarantor_request: '#eff6ff',
  instalment_due: '#fef3dc', default: '#f8faf9',
}

export default function NotificationsScreen() {
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications()

  const unread = notifications?.filter(n => !n.is_read) ?? []
  const read = notifications?.filter(n => n.is_read) ?? []

  return (
    <ScrollView
      className="bg-surface2"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
    >
      <View className="flex-row justify-between items-center pt-13 px-4 pb-3 bg-surface border-b border-border">
        <Text className="text-ink text-xl font-bold">Notifications</Text>
        <TouchableOpacity><Text className="text-violet-500 text-xs font-semibold">Mark all read</Text></TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View className="flex-row gap-2 px-3.5 py-3.5 bg-surface">
        {['All', 'Loans', 'Payments', 'Alerts'].map(p => (
          <TouchableOpacity key={p} className={`px-3.5 py-1 rounded-full border ${p === 'All' ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`}>
            <Text className={`text-xs font-medium ${p === 'All' ? 'text-white' : 'text-ink-muted'}`}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="px-3.5">
          {[1,2,3].map(i => <View key={i} className="h-20 bg-border rounded-xl mb-2" />)}
        </View>
      ) : (
        <View className="px-3.5">
          {unread.length > 0 && (
            <>
              <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-2">New · {unread.length} unread</Text>
              {unread.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
          {read.length > 0 && (
            <>
              <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-2 mt-4">Earlier</Text>
              {read.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function NotifItem({ notification: n }: { notification: Notification }) {
  const iconBg = TYPE_COLORS[n.type] ?? TYPE_COLORS.default
  const icon = TYPE_ICONS[n.type] ?? '📢'
  const timeAgo = getTimeAgo(n.created_at)

  return (
    <TouchableOpacity className={`flex-row gap-3 p-3 rounded-xl mb-2 items-start ${!n.is_read ? 'bg-mint-50' : 'bg-surface'}`}>
      <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-ink text-xs font-semibold mb-0.5">{n.title}</Text>
        <Text className="text-ink-muted text-xs leading-4.5 mb-1">{n.body}</Text>
        <Text className="text-ink-faint text-xs">{timeAgo}</Text>
      </View>
      {!n.is_read && <View className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />}
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

import { useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMarkAllNotificationsRead, useNotifications } from '../../hooks/useNotifications'
import type { Notification, NotificationCategory } from '@saccosphere/schemas'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { useTheme } from '../../theme/ThemeProvider'

const CATEGORY_ICONS: Record<string, IconName> = {
  LOAN: 'loan',
  PAYMENT: 'savings',
  GUARANTOR: 'guarantor',
  DIVIDEND: 'dividend',
  ALERT: 'warning',
  LIQUIDITY_WARNING: 'warning',
  NPL_WARNING: 'warning',
  SYSTEM: 'info',
}


const CATEGORY_COLORS: Record<string, string> = {
  PAYMENT: 'rgba(16, 185, 129, 0.15)',
  GUARANTOR: 'rgba(109, 40, 217, 0.15)',
  ALERT: 'rgba(245, 158, 11, 0.15)',
  LIQUIDITY_WARNING: 'rgba(245, 158, 11, 0.15)',
  NPL_WARNING: 'rgba(245, 158, 11, 0.15)',
  default: 'transparent',
}

const FILTERS: Array<{ label: string; categories: NotificationCategory[] | null }> = [
  { label: 'All', categories: null },
  { label: 'Loans', categories: ['LOAN'] },
  { label: 'Payments', categories: ['PAYMENT', 'DIVIDEND'] },
  { label: 'Alerts', categories: ['ALERT', 'LIQUIDITY_WARNING', 'NPL_WARNING'] },
]

export default function NotificationsScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].label)

  const filtered = useMemo(() => {
    const categories = FILTERS.find((f) => f.label === activeFilter)?.categories
    if (!categories || !notifications) return notifications ?? []
    return notifications.filter((n) => categories.includes(n.category))
  }, [notifications, activeFilter])

  const unread = filtered.filter(n => !n.is_read)
  const read = filtered.filter(n => n.is_read)
  const hasUnread = (notifications ?? []).some((n) => !n.is_read)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
      >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: c.bg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Notifications</Text>
        <TouchableOpacity
          disabled={!hasUnread || markAllRead.isPending}
          onPress={() => markAllRead.mutate()}
        >
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600', opacity: !hasUnread || markAllRead.isPending ? 0.4 : 1 }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: c.bg }}>
        {FILTERS.map(({ label }) => {
          const active = label === activeFilter
          return (
            <TouchableOpacity
              key={label}
              onPress={() => setActiveFilter(label)}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: active ? c.accent : c.surface, borderColor: active ? c.accent : c.border }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: active ? '#fff' : c.textMuted }}>{label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 14 }}>
          {[1,2,3].map(i => <View key={i} style={{ height: 80, backgroundColor: c.surface, borderRadius: 12, marginBottom: 8 }} />)}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 14 }}>
          {unread.length > 0 && (
            <>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>New · {unread.length} unread</Text>
              {unread.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
          {read.length > 0 && (
            <>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Earlier</Text>
              {read.map(n => <NotifItem key={n.id} notification={n} />)}
            </>
          )}
          {unread.length === 0 && read.length === 0 && (
            <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 24 }}>No notifications in this category.</Text>
          )}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  )
}

function NotifItem({ notification: n }: { notification: Notification }) {
  const { colors: c } = useTheme()
  const iconBg = CATEGORY_COLORS[n.category] ?? c.surface
  const icon = CATEGORY_ICONS[n.category] ?? 'info'
  const timeAgo = getTimeAgo(n.created_at)

  const handlePress = () => {
    if (n.category === 'GUARANTOR') {
      router.push('/(member)/guarantor-inbox')
      return
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, alignItems: 'flex-start', backgroundColor: !n.is_read ? 'rgba(16, 185, 129, 0.15)' : c.surface, borderWidth: 1, borderColor: !n.is_read ? c.success : c.border }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: iconBg }}>
        <Icon name={icon} size={18} color={!n.is_read ? c.success : c.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginBottom: 2 }}>{n.title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>{n.message}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{timeAgo}</Text>
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

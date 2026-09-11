import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '../../hooks/useNotifications'
import { api } from '@saccosphere/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'


export default function GuarantorInbox() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications()
  const [actingOn, setActingOn] = useState<string | null>(null)

  const requests = notifications?.filter((n: any) => n.category === 'GUARANTOR' && !n.is_read) ?? []

  const handleRespond = async (notifId: string, loanId: string, action: 'approve' | 'decline') => {
    setActingOn(notifId)
    try {
      router.push({ pathname: '/(member)/guarantor-request', params: { token: loanId } })
    } catch (error) {
      Alert.alert('Error', 'Unable to process request.')
    } finally {
      setActingOn(null)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-right" size={24} color={c.text} rotate={180} /></TouchableOpacity>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Guarantor Requests</Text>
        </View>

        <View style={{ padding: 16 }}>
          {isLoading ? (
            <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <View className="mb-4 w-20 h-20 rounded-full bg-violet-500/10 items-center justify-center border border-violet-500/20">
                <Icon name="guarantor" size={40} color={c.accent} />
              </View>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No pending requests</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                When your friends or colleagues ask you to guarantee their loans, they'll appear here.
              </Text>
            </View>
          ) : (
            requests.map((n: any) => (
              <View key={n.id} style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border }}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(109, 40, 217, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="guarantor" size={20} color={c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{n.title}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>{n.message}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleRespond(n.id, (n as any).related_object_id || '', 'approve')}
                    disabled={!!actingOn}
                    style={{ flex: 1, backgroundColor: c.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Review Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotifications } from '../../hooks/useNotifications'
import { api } from '@saccosphere/api-client'
import { router } from 'expo-router'
import { useState } from 'react'

const BACKGROUND = '#06091A'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'

export default function GuarantorInbox() {
  const insets = useSafeAreaInsets()
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications()
  const [actingOn, setActingOn] = useState<string | null>(null)

  const requests = notifications?.filter(n => n.category === 'GUARANTOR' && !n.is_read) ?? []

  const handleRespond = async (notifId: string, loanId: string, action: 'approve' | 'decline') => {
    setActingOn(notifId)
    try {
      // Assuming related_object_id in notification is the loan_id
      // We need the guarantor_id which for the current user is request.user.id
      // But the endpoint expects guarantor_id. Actually backend often uses current user.
      // Let's check api-client respondToGuarantorRequest

      // For now, redirect to the existing specialized screen which handles tokens/details
      router.push({ pathname: '/(member)/guarantor-request', params: { token: loanId } })
    } catch (error) {
      Alert.alert('Error', 'Unable to process request.')
    } finally {
      setActingOn(null)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={MINT} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
          <TouchableOpacity onPress={() => router.back()}><Text style={{ color: TEXT, fontSize: 20 }}>←</Text></TouchableOpacity>
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Guarantor Requests</Text>
        </View>

        <View style={{ padding: 16 }}>
          {isLoading ? (
            <ActivityIndicator color={VIOLET} style={{ marginTop: 40 }} />
          ) : requests.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>🤝</Text>
              <Text style={{ color: TEXT, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>No pending requests</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                When your friends or colleagues ask you to guarantee their loans, they'll appear here.
              </Text>
            </View>
          ) : (
            requests.map(n => (
              <View key={n.id} style={{ backgroundColor: FROSTED_DARK, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER_WHITE }}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(109, 40, 217, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>🤝</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: TEXT, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{n.title}</Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18 }}>{n.message}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleRespond(n.id, n.related_object_id || '', 'approve')}
                    disabled={!!actingOn}
                    style={{ flex: 1, backgroundColor: VIOLET, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
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

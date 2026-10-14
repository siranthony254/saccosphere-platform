import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useRespondToShareTransfer } from '../../hooks/useExit'
import { useTheme } from '../../theme/ThemeProvider'

export default function ShareTransferRespondScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { exitRequestId } = useLocalSearchParams<{ exitRequestId?: string }>()
  const respond = useRespondToShareTransfer()

  const handle = (action: 'ACCEPT' | 'DECLINE') => {
    if (!exitRequestId) return
    respond.mutate(
      { exitRequestId, action },
      {
        onSuccess: () => {
          Alert.alert(
            action === 'ACCEPT' ? 'Transfer accepted' : 'Transfer declined',
            action === 'ACCEPT' ? 'The share capital has moved into your account.' : 'You declined this share-capital transfer.',
            [{ text: 'OK', onPress: () => router.back() }]
          )
        },
        onError: (err: any) => Alert.alert('Could not respond', err?.message || 'Please try again.'),
      }
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Share-capital transfer</Text>
      </View>

      <View style={{ padding: 16 }}>
        {!exitRequestId ? (
          <Text style={{ color: c.danger, fontSize: 13 }}>Missing transfer reference — open this from the notification that invited you.</Text>
        ) : (
          <>
            <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
              Another member who is leaving their SACCO has nominated you to receive their share capital.
              Accepting moves that amount into your own share-capital account immediately — any price you've
              agreed between yourselves is settled privately, outside SaccoSphere.
            </Text>

            <TouchableOpacity
              onPress={() => handle('ACCEPT')}
              disabled={respond.isPending}
              style={{ backgroundColor: c.success, borderRadius: 14, padding: 16, alignItems: 'center', opacity: respond.isPending ? 0.6 : 1, marginBottom: 10 }}
            >
              {respond.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Accept transfer</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handle('DECLINE')}
              disabled={respond.isPending}
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, alignItems: 'center', opacity: respond.isPending ? 0.6 : 1 }}
            >
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { useTheme } from '../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))


export default function ConfirmDisbursement() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { token: rawToken } = useLocalSearchParams()
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? ''

  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('This confirmation link is missing its token. Open the link from your SMS or notification again.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.loans.confirmDisbursement(String(token))
        if (cancelled) return
        setState('done')
        setMessage(res?.message || 'Thank you for confirming you received your loan.')
      } catch (err: any) {
        if (cancelled) return
        setState('error')
        setMessage(err?.message || 'We could not confirm this disbursement. The link may have expired (links are valid for 24 hours).')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }} edges={['bottom', 'left', 'right']}>
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 20, marginBottom: 16 }}>Confirm loan receipt</Text>

      {state === 'loading' && (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <ActivityIndicator color={c.success} />
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>Confirming…</Text>
        </View>
      )}

      {state !== 'loading' && (
        <Text style={{ color: state === 'done' ? c.success : c.text, fontSize: 13, lineHeight: 20, marginBottom: 24 }}>
          {message}
        </Text>
      )}

      {state === 'error' && !!token && (
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 24 }}>
          If you did not receive the money, raise a dispute instead.
        </Text>
      )}

      {state === 'error' && !!token && (
        <TouchableOpacity
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 }}
          onPress={() => router.replace({ pathname: '/dispute-disbursement', params: { token: String(token) } })}
        >
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>I did not receive it — raise a dispute</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace('/(member)')} style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Go to dashboard</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { KeyboardAwareScreen } from '../components/ui/KeyboardAwareScreen'
import { useTheme } from '../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function DisputeDisbursement() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { token: rawToken } = useLocalSearchParams()
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? ''

  const [reason, setReason] = useState('')
  const [state, setState] = useState<'form' | 'submitting' | 'done' | 'error'>(token ? 'form' : 'error')
  const [message, setMessage] = useState(
    token ? '' : 'This link is missing its token. Open the link from your SMS or notification again.'
  )

  const handleSubmit = async () => {
    setState('submitting')
    try {
      const res = await api.loans.disputeDisbursement(String(token), reason.trim() || undefined)
      setState('done')
      setMessage(res?.message || 'Your dispute has been logged. The SACCO and SaccoSphere will investigate.')
    } catch (err: any) {
      setState('error')
      setMessage(err?.message || 'We could not log this dispute. The link may have expired (links are valid for 24 hours).')
    }
  }

  return (
    <KeyboardAwareScreen
      background={c.bg}
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }}
    >
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 20, marginBottom: 8 }}>Report non-receipt</Text>
      <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 24 }}>
        Tell us what happened. Your SACCO will be asked to preserve all disbursement records while this is investigated.
      </Text>

      {(state === 'form' || state === 'submitting') && (
        <>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>What went wrong? (optional)</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 24, color: c.text, backgroundColor: c.surface, minHeight: 96, textAlignVertical: 'top' }}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. No M-Pesa message arrived and my balance did not change"
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={{ backgroundColor: c.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 }}
            onPress={handleSubmit}
            disabled={state === 'submitting'}
          >
            {state === 'submitting' ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Submit dispute</Text>}
          </TouchableOpacity>
        </>
      )}

      {(state === 'done' || state === 'error') && (
        <Text style={{ color: state === 'done' ? c.success : c.text, fontSize: 13, lineHeight: 20, marginBottom: 24 }}>
          {message}
        </Text>
      )}

      <TouchableOpacity onPress={() => router.replace('/(member)')} style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Go to dashboard</Text>
      </TouchableOpacity>
    </KeyboardAwareScreen>
  )
}

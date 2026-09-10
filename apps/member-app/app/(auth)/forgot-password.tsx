import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { KeyboardAwareScreen } from '../../components/ui/KeyboardAwareScreen'
import { useTheme } from '../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function ForgotPassword() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      await api.auth.requestPasswordReset(value)
      setSent(true)
      setTimeout(() => {
        router.push({ pathname: '/(auth)/reset-password', params: { identifier: value } })
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAwareScreen
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }}
    >
      <Text style={{ color: c.accent, fontWeight: '700', fontSize: 20, marginBottom: 32 }}>Saccosphere</Text>

      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Email or phone number</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, color: c.text, backgroundColor: c.surface }}
        value={value}
        onChangeText={setValue}
        placeholder="email or +254 7XX XXX XXX"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={c.textMuted}
      />

      <TouchableOpacity
        style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16, opacity: !value ? 0.5 : 1 }}
        onPress={handleReset}
        disabled={!value || loading}
      >
        {loading ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 12, fontWeight: '600' }}>Send reset link</Text>}
      </TouchableOpacity>

      {sent && (
        <View style={{ backgroundColor: c.success + '26', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.success }}>
          <Text style={{ color: c.success, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Check your inbox</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>A reset link was sent to {value}. Redirecting to reset page...</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
        <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back to login</Text>
      </TouchableOpacity>
    </KeyboardAwareScreen>
  )
}

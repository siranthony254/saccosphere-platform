import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const BACKGROUND = '#06091A'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function ForgotPassword() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND, justifyContent: 'center', paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }} edges={['bottom', 'left', 'right']}>
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 20, marginBottom: 32 }}>Saccosphere</Text>

      <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Email or phone number</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, color: TEXT, backgroundColor: FROSTED_DARK }}
        value={value}
        onChangeText={setValue}
        placeholder="email or +254 7XX XXX XXX"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={TEXT_MUTED}
      />

      <TouchableOpacity
        className={`bg-violet-500 rounded-xl p-3.5 items-center mb-4 ${!value ? 'opacity-50' : ''}`}
        onPress={handleReset}
        disabled={!value || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Send reset link</Text>}
      </TouchableOpacity>

      {sent && (
        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: MINT }}>
          <Text style={{ color: MINT, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>📧  Check your inbox</Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18 }}>A reset link was sent to {value}. Redirecting to reset page...</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
        <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>← Back to login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-surface justify-center py-5" style={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}>
      <Text className="text-violet-500 font-bold text-xl mb-8">Saccosphere</Text>

      <Text className="text-ink-soft text-xs font-medium mb-1.5">Email or phone number</Text>
      <TextInput
        className="border border-border rounded-xl p-3 text-sm mb-4 text-ink"
        value={value}
        onChangeText={setValue}
        placeholder="email or +254 7XX XXX XXX"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        className={`bg-violet-500 rounded-xl p-3.5 items-center mb-4 ${!value ? 'opacity-50' : ''}`}
        onPress={handleReset}
        disabled={!value || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Send reset link</Text>}
      </TouchableOpacity>

      {sent && (
        <View className="bg-mint-50 rounded-xl p-4 mb-4">
          <Text className="text-mint-700 text-xs font-semibold mb-1.5">📧  Check your inbox</Text>
          <Text className="text-mint-500 text-xs leading-5">A reset link was sent to {value}. Link expires in 15 minutes.</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} className="items-center">
        <Text className="text-violet-500 text-xs font-semibold">← Back to login</Text>
      </TouchableOpacity>
    </View>
  )
}

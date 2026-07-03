import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
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

export default function ResetPassword() {
  const insets = useSafeAreaInsets()
  const { identifier } = useLocalSearchParams()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleConfirmReset = async () => {
    if (!token || !newPassword) {
      Alert.alert('Error', 'Please provide both the reset token and your new password.')
      return
    }

    setLoading(true)
    try {
      await api.auth.confirmPasswordReset({ token, new_password: newPassword } as any)
      Alert.alert('Success', 'Your password has been reset successfully. You can now log in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ])
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reset password. Please verify your token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND, justifyContent: 'center', paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }} edges={['bottom', 'left', 'right']}>
      <Text style={{ color: VIOLET, fontWeight: '700', fontSize: 20, marginBottom: 8 }}>Reset Password</Text>
      <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18, marginBottom: 32 }}>
        Please enter the reset code sent to {identifier || 'your email/phone'} and your new password.
      </Text>

      <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Reset Code (Token)</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, color: TEXT, backgroundColor: FROSTED_DARK }}
        value={token}
        onChangeText={setToken}
        placeholder="e.g. 123456 or a long token"
        autoCapitalize="none"
        placeholderTextColor={TEXT_MUTED}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '500' }}>New Password</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, marginBottom: 24, backgroundColor: FROSTED_DARK }}>
        <TextInput
          style={{ flex: 1, padding: 12, fontSize: 14, color: TEXT }}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New secure password"
          secureTextEntry={!showPassword}
          placeholderTextColor={TEXT_MUTED}
        />
        <TouchableOpacity style={{ padding: 12 }} onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className={`bg-violet-500 rounded-xl p-3.5 items-center mb-4 ${(!token || !newPassword) ? 'opacity-50' : ''}`}
        onPress={handleConfirmReset}
        disabled={!token || !newPassword || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Confirm Reset</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ alignItems: 'center' }}>
        <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>← Back to login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

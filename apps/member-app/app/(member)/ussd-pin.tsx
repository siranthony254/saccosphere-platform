import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useTheme } from '../../theme/ThemeProvider'

export default function UssdPinScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()

  // The app has no way to know whether a USSD PIN already exists for this
  // member (there's no "status" endpoint) — the member tells us which case
  // applies, and the backend itself still enforces the right proof either way.
  const [mode, setMode] = useState<'first-time' | 'change'>('first-time')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [password, setPassword] = useState('')
  const [oldPin, setOldPin] = useState('')

  const setPinMutation = useMutation({
    mutationFn: () => api.auth.setUssdPin({
      pin,
      pin2,
      password: mode === 'first-time' ? password : undefined,
      old_pin: mode === 'change' ? oldPin : undefined,
    }),
    onSuccess: () => {
      Alert.alert('USSD PIN saved', 'You can now use this PIN to dial in from any feature phone.', [{ text: 'OK', onPress: () => router.back() }])
    },
    onError: (err: any) => Alert.alert('Could not save PIN', err?.message || 'Please check the details and try again.'),
  })

  const canSubmit = pin.length === 4 && pin2.length === 4 && (mode === 'first-time' ? password.length > 0 : oldPin.length === 4)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>USSD PIN</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Set or change the 4-digit PIN you'll type when you dial in from a feature phone. This PIN is separate from your account password and can only be set here — never from the USSD session itself.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['first-time', 'change'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', backgroundColor: mode === m ? c.accent : c.surface, borderColor: mode === m ? c.accent : c.border }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: mode === m ? '#fff' : c.textMuted }}>
                {m === 'first-time' ? "I'm setting this for the first time" : 'I already have a PIN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>New 4-digit PIN</Text>
            <TextInput
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 16, letterSpacing: 8, textAlign: 'center' }}
            />
          </View>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Confirm new PIN</Text>
            <TextInput
              value={pin2}
              onChangeText={(v) => setPin2(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 16, letterSpacing: 8, textAlign: 'center' }}
            />
          </View>

          {mode === 'first-time' ? (
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Your account password (proof it's you)</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 14 }}
              />
            </View>
          ) : (
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Your current USSD PIN</Text>
              <TextInput
                value={oldPin}
                onChangeText={(v) => setOldPin(v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 16, letterSpacing: 8, textAlign: 'center' }}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          disabled={!canSubmit || setPinMutation.isPending}
          onPress={() => setPinMutation.mutate()}
          style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: !canSubmit || setPinMutation.isPending ? 0.5 : 1 }}
        >
          {setPinMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Save PIN</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { api } from '@saccosphere/api-client'
import { useConsents, useSetConsent, useExportMyData, useRequestDataErasure } from '../../hooks/useConsents'
import { useLinkGoogle } from '../../hooks/useAuth'
import { GoogleSignin, isGoogleSignInConfigured, configureGoogleSignIn } from '../../lib/googleAuth'
import { Icon } from '../../components/ui/Icon'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useTheme } from '../../theme/ThemeProvider'
import { ThemePicker } from '../../components/ui/ThemePicker'


const CONSENT_COPY: Record<string, string> = {
  TERMS: 'You accept the SaccoSphere terms of use.',
  PRIVACY: 'You accept how SaccoSphere handles your personal data.',
  DATA_PROCESSING: 'Allow SaccoSphere to process your data to run your SACCO account.',
  MARKETING: 'Receive product updates and offers from SaccoSphere.',
}

function isGranted(row: any): boolean {
  if (!row?.consented) return false
  const s = String(row.status ?? '').toLowerCase()
  return s !== 'withdrawn' && s !== 'expired' && s !== 'never_given'
}

export default function PrivacyScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: consents = [], isLoading } = useConsents()
  const setConsent = useSetConsent()
  const exportData = useExportMyData()
  const erasure = useRequestDataErasure()
  const linkGoogle = useLinkGoogle()

  const [pendingType, setPendingType] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

  const balanceHidden = usePreferencesStore((s) => s.balanceHidden)
  const setBalanceHidden = usePreferencesStore((s) => s.setBalanceHidden)

  const toggle = (row: any) => {
    const next = !isGranted(row)
    setPendingType(row.consent_type)
    setConsent.mutate(
      { consentType: row.consent_type, consented: next },
      {
        onError: (e: any) => Alert.alert('Could not update', e?.message ?? 'Please try again.'),
        onSettled: () => setPendingType(null),
      }
    )
  }

  const handleExport = () => {
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        Alert.alert(
          'Your data',
          `Consent records: ${data?.consents?.count ?? 0}\nAccess-log entries: ${data?.audit_logs?.count ?? 0}\n\nA full copy has been prepared for you.`
        )
      },
      onError: (e: any) => Alert.alert('Export failed', e?.message ?? 'Please try again.'),
    })
  }

  const handleConnectGoogle = async () => {
    configureGoogleSignIn()
    if (!isGoogleSignInConfigured() || !GoogleSignin) {
      Alert.alert('Not available', 'Google sign-in is not configured for this build.')
      return
    }
    try {
      const result = await GoogleSignin.signIn()
      const idToken = result?.idToken
      if (!idToken) {
        Alert.alert('Google sign-in', 'No token was returned. Please try again.')
        return
      }
      linkGoogle.mutate(
        { id_token: idToken },
        {
          onSuccess: () => Alert.alert('Connected', 'Your Google account is now linked.'),
          onError: (e: any) => Alert.alert('Link failed', e?.message ?? 'Please try again.'),
        }
      )
    } catch (e: any) {
      if (String(e?.code ?? e?.message ?? '').includes('CANCEL')) return
      Alert.alert('Google sign-in', e?.message ?? 'Could not start Google sign-in.')
    }
  }

  const handleErasure = () => {
    if (confirmDelete.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Type DELETE', 'Type DELETE to confirm you want your data erased.')
      return
    }
    setDeleting(true)
    erasure.mutate('Member-initiated erasure request from the app.', {
      onSuccess: (res: any) => {
        const onHold = String(res?.status ?? '').toUpperCase() === 'ON_HOLD'
        Alert.alert(
          onHold ? 'Request queued' : 'Request received',
          res?.message ??
            (onHold
              ? 'Your erasure request is on hold due to a regulatory or dispute hold and will be processed when that clears.'
              : 'Your data erasure request has been processed.'),
          [{ text: 'OK', onPress: () => router.replace('/(member)') }]
        )
      },
      onError: (e: any) => Alert.alert('Request failed', e?.message ?? 'Please try again.'),
      onSettled: () => {
        setDeleting(false)
        setConfirmDelete('')
      },
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Privacy & Data</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {/* Appearance */}
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Appearance
        </Text>
        <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          {/* Theme */}
          <View style={{ padding: 14, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>Theme</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 12 }}>
              Pick an appearance, or follow your device's light / dark setting.
            </Text>
            <ThemePicker />
          </View>

          {/* Hide balances */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>Hide balances</Text>
              <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
                Mask your savings, loan and transaction amounts across the app. Tap the eye on any balance to switch it back.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setBalanceHidden(!balanceHidden)}
              accessibilityRole="switch"
              accessibilityState={{ checked: balanceHidden }}
              style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: balanceHidden ? c.success : c.surfaceAlt, borderWidth: 1, borderColor: balanceHidden ? c.success : c.border, padding: 2, justifyContent: 'center' }}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: balanceHidden ? 'flex-end' : 'flex-start' }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Consents */}
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Your consents
        </Text>
        <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          {isLoading ? (
            <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
          ) : consents.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: 12, padding: 16 }}>No consent records yet.</Text>
          ) : (
            consents.map((row: any, i: number) => {
              const granted = isGranted(row)
              const busy = setConsent.isPending && pendingType === row.consent_type
              return (
                <View
                  key={row.consent_type}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: c.border }}
                >
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                      {row.consent_type_display ?? row.consent_type}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
                      {CONSENT_COPY[row.consent_type] ?? ''}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={c.success} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => toggle(row)}
                      style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: granted ? c.success : c.surface, borderWidth: 1, borderColor: granted ? c.success : c.border, padding: 2, justifyContent: 'center' }}
                    >
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: granted ? 'flex-end' : 'flex-start' }} />
                    </TouchableOpacity>
                  )}
                </View>
              )
            })
          )}
        </View>

        {/* Connect Google */}
        <TouchableOpacity
          onPress={handleConnectGoogle}
          disabled={linkGoogle.isPending}
          style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Connect Google account</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Sign in faster next time with Google.</Text>
          </View>
          {linkGoogle.isPending ? <ActivityIndicator color={c.success} /> : <Text style={{ color: c.textMuted, fontSize: 18 }}>{'>'}</Text>}
        </TouchableOpacity>

        {/* Export */}
        <TouchableOpacity
          onPress={handleExport}
          disabled={exportData.isPending}
          style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Export my data</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Your consent history and who has accessed your records.</Text>
          </View>
          {exportData.isPending ? <ActivityIndicator color={c.success} /> : <Icon name="file" size={18} color={c.textMuted} />}
        </TouchableOpacity>

        {/* Danger zone */}
        <Text style={{ color: c.danger, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Delete my account & data
        </Text>
        <View style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
            This requests permanent erasure of your personal data. If a regulatory or dispute hold applies, the request is queued until it clears. Type DELETE to confirm.
          </Text>
          <TextInput
            value={confirmDelete}
            onChangeText={setConfirmDelete}
            placeholder="DELETE"
            autoCapitalize="characters"
            placeholderTextColor={c.textMuted}
            style={{ borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 10, padding: 12, color: c.text, backgroundColor: c.surface, marginBottom: 12 }}
          />
          <TouchableOpacity
            onPress={handleErasure}
            disabled={deleting || confirmDelete.trim().toUpperCase() !== 'DELETE'}
            style={{ backgroundColor: c.danger, borderRadius: 10, padding: 14, alignItems: 'center', opacity: deleting || confirmDelete.trim().toUpperCase() !== 'DELETE' ? 0.5 : 1 }}
          >
            {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Request data erasure</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

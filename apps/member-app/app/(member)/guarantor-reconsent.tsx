import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '../../components/ui/Icon'
import { useRequestReconsentOtp, useRespondToReconsent } from '../../hooks/useGuarantors'
import { useTheme } from '../../theme/ThemeProvider'

// A loan you're guaranteeing was restructured in a way that increases
// your exposure — by design (services.engines.loan_restructuring), that
// needs your fresh OTP-verified consent before it actually applies, same
// as the original guarantee request.
//
// Reached by a deep link carrying the restructure and your own guarantor
// row id: creating this request sends no SMS/push/in-app notice at all
// today, and there's no inbox listing for it — same reasoning
// guarantor-request.tsx documents for the external-guarantor flow.
export default function GuarantorReconsentScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { restructureId, guarantorId, borrowerName, saccoName } = useLocalSearchParams<{
    restructureId: string
    guarantorId: string
    borrowerName?: string
    saccoName?: string
  }>()

  const [otpRequested, setOtpRequested] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [done, setDone] = useState<'approved' | 'declined' | null>(null)

  const requestOtp = useRequestReconsentOtp()
  const respond = useRespondToReconsent()

  if (!restructureId || !guarantorId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Link</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Open this screen from a re-consent link you were sent.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const sendOtp = () => {
    requestOtp.mutate(
      { restructureId, guarantorId },
      {
        onSuccess: () => setOtpRequested(true),
        onError: (err: any) => Alert.alert('Could not send code', err?.message || 'Try again in a moment.'),
      }
    )
  }

  const approve = () => {
    if (!otpCode.trim()) {
      Alert.alert('Code required', 'Enter the verification code sent to your phone.')
      return
    }
    respond.mutate(
      { restructureId, guarantorId, action: 'approve', otpCode: otpCode.trim() },
      {
        onSuccess: () => setDone('approved'),
        onError: (err: any) => Alert.alert('Could not approve', err?.message || 'Please try again.'),
      }
    )
  }

  const decline = () => {
    respond.mutate(
      { restructureId, guarantorId, action: 'decline' },
      {
        onSuccess: () => setDone('declined'),
        onError: (err: any) => Alert.alert('Could not decline', err?.message || 'Please try again.'),
      }
    )
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Icon name={done === 'approved' ? 'success' : 'check'} size={40} color={done === 'approved' ? c.success : c.textMuted} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
            {done === 'approved' ? 'Re-consent approved' : 'Restructure declined'}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
            {done === 'approved'
              ? "Once every guarantor on this loan has re-consented, the restructure takes effect."
              : "Declining cancels the whole restructure — it won't be re-applied automatically."}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 }}>
            <Text style={{ color: c.onAccent, fontSize: 14, fontWeight: '800' }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Loan terms changed — re-consent needed</Text>
      <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 20 }}>
        {borrowerName ?? 'A loan you guarantee'}'s loan{saccoName ? ` at ${saccoName}` : ''} was restructured in a way that increases what you could owe. Review before you approve again.
      </Text>

      <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <Text style={{ color: c.warning, fontSize: 12, lineHeight: 18 }}>
          Your existing guarantee stays as-is unless you approve this — approving confirms you accept the loan's new, larger exposure. Declining cancels the whole restructure.
        </Text>
      </View>

      {!otpRequested ? (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={sendOtp}
            disabled={requestOtp.isPending}
            style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: c.accent, opacity: requestOtp.isPending ? 0.6 : 1 }}
          >
            {requestOtp.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>Send code to approve</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={decline}
            disabled={respond.isPending}
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            {respond.isPending ? <ActivityIndicator color={c.textFaint} /> : <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Decline (cancels the restructure)</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>Enter the verification code sent to your phone.</Text>
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            placeholder="Verification code"
            placeholderTextColor={c.textFaint}
            style={{ color: c.text, fontSize: 16, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface }}
          />
          <TouchableOpacity
            onPress={approve}
            disabled={respond.isPending || !otpCode.trim()}
            style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: c.accent, opacity: respond.isPending || !otpCode.trim() ? 0.6 : 1 }}
          >
            {respond.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>Confirm approval</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={sendOtp} disabled={requestOtp.isPending}>
            <Text style={{ color: c.accent, fontSize: 12, textAlign: 'center' }}>Resend code</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAwareScrollView>
  )
}

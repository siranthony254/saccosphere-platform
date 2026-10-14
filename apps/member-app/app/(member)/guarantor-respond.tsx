import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Icon } from '../../components/ui/Icon'
import { useRequestGuarantorOtp, useRespondToGuarantorRequest } from '../../hooks/useGuarantors'
import { useTheme } from '../../theme/ThemeProvider'

export default function GuarantorRespondScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { loanId, guarantorId, borrowerName, saccoName, amount } = useLocalSearchParams<{
    loanId: string
    guarantorId: string
    borrowerName?: string
    saccoName?: string
    amount?: string
  }>()

  const [notes, setNotes] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [done, setDone] = useState<'approved' | 'declined' | null>(null)

  const requestOtp = useRequestGuarantorOtp()
  const respond = useRespondToGuarantorRequest()

  const guaranteeAmount = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : null

  const sendOtp = () => {
    requestOtp.mutate(
      { loanId, guarantorId },
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
      { loanId, guarantorId, action: 'approve', notes: notes || undefined, otpCode: otpCode.trim() },
      {
        onSuccess: () => setDone('approved'),
        onError: (err: any) => Alert.alert('Could not approve', err?.message || 'Please try again.'),
      }
    )
  }

  const decline = () => {
    respond.mutate(
      { loanId, guarantorId, action: 'decline', notes: notes || undefined },
      {
        onSuccess: () => setDone('declined'),
        onError: (err: any) => Alert.alert('Could not decline', err?.message || 'Please try again.'),
      }
    )
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Icon name={done === 'approved' ? 'success' : 'check'} size={40} color={done === 'approved' ? c.success : c.textMuted} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
            {done === 'approved' ? 'Guarantee approved' : 'Request declined'}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
            {done === 'approved'
              ? `A portion of your savings is now held against ${borrowerName || 'this'} loan until it's repaid.`
              : 'The borrower and SACCO have been notified.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: 'transparent' }}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Guarantor request</Text>
      <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 20 }}>
        Review carefully before you approve — this freezes part of your savings until the loan is repaid.
      </Text>

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 20, gap: 8 }}>
        <Row label="Borrower" value={borrowerName || '—'} c={c} />
        <Row label="SACCO" value={saccoName || '—'} c={c} />
        <Row label="Guarantee amount" value={guaranteeAmount != null ? `KES ${guaranteeAmount.toLocaleString()}` : '—'} c={c} bold />
      </View>

      <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
        <Text style={{ color: c.warning, fontSize: 12, lineHeight: 18 }}>
          Approving places a hold on {guaranteeAmount != null ? `KES ${guaranteeAmount.toLocaleString()}` : 'this amount'} of your own
          savings until the loan is fully repaid. If the borrower defaults, your savings can be used to recover it.
        </Text>
      </View>

      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Notes (optional)
      </Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        placeholder="Any notes for the borrower or SACCO..."
        placeholderTextColor={c.textFaint}
        style={{ color: c.text, fontSize: 13, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface, marginBottom: 20 }}
      />

      {!otpRequested ? (
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={sendOtp}
            disabled={requestOtp.isPending}
            style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: c.accent, opacity: requestOtp.isPending ? 0.6 : 1 }}
          >
            {requestOtp.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Send code to approve</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={decline}
            disabled={respond.isPending}
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            {respond.isPending ? <ActivityIndicator color={c.textFaint} /> : <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Decline request</Text>}
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
            {respond.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Confirm approval</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={sendOtp} disabled={requestOtp.isPending}>
            <Text style={{ color: c.accent, fontSize: 12, textAlign: 'center' }}>Resend code</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAwareScrollView>
  )
}

function Row({ label, value, c, bold }: { label: string; value: string; c: any; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: bold ? c.accent : c.text, fontSize: 12, fontWeight: bold ? '700' : '600' }}>{value}</Text>
    </View>
  )
}

import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function GuarantorRequest() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  // The backend has no token -> details lookup for an external guarantor. The
  // borrower name, guarantee amount and SACCO come to this person in the SMS,
  // and can be passed through on an in-app deep link as params.
  const { token, borrowerName, amount, saccoName, loanProduct } = useLocalSearchParams<{
    token?: string
    borrowerName?: string
    amount?: string
    saccoName?: string
    loanProduct?: string
  }>()
  const [notes, setNotes] = useState('')
  const [agreedToLien, setAgreedToLien] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  const guaranteeAmount = amount != null && amount !== '' && !Number.isNaN(Number(amount)) ? Number(amount) : null
  const amountLabel = guaranteeAmount != null ? `KES ${guaranteeAmount.toLocaleString()}` : 'the agreed guarantee amount'

  const respond = useMutation({
    mutationFn: (action: 'accept' | 'decline') =>
      api.loans.respondToExternalGuarantorRequest(token || '', action, notes || undefined),
    onSuccess: () => {
      setHasResponded(true)
      Alert.alert('Success', 'Your response has been recorded.')
    },
    onError: (error: Error) => Alert.alert('Error', error.message),
  })

  if (!token) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
        style={{ backgroundColor: c.bg }}
      >
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Request</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            No response token provided. Please open the link from the SMS or in-app notification.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (hasResponded) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
        style={{ backgroundColor: c.bg }}
      >
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Response Recorded</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Thank you for responding to this guarantor request. The borrower and SACCO administration have been notified.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
      style={{ backgroundColor: c.bg }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Guarantor & Savings Freeze Request</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 20 }}>
          Review the request and the collateral lien warning below before you accept.
        </Text>
      </View>

      {/* Borrower & Loan Details Card */}
      <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Borrower & Loan Details</Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Borrower</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{borrowerName || 'See your SMS'}</Text>
          </View>
          {!!saccoName && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.border }}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>SACCO</Text>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{saccoName}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Loan Product</Text>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{loanProduct || 'Loan'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Requested Guarantee Amount</Text>
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>
              {guaranteeAmount != null ? `KES ${guaranteeAmount.toLocaleString()}` : 'See your SMS'}
            </Text>
          </View>
        </View>
        {!borrowerName && (
          <Text style={{ color: c.textFaint, fontSize: 10, lineHeight: 16, marginTop: 12 }}>
            The full details were sent to you by SMS. Only Accept or Decline below.
          </Text>
        )}
      </View>

      {/* Savings Freeze & Collateral Lien Warning Card */}
      <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="lock" size={16} color={c.warning} />
          <Text style={{ color: c.warning, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Savings Freeze & Lien Notice</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 12, lineHeight: 20, marginBottom: 12 }}>
          Accepting this request places a <Text style={{ fontWeight: '700', color: c.warning }}>collateral lien hold</Text> on your SACCO savings equal to <Text style={{ fontWeight: '700' }}>{amountLabel}</Text> until the loan is settled.
        </Text>

        {guaranteeAmount != null && (
          <View style={{ backgroundColor: c.surface, borderRadius: 8, padding: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: c.warning, fontSize: 11, fontWeight: '700' }}>Amount to be frozen</Text>
              <Text style={{ color: c.warning, fontSize: 11, fontWeight: '700' }}>KES {guaranteeAmount.toLocaleString()}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAgreedToLien(!agreedToLien)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 }}
        >
          <View
            style={{
              width: 20, height: 20, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
              backgroundColor: agreedToLien ? c.warning : c.surface,
              borderColor: agreedToLien ? c.warning : 'rgba(245,158,11,0.5)',
            }}
          >
            {agreedToLien && <Icon name="check" size={12} color="#ffffff" />}
          </View>
          <Text style={{ color: c.text, fontSize: 11, fontWeight: '500', flex: 1 }}>
            I acknowledge and agree to freeze {amountLabel} of my savings until the loan is settled.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Response Form Card */}
      <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Your Response</Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Notes / Conditions (Optional)</Text>
          <TextInput
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, color: c.text, fontSize: 12 }}
            placeholder="Add any notes for the borrower or SACCO..."
            placeholderTextColor={c.textFaint}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={{ gap: 10 }}>
          <TouchableOpacity
            style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: c.accent, opacity: agreedToLien && !respond.isPending ? 1 : 0.4 }}
            onPress={() => respond.mutate('accept')}
            disabled={!agreedToLien || respond.isPending}
          >
            {respond.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Agree & Accept Guarantee Hold</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' }}
            onPress={() => respond.mutate('decline')}
            disabled={respond.isPending}
          >
            {respond.isPending ? (
              <ActivityIndicator color={c.textFaint} />
            ) : (
              <Text style={{ color: c.danger, fontSize: 12, fontWeight: '600' }}>Decline Guarantee Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ color: c.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16 }}>
        By accepting, you agree to the SACCO Bylaws collateral lien rules. Funds are auto-released once the borrower repays the loan.
      </Text>
    </KeyboardAwareScrollView>
  )
}

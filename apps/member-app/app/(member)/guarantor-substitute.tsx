import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { Icon } from '../../components/ui/Icon'
import { useSearchGuarantor, useRequestGuarantorSubstitution } from '../../hooks/useGuarantors'
import { useTheme } from '../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

// Replaces an existing APPROVED guarantor on a disbursed/active/defaulted
// loan with a new one — the new guarantor then goes through the ordinary
// request/OTP-consent/approve flow (they'll see it in their own "My
// Guarantees" inbox) before the old one is released.
//
// Reached by a deep link carrying the loan and the OLD guarantor's own
// row id: there is no screen anywhere in this app that lists a loan's
// current guarantors back to the borrower (the backend has no such
// endpoint), so that id has to come from outside the app today — the
// same reasoning guarantor-request.tsx documents for its own token.
export default function GuarantorSubstitute() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { loanId, guarantorId, oldGuarantorName, guaranteeAmount } = useLocalSearchParams<{
    loanId?: string
    guarantorId?: string
    oldGuarantorName?: string
    guaranteeAmount?: string
  }>()

  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState(guaranteeAmount ?? '')
  const [submitted, setSubmitted] = useState(false)

  const search = useSearchGuarantor(loanId || '')
  const substitute = useRequestGuarantorSubstitution(loanId || '')

  const found = search.data

  if (!loanId || !guarantorId) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Link</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Open this screen from a guarantor substitution link you were sent.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Icon name="success" size={40} color={c.success} />
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Substitution requested</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
          {found?.user.full_name ?? 'The new guarantor'} will see this in their own guarantee inbox. {oldGuarantorName ?? 'The current guarantor'} is released once they accept.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: c.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Done</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
      style={{ backgroundColor: c.bg }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Replace a Guarantor</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 20 }}>
          {oldGuarantorName ? `Replacing ${oldGuarantorName}. ` : ''}Find the new guarantor by their exact phone number or member number.
        </Text>
      </View>

      <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Find New Guarantor</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Phone or member number"
            placeholderTextColor={c.textFaint}
            style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
          />
          <TouchableOpacity
            onPress={() => query.trim() && search.mutate(query.trim())}
            disabled={!query.trim() || search.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', opacity: query.trim() ? 1 : 0.5 }}
          >
            {search.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Search</Text>}
          </TouchableOpacity>
        </View>

        {search.isError && (
          <Text style={{ color: c.danger, fontSize: 12, marginTop: 10 }}>No matching member found. Check the exact phone or member number.</Text>
        )}

        {found && (
          <View style={{ marginTop: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: found.can_guarantee ? c.success : c.danger, borderRadius: 10, padding: 12 }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{found.user.full_name}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>Member {found.member_number}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 6 }}>Available guarantee capacity: KES {Number(found.available_capacity).toLocaleString()}</Text>
            {!found.can_guarantee && (
              <Text style={{ color: c.danger, fontSize: 11, marginTop: 6 }}>This member has no guarantee capacity left right now.</Text>
            )}
          </View>
        )}
      </View>

      {found?.can_guarantee && (
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Guarantee Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g. 50000"
            placeholderTextColor={c.textFaint}
            style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
          />

          <TouchableOpacity
            onPress={() => {
              const value = Number(amount)
              if (!value || value <= 0) {
                Alert.alert('Enter an amount', 'The guarantee amount must be greater than zero.')
                return
              }
              substitute.mutate(
                { guarantorId: guarantorId as string, newGuarantorUserId: found.user.id, guaranteeAmount: value },
                {
                  onSuccess: () => setSubmitted(true),
                  onError: (err: any) => Alert.alert('Could not request this substitution', err?.message || 'Please try again.'),
                }
              )
            }}
            disabled={substitute.isPending}
            style={{ marginTop: 14, backgroundColor: c.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: substitute.isPending ? 0.6 : 1 }}
          >
            {substitute.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Request Substitution</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={{ color: c.textFaint, fontSize: 10, textAlign: 'center', lineHeight: 15 }}>
        {oldGuarantorName ?? 'The current guarantor'} stays on the loan until the new guarantor accepts.
      </Text>
    </KeyboardAwareScrollView>
  )
}

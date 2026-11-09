import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { useTheme } from '../../theme/ThemeProvider'

export default function ListingDisputeScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const [selectedMembershipId, setSelectedMembershipId] = useState(activeMemberships[0]?.id ?? '')
  const [loanId, setLoanId] = useState('')
  const [statement, setStatement] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const raiseMutation = useMutation({
    mutationFn: () => api.creditbureau.raiseListingDispute({ membership_id: selectedMembershipId, loan_id: loanId || undefined, member_statement: statement || undefined }),
    onSuccess: () => { setSubmitted(true); setLoanId(''); setStatement('') },
    onError: (err: any) => Alert.alert('Could not submit dispute', err?.message || 'Please try again.'),
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Dispute a CRB Listing</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Raise a dispute about something your SACCO has reported, or is about to report, to a credit reference bureau. You can use this before a listing goes out, during the notice window, or after.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {submitted ? (
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16, gap: 8 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Dispute submitted</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Your SACCO will review it and update you once resolved.</Text>
            <TouchableOpacity onPress={() => setSubmitted(false)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Raise another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {activeMemberships.length > 1 && (
              <View style={{ gap: 6 }}>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>Which membership is this about?</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {activeMemberships.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedMembershipId(m.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: selectedMembershipId === m.id ? c.accent : c.surface, borderColor: selectedMembershipId === m.id ? c.accent : c.border }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '500', color: selectedMembershipId === m.id ? '#fff' : c.textMuted }}>{m.sacco_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Loan reference (optional)</Text>
              <TextInput
                value={loanId}
                onChangeText={setLoanId}
                autoCapitalize="none"
                placeholder="If this is about a specific loan"
                placeholderTextColor={c.textMuted}
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
              />
            </View>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Your statement</Text>
              <TextInput
                value={statement}
                onChangeText={setStatement}
                multiline
                numberOfLines={5}
                placeholder="Explain what's wrong with this listing..."
                placeholderTextColor={c.textMuted}
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13, minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
            <TouchableOpacity
              disabled={!selectedMembershipId || !statement || raiseMutation.isPending}
              onPress={() => raiseMutation.mutate()}
              style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: !selectedMembershipId || !statement ? 0.5 : 1 }}
            >
              {raiseMutation.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>Submit Dispute</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

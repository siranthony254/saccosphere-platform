import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { useTheme } from '../../theme/ThemeProvider'

export default function RepaymentPassportScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const [selectedMembershipId, setSelectedMembershipId] = useState(activeMemberships[0]?.id ?? '')
  const [recipientSaccoId, setRecipientSaccoId] = useState('')

  const { data: passports = [], isLoading } = useQuery({
    queryKey: ['repayment-passports'],
    queryFn: () => api.creditbureau.getRepaymentPassports(),
  })

  const issueMutation = useMutation({
    mutationFn: () => api.creditbureau.issueRepaymentPassport({ membership_id: selectedMembershipId, recipient_sacco_id: recipientSaccoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repayment-passports'] })
      setRecipientSaccoId('')
      Alert.alert('Passport issued', 'Share the token below with the recipient SACCO to verify it.')
    },
    onError: (err: any) => {
      if (err?.code === 'CONSENT_REQUIRED' || err?.status === 403) {
        Alert.alert('Consent required', 'You need to grant that SACCO consent to view a repayment passport before one can be issued to them.')
        return
      }
      Alert.alert('Could not issue passport', err?.message || 'Please try again.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.creditbureau.revokeRepaymentPassport(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['repayment-passports'] }) },
    onError: (err: any) => Alert.alert('Could not revoke', err?.message || 'Please try again.'),
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Repayment Passport</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Issue a signed summary of your repayment history to one named SACCO you consent to share it with. You can revoke it at any time.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {activeMemberships.length > 1 && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>Issue from which membership?</Text>
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

        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16, gap: 10 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Issue a new passport</Text>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>
            Requires your consent already on file for the exact SACCO you name below — grant that first if this fails.
          </Text>
          <TextInput
            placeholder="Recipient SACCO ID"
            placeholderTextColor={c.textMuted}
            value={recipientSaccoId}
            onChangeText={setRecipientSaccoId}
            style={{ backgroundColor: c.bg, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
          />
          <TouchableOpacity
            disabled={!selectedMembershipId || !recipientSaccoId || issueMutation.isPending}
            onPress={() => issueMutation.mutate()}
            style={{ backgroundColor: c.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: !selectedMembershipId || !recipientSaccoId ? 0.5 : 1 }}
          >
            {issueMutation.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 12, fontWeight: '700' }}>Issue Passport</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>YOUR PASSPORTS</Text>
          {isLoading ? (
            <ActivityIndicator color={c.accent} />
          ) : passports.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: 12 }}>You haven't issued any repayment passports yet.</Text>
          ) : (
            passports.map((p: any) => (
              <View key={p.id} style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16, gap: 6 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>
                  {p.token ? 'Active' : 'Revoked or expired'}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>Issued {p.issued_at} · expires {p.expires_at}</Text>
                {p.token ? (
                  <>
                    <Text style={{ color: c.textMuted, fontSize: 10 }} numberOfLines={2}>{p.token}</Text>
                    <TouchableOpacity onPress={() => revokeMutation.mutate(p.id)} style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '600' }}>Revoke</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

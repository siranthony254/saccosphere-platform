import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useFeePreview, useWithdrawSavings } from '../../hooks/usePayment'
import { useCurrentUser } from '../../store/useAuthStore'
import { useTheme } from '../../theme/ThemeProvider'


export default function WithdrawScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug?: string }>()
  const { data: membership } = useMembershipBySacco(slug ?? '')
  const user = useCurrentUser()

  const savingsQuery = useQuery({
    queryKey: ['savings', slug, membership?.sacco_id],
    queryFn: () => api.savings.list({ sacco: membership?.sacco_id ?? slug ?? '', status: 'active' }),
    enabled: Boolean(membership?.sacco_id || slug),
    staleTime: 60_000,
  })

  const savings = savingsQuery.data ?? []
  const [savingId, setSavingId] = useState<string | null>(null)
  const selectedSaving = useMemo(
    () => savings.find((s: any) => s.id === savingId) ?? savings[0] ?? null,
    [savings, savingId]
  )
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState(user?.phone_number ?? user?.phone ?? '')

  const numericAmount = Number(String(amount).replace(/[^0-9.]/g, '')) || 0
  const { data: fee } = useFeePreview({ type: 'withdrawal', amount: numericAmount })
  const withdraw = useWithdrawSavings()

  const available = Number(selectedSaving?.amount ?? 0)
  const youReceive = fee ? Math.round(fee.net_amount) : Math.max(0, numericAmount)

  const submit = () => {
    if (!membership?.sacco_id || !selectedSaving?.id) {
      Alert.alert('Not ready', 'We could not resolve your savings account. Pull to refresh and try again.')
      return
    }
    if (numericAmount < 10) {
      Alert.alert('Amount too low', 'Enter an amount of at least KES 10.')
      return
    }
    if (numericAmount > available) {
      Alert.alert('Insufficient savings', `You can withdraw up to KES ${available.toLocaleString()} from this account.`)
      return
    }
    if (!phone || phone.replace(/[^0-9]/g, '').length < 9) {
      Alert.alert('Phone required', 'Enter the M-Pesa number to receive the funds.')
      return
    }
    withdraw.mutate(
      { sacco_id: membership.sacco_id, saving_id: selectedSaving.id, amount: numericAmount, phone_number: phone },
      {
        onSuccess: () => {
          Alert.alert('Withdrawal requested', 'You will receive an M-Pesa payment shortly.', [
            { text: 'OK', onPress: () => router.back() },
          ])
        },
        onError: (e: any) => Alert.alert('Withdrawal failed', e?.message ?? 'Please try again.'),
      }
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Withdraw savings</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{membership?.sacco_name ?? slug}</Text>
      </View>

      {savingsQuery.isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : savings.length === 0 ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>No withdrawable savings account was found for this SACCO.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {savings.length > 1 ? (
            <>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>From account</Text>
              <View style={{ gap: 8, marginBottom: 20 }}>
                {savings.map((s: any) => {
                  const on = (selectedSaving?.id ?? savings[0]?.id) === s.id
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSavingId(s.id)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : c.surface }}
                    >
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{s.savings_type}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>KES {Number(s.amount ?? 0).toLocaleString()}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </>
          ) : null}

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={{ color: c.text, fontSize: 34, fontWeight: '800', borderBottomWidth: 2, borderBottomColor: c.accent, paddingBottom: 10, marginBottom: 8 }}
          />
          <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 20 }}>Available: KES {available.toLocaleString()}</Text>

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>M-Pesa number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+2547..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={{ color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface, marginBottom: 20 }}
          />

          {numericAmount >= 10 ? (
            <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 20 }}>
              <FeeRow label="Withdrawal amount" value={`KES ${numericAmount.toLocaleString()}`} />
              <FeeRow label="Platform fee" value={`KES ${(fee ? Math.round(fee.platform_fee) : 0).toLocaleString()}`} />
              <FeeRow label="You receive" value={`KES ${youReceive.toLocaleString()}`} bold />
            </View>
          ) : null}

          <TouchableOpacity
            onPress={submit}
            disabled={withdraw.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: withdraw.isPending ? 0.6 : 1 }}
          >
            {withdraw.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Withdraw to M-Pesa</Text>}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

function FeeRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: bold ? c.success : c.text, fontSize: 12, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  )
}

import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { useLoans } from '../../hooks/useLoans'
import { useInternalTransfer } from '../../hooks/usePayment'
import { useTheme } from '../../theme/ThemeProvider'

type DestinationKind = 'LOAN_REPAYMENT' | 'BOSA' | 'SHARE_CAPITAL' | 'MEMBER'

const DESTINATION_LABELS: Record<DestinationKind, string> = {
  LOAN_REPAYMENT: 'Pay off a loan',
  BOSA: 'My BOSA savings',
  SHARE_CAPITAL: 'My share capital',
  MEMBER: 'Another member',
}

// error_code values payments/transfers.py can return that deserve a
// specific message instead of the generic server one.
const TRANSFER_ERROR_MESSAGES: Record<string, string> = {
  TRANSFER_SOURCE_NOT_FOSA: 'Only a FOSA account can send an internal transfer.',
  WITHDRAWABLE_SAVINGS_NOT_ALLOWED: "This SACCO isn't licensed for withdrawable (FOSA) savings yet.",
  INSUFFICIENT_BALANCE: 'That amount is more than your available FOSA balance.',
  LOAN_NOT_REPAYABLE: 'This loan is not in a repayable status right now.',
  AMOUNT_EXCEEDS_OUTSTANDING_BALANCE: "That's more than this loan's outstanding balance.",
  MEMBER_TRANSFERS_DISABLED: "This SACCO hasn't enabled member-to-member transfers.",
  TRANSFER_BLOCKED: 'This transfer was blocked by a fraud-prevention rule.',
}

export default function TransferScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug?: string }>()
  const { data: membership } = useMembershipBySacco(slug ?? '')

  const savingsQuery = useQuery({
    queryKey: ['savings', slug, membership?.sacco_id],
    queryFn: () => api.savings.list({ sacco: membership?.sacco_id ?? slug ?? '', status: 'active' }),
    enabled: Boolean(membership?.sacco_id || slug),
    staleTime: 60_000,
  })
  const { data: loans = [] } = useLoans({ sacco: slug })

  const savings = savingsQuery.data ?? []
  // Backend rule: a transfer can only ever be sourced from a FOSA account —
  // BOSA/share-capital debits are blocked outright (only the membership
  // exit process can move those).
  const fosaAccount = useMemo(
    () => savings.find((s: any) => String(s.savings_type).toUpperCase() === 'FOSA') ?? null,
    [savings]
  )
  const bosaAccount = useMemo(
    () => savings.find((s: any) => String(s.savings_type).toUpperCase() === 'BOSA') ?? null,
    [savings]
  )
  const shareCapitalAccount = useMemo(
    () => savings.find((s: any) => String(s.savings_type).toUpperCase() === 'SHARE_CAPITAL') ?? null,
    [savings]
  )
  const repayableLoans = useMemo(
    () => loans.filter((l: any) => Number(l.balance_remaining ?? 0) > 0),
    [loans]
  )

  const [destinationKind, setDestinationKind] = useState<DestinationKind>('LOAN_REPAYMENT')
  const [loanId, setLoanId] = useState<string | null>(null)
  const [memberNumber, setMemberNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState<{ reference: string; amount: number; source_balance: number } | null>(null)

  const transfer = useInternalTransfer()
  const numericAmount = Number(String(amount).replace(/[^0-9.]/g, '')) || 0
  const available = Number(fosaAccount?.amount ?? 0)
  const selectedLoan = loanId ? repayableLoans.find((l: any) => l.id === loanId) : repayableLoans[0]

  const submit = () => {
    if (!fosaAccount?.id) {
      Alert.alert('No FOSA account', 'You need an active FOSA savings account to send a transfer.')
      return
    }
    if (numericAmount <= 0) {
      Alert.alert('Enter amount', 'Enter an amount greater than zero.')
      return
    }
    if (numericAmount > available) {
      Alert.alert('Insufficient balance', `You can transfer up to KES ${available.toLocaleString()} from FOSA.`)
      return
    }
    if (destinationKind === 'LOAN_REPAYMENT' && !selectedLoan) {
      Alert.alert('No loan selected', 'Select a loan to repay.')
      return
    }
    if (destinationKind === 'BOSA' && !bosaAccount) {
      Alert.alert('No BOSA account', 'You need an active BOSA savings account for this.')
      return
    }
    if (destinationKind === 'SHARE_CAPITAL' && !shareCapitalAccount) {
      Alert.alert('No share capital account', 'You need an active share capital account for this.')
      return
    }
    if (destinationKind === 'MEMBER' && !memberNumber.trim()) {
      Alert.alert('Member number required', "Enter the recipient's member number.")
      return
    }

    transfer.mutate(
      {
        source_saving_id: fosaAccount.id,
        destination_kind: destinationKind,
        amount: numericAmount,
        ...(destinationKind === 'LOAN_REPAYMENT' ? { destination_id: selectedLoan?.id } : {}),
        ...(destinationKind === 'BOSA' ? { destination_id: bosaAccount?.id } : {}),
        ...(destinationKind === 'SHARE_CAPITAL' ? { destination_id: shareCapitalAccount?.id } : {}),
        ...(destinationKind === 'MEMBER' ? { destination_member_number: memberNumber.trim() } : {}),
      },
      {
        onSuccess: (res) => setResult(res),
        onError: (err: any) => {
          const message = (err?.code && TRANSFER_ERROR_MESSAGES[err.code]) || err?.message || 'Please try again.'
          const correlation = err?.correlationId ? `\n\nReference: ${err.correlationId}` : ''
          Alert.alert('Transfer failed', message + correlation)
        },
      }
    )
  }

  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Transfer complete</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
            KES {result.amount.toLocaleString()} moved to {DESTINATION_LABELS[destinationKind].toLowerCase()}.{'\n'}
            Remaining FOSA balance: KES {result.source_balance.toLocaleString()}.
          </Text>
          <Text style={{ color: c.textFaint, fontSize: 11 }}>Ref: {result.reference}</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Transfer between accounts</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{membership?.sacco_name ?? slug}</Text>
      </View>

      {savingsQuery.isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : !fosaAccount ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            You need an active FOSA savings account to send an internal transfer — this is always the source.
          </Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>From</Text>
          <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, marginBottom: 20 }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>FOSA savings</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Available: KES {available.toLocaleString()}</Text>
          </View>

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>To</Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {(Object.keys(DESTINATION_LABELS) as DestinationKind[]).map((kind) => {
              const on = destinationKind === kind
              const disabled = (kind === 'BOSA' && !bosaAccount) || (kind === 'SHARE_CAPITAL' && !shareCapitalAccount) || (kind === 'LOAN_REPAYMENT' && repayableLoans.length === 0)
              return (
                <TouchableOpacity
                  key={kind}
                  onPress={() => !disabled && setDestinationKind(kind)}
                  disabled={disabled}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : c.surface, opacity: disabled ? 0.4 : 1 }}
                >
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{DESTINATION_LABELS[kind]}</Text>
                  {disabled ? <Text style={{ color: c.textFaint, fontSize: 11 }}>Not available</Text> : null}
                </TouchableOpacity>
              )
            })}
          </View>

          {destinationKind === 'LOAN_REPAYMENT' && repayableLoans.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Which loan</Text>
              <View style={{ gap: 8 }}>
                {repayableLoans.map((l: any) => {
                  const on = (loanId ?? repayableLoans[0]?.id) === l.id
                  return (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => setLoanId(l.id)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : c.surface }}
                    >
                      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{l.loan_product_label}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>KES {Number(l.balance_remaining ?? 0).toLocaleString()}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ) : null}

          {destinationKind === 'MEMBER' ? (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recipient's member number</Text>
              <TextInput
                value={memberNumber}
                onChangeText={setMemberNumber}
                placeholder="e.g. MB-001234"
                placeholderTextColor={c.textFaint}
                style={{ color: c.text, fontSize: 15, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface }}
              />
              <Text style={{ color: c.textFaint, fontSize: 11, marginTop: 6 }}>
                Not the short paybill number on your "how to pay" screen — this is your SACCO membership number.
              </Text>
            </View>
          ) : null}

          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Amount (KES)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={c.textFaint}
            style={{ color: c.text, fontSize: 34, fontWeight: '800', borderBottomWidth: 2, borderBottomColor: c.accent, paddingBottom: 10, marginBottom: 20 }}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={transfer.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: transfer.isPending ? 0.6 : 1 }}
          >
            {transfer.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Transfer</Text>}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      )}
    </SafeAreaView>
  )
}

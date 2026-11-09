import { useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, generateIdempotencyKey } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { Skeleton } from '../../components/ui/Skeleton'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Setting up',
  PENDING_CONFIRMATION: 'Waiting for M-Pesa confirmation',
  ACTIVE: 'Active',
  FAILED: 'Failed',
  CANCEL_REQUESTED: 'Cancelling',
  CANCELLED: 'Cancelled',
}

const LIVE_STATUSES = ['DRAFT', 'PENDING_CONFIRMATION', 'ACTIVE', 'CANCEL_REQUESTED']

// Ratiba (M-Pesa's own standing-order product): a recurring auto-payment
// into one of this member's own payment targets (a loan or savings
// account). Self-scoped end to end — no sacco id needed anywhere here.
export default function StandingOrdersScreen() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const money = useMoney()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [targetAliasId, setTargetAliasId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey())

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['standing-orders'],
    queryFn: () => api.standingOrders.getOrders(),
  })

  const { data: targets, isLoading: isTargetsLoading } = useQuery({
    queryKey: ['standing-order-targets'],
    queryFn: () => api.standingOrders.getEligibleTargets(),
    enabled: showForm,
  })

  const selectedTarget = useMemo(() => targets?.find((t) => t.alias_id === targetAliasId) ?? null, [targets, targetAliasId])
  const hasConsent = selectedTarget?.consent_status === 'active'

  const consentMutation = useMutation({
    mutationFn: () => api.account.giveConsent({ consent_type: 'STANDING_ORDER', consented: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['standing-order-targets'] }),
    onError: (error: Error) => Alert.alert('Error', error.message),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.standingOrders.createOrder(
        { target_alias_id: targetAliasId as string, name, frequency, amount: Number(amount), start_date: startDate, end_date: endDate },
        idempotencyKey
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standing-orders'] })
      setShowForm(false)
      setTargetAliasId(null)
      setName('')
      setAmount('')
      setStartDate('')
      setEndDate('')
      setIdempotencyKey(generateIdempotencyKey())
      Alert.alert('Standing order set up', "You'll get an M-Pesa prompt to confirm it.")
    },
    onError: (error: any) => {
      if (error?.code === 'NO_CONSENT') {
        Alert.alert('Consent needed', 'Agree to standing-order terms first, then try again.')
        return
      }
      Alert.alert('Could not set this up', error.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => api.standingOrders.cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['standing-orders'] }),
    onError: (error: Error) => Alert.alert('Error', error.message),
  })

  const canSubmit = targetAliasId && hasConsent && name && amount && startDate && endDate

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => (showForm ? setShowForm(false) : router.back())} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="arrow-right" size={14} color={c.text} />
            </TouchableOpacity>
            <View>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Standing Orders</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Automatic M-Pesa payments on a schedule</Text>
            </View>
          </View>
          {!showForm && (
            <TouchableOpacity onPress={() => setShowForm(true)} style={{ backgroundColor: c.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showForm ? (
        <KeyboardAwareScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}
          style={{ backgroundColor: c.bg }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
        >
          <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, gap: 12 }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>Pay Into</Text>
            {isTargetsLoading ? (
              <ActivityIndicator color={c.accent} />
            ) : (targets ?? []).length === 0 ? (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>No eligible payment targets right now. Your SACCO may not have standing orders enabled yet.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {(targets ?? []).map((t) => {
                  const selected = targetAliasId === t.alias_id
                  return (
                    <TouchableOpacity
                      key={t.alias_id}
                      onPress={() => setTargetAliasId(t.alias_id)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: selected ? c.accent : c.border, backgroundColor: selected ? 'rgba(109,40,217,0.08)' : c.surface }}
                    >
                      <View>
                        <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{t.alias}</Text>
                        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{t.sacco} · {t.target_type}</Text>
                      </View>
                      {selected && <Icon name="check" size={14} color={c.accent} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {selectedTarget && !hasConsent && (
              <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 10, padding: 12, gap: 8 }}>
                <Text style={{ color: c.text, fontSize: 11, lineHeight: 17 }}>
                  You need to agree to standing-order terms before setting one up: an automatic M-Pesa payment will be requested from you on each due date, which you can cancel at any time.
                </Text>
                <TouchableOpacity
                  onPress={() => consentMutation.mutate()}
                  disabled={consentMutation.isPending}
                  style={{ backgroundColor: c.warning, borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}
                >
                  {consentMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>I Agree — Enable Standing Orders</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectedTarget && hasConsent && (
            <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>Schedule</Text>
              <View>
                <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Name (so you recognize it later)</Text>
                <TextInputField value={name} onChangeText={setName} placeholder="e.g. Monthly savings top-up" />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['WEEKLY', 'MONTHLY'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFrequency(f)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: frequency === f ? c.accent : c.border, backgroundColor: frequency === f ? 'rgba(109,40,217,0.08)' : c.surface }}
                  >
                    <Text style={{ color: frequency === f ? c.accent : c.text, fontSize: 12, fontWeight: '600' }}>{f === 'WEEKLY' ? 'Weekly' : 'Monthly'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View>
                <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Amount (KES)</Text>
                <TextInputField value={amount} onChangeText={setAmount} placeholder="e.g. 2000" keyboardType="numeric" />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>Start Date</Text>
                  <TextInputField value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>End Date</Text>
                  <TextInputField value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => createMutation.mutate()}
                disabled={!canSubmit || createMutation.isPending}
                style={{ backgroundColor: c.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: canSubmit && !createMutation.isPending ? 1 : 0.4 }}
              >
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Set Up Standing Order</Text>}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}>
          {isOrdersLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton height={90} borderRadius={12} />
              <Skeleton height={90} borderRadius={12} />
            </View>
          ) : (orders ?? []).length === 0 ? (
            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 24, alignItems: 'center' }}>
              <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center' }}>No standing orders yet. Set one up to automate a recurring payment.</Text>
            </View>
          ) : (
            (orders ?? []).map((o: any) => (
              <View key={o.id} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>{o.name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{o.frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'} · {money(o.amount)}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.surfaceAlt }}>
                    <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '600' }}>{STATUS_LABELS[o.status] ?? o.status}</Text>
                  </View>
                </View>
                {!!o.failure_reason && (
                  <Text style={{ color: c.danger, fontSize: 11, marginTop: 8 }}>{o.failure_reason}</Text>
                )}
                {o.missed_periods > 0 && (
                  <Text style={{ color: c.warning, fontSize: 11, marginTop: 6 }}>{o.missed_periods} missed payment{o.missed_periods === 1 ? '' : 's'} so far.</Text>
                )}
                {LIVE_STATUSES.includes(o.status) && o.status !== 'CANCEL_REQUESTED' && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Cancel this standing order?', o.name, [
                        { text: 'Keep it', style: 'cancel' },
                        { text: 'Cancel order', style: 'destructive', onPress: () => cancelMutation.mutate(o.id) },
                      ])
                    }
                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ color: c.danger, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function TextInputField({ value, onChangeText, placeholder, keyboardType }: { value: string; onChangeText: (v: string) => void; placeholder: string; keyboardType?: 'numeric' }) {
  const { colors: c } = useTheme()
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textFaint}
      keyboardType={keyboardType}
      style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
    />
  )
}

import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMembershipBySacco } from '../../../../hooks/useMembership'
import { useCancelExit, useExitStatus, useRequestExit } from '../../../../hooks/useExit'
import { useMoney } from '../../../../lib/money'
import { useTheme } from '../../../../theme/ThemeProvider'

const BLOCKER_LABELS: Record<string, string> = {
  LOAN_IN_FLIGHT: 'A loan application or disbursement is still in progress',
  LOAN_EXCEEDS_DEPOSITS: 'An outstanding loan is larger than your BOSA + FOSA deposits',
  OPEN_GUARANTEE: "You're still guaranteeing someone else's loan",
}

const STATUS_COPY: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  NOTICE_PERIOD: { label: 'Notice period', tone: 'warning' },
  PENDING_SETTLEMENT: { label: 'Pending settlement — blocked', tone: 'warning' },
  READY_FOR_REFUND: { label: 'Refund queued', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
}

export default function MembershipExitScreen() {
  const { colors: c } = useTheme()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: membership } = useMembershipBySacco(slug ?? '')
  const { data: exitStatus, isLoading, error, refetch } = useExitStatus(membership?.id ?? null)
  const requestExit = useRequestExit(membership?.id ?? null)
  const cancelExit = useCancelExit(membership?.id ?? null)
  const [reason, setReason] = useState('')

  const notFound = (error as any)?.status === 404

  const handleRequestExit = () => {
    Alert.alert(
      'Leave this SACCO?',
      "This starts your notice period. Your outstanding loans and open guarantees must be cleared before your deposits can be refunded. You can cancel anytime while still in the notice period.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start exit',
          style: 'destructive',
          onPress: () =>
            requestExit.mutate(reason.trim() || undefined, {
              onError: (err: any) => Alert.alert('Could not start exit', err?.message || 'Please try again.'),
            }),
        },
      ]
    )
  }

  const handleCancel = () => {
    Alert.alert('Cancel your exit?', 'Your membership will stay active as normal.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel exit',
        onPress: () =>
          cancelExit.mutate(undefined, {
            onError: (err: any) => Alert.alert('Could not cancel', err?.message || 'Please try again.'),
          }),
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Leave {membership?.sacco_name ?? slug}</Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          {!exitStatus || notFound ? (
            <>
              <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 20 }}>
                Leaving starts a notice period (set by your SACCO, typically 60 days). Any outstanding loan is
                offset against your BOSA/FOSA deposits first; share capital is never used for that and
                transfers to another member instead of being refunded. Once the notice period elapses and
                nothing is blocking it, your remaining deposits are queued for refund.
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Reason (optional)
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Why are you leaving?"
                placeholderTextColor={c.textFaint}
                multiline
                style={{ color: c.text, fontSize: 14, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.surface, minHeight: 80, marginBottom: 20 }}
              />
              <TouchableOpacity
                onPress={handleRequestExit}
                disabled={requestExit.isPending}
                style={{ backgroundColor: c.danger, borderRadius: 14, padding: 16, alignItems: 'center', opacity: requestExit.isPending ? 0.6 : 1 }}
              >
                {requestExit.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Start exit notice</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Status</Text>
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: STATUS_COPY[exitStatus.status]?.tone === 'success' ? c.success : STATUS_COPY[exitStatus.status]?.tone === 'warning' ? c.warning : c.textMuted,
                  }}>
                    {STATUS_COPY[exitStatus.status]?.label ?? exitStatus.status}
                  </Text>
                </View>
                {exitStatus.earliest_exit_date ? (
                  <Row label="Earliest exit date" value={new Date(exitStatus.earliest_exit_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} c={c} />
                ) : null}
                {exitStatus.loan_offset_amount != null ? <Row label="Loan offset applied" value={money(exitStatus.loan_offset_amount)} c={c} /> : null}
                {exitStatus.net_refund_amount != null ? <Row label="Net refund amount" value={money(exitStatus.net_refund_amount)} c={c} /> : null}
                {exitStatus.share_capital_amount != null ? <Row label="Share capital" value={money(exitStatus.share_capital_amount)} c={c} /> : null}
                {exitStatus.share_transfer_buyer_name ? (
                  <Row
                    label="Share transfer to"
                    value={`${exitStatus.share_transfer_buyer_name}${exitStatus.share_transfer_buyer_consented_at ? ' (accepted)' : exitStatus.share_transfer_declined_at ? ' (declined)' : ' (pending)'}`}
                    c={c}
                  />
                ) : null}
              </View>

              {exitStatus.blockers.length > 0 ? (
                <View style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: 16, marginBottom: 16 }}>
                  <Text style={{ color: c.warning, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    What's blocking your exit
                  </Text>
                  {exitStatus.blockers.map((b: { code: string; detail: string }, i: number) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{BLOCKER_LABELS[b.code] ?? b.code}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 }}>{b.detail}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {exitStatus.refund_entries.length > 0 ? (
                <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 16 }}>
                  <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Refund</Text>
                  {exitStatus.refund_entries.map((e: { id: string; payout_method: string; status: string; amount: number }) => (
                    <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>{e.payout_method} · {e.status}</Text>
                      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{money(e.amount)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {exitStatus.status === 'NOTICE_PERIOD' ? (
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={cancelExit.isPending}
                  style={{ borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, alignItems: 'center', opacity: cancelExit.isPending ? 0.6 : 1 }}
                >
                  {cancelExit.isPending ? <ActivityIndicator color={c.text} /> : <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Cancel my exit</Text>}
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Refresh status</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Row({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{value}</Text>
    </View>
  )
}

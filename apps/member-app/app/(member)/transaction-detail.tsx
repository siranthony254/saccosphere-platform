import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useTransaction } from '../../hooks/useTransactions'
import { Badge } from '../../components/ui/Badge'
import { useMoney } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'


const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  completed: 'success',
  pending: 'warning',
  processing: 'warning',
  failed: 'error',
  cancelled: 'error',
  reversed: 'error',
}

export default function TransactionDetailScreen() {
  const { colors: c } = useTheme()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { data: txn, isLoading } = useTransaction(id ?? '')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Transaction</Text>
      </View>

      {isLoading || !txn ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: txn.direction === 'credit' ? c.success : c.danger, fontSize: 30, fontWeight: '800' }}>
              {txn.direction === 'credit' ? '+' : '-'}{money(txn.amount)}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{txn.description}</Text>
            <View style={{ marginTop: 8 }}>
              <Badge label={txn.status} variant={STATUS_VARIANT[txn.status] ?? 'neutral'} />
            </View>
          </View>

          <View style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 16 }}>
            <Row label="Type" value={txn.txn_type.replace(/_/g, ' ')} />
            <Row label="SACCO" value={txn.sacco_name || '—'} />
            <Row label="Method" value={txn.payment_method === 'mpesa' ? 'M-Pesa' : txn.payment_method} />
            {txn.platform_fee > 0 ? <Row label="Platform fee" value={money(txn.platform_fee)} /> : null}
            {txn.balance_after > 0 ? <Row label="Balance after" value={money(txn.balance_after)} /> : null}
            <Row label="Reference" value={txn.ref || '—'} />
            {txn.payment_ref ? <Row label="M-Pesa ref" value={txn.payment_ref} /> : null}
            <Row
              label="Date"
              value={new Date(txn.date).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors: c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

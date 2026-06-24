import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useTransactions } from '../../hooks/useTransactions'
import type { Transaction } from '@saccosphere/schemas'

const FILTERS = ['All', 'Contributions', 'Loans', 'Dividends']

export default function StatementScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [month, setMonth] = useState('April 2024')
  const [filter, setFilter] = useState('All')
  const { data: transactions, isLoading } = useTransactions({ sacco: slug })

  const filtered = transactions?.filter(t => {
    if (filter === 'Contributions') return t.txn_type === 'contribution'
    if (filter === 'Loans') return t.txn_type === 'loan_repayment' || t.txn_type === 'loan_disbursement'
    if (filter === 'Dividends') return t.txn_type === 'dividend'
    return true
  }) ?? []

  const totalCredits = filtered.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebits  = filtered.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0)

  return (
    <ScrollView className="bg-surface2">
      {/* Controls */}
      <View className="flex-row justify-between items-center px-3.5 py-3.5 bg-surface border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => {}}><Text className="text-violet-500 text-lg font-semibold">←</Text></TouchableOpacity>
          <Text className="text-ink text-base font-semibold">{month}</Text>
          <TouchableOpacity onPress={() => {}}><Text className="text-violet-500 text-lg font-semibold">→</Text></TouchableOpacity>
        </View>
        <TouchableOpacity className="border border-violet-500 rounded-lg px-3.5 py-1.5">
          <Text className="text-violet-500 text-xs font-semibold">PDF ↓</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-3.5 border border-border">
        {[
          { label: 'Opening balance', value: 'KES 135,000' },
          { label: 'Total contributions', value: `+KES ${totalCredits.toLocaleString()}`, color: '#10B981' },
          { label: 'Loan repayments', value: `-KES ${totalDebits.toLocaleString()}`, color: '#ef4444' },
          { label: 'Closing balance', value: `KES ${(135000 + totalCredits - totalDebits).toLocaleString()}`, bold: true },
        ].map(row => (
          <View key={row.label} className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className={`text-xs font-semibold text-ink ${row.color ? row.color : ''} ${row.bold ? 'text-base' : ''}`}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-surface py-2.5" contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} className={`px-3.5 py-1.5 rounded-full border ${filter === f ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'}`} onPress={() => setFilter(f)}>
            <Text className={`text-xs font-medium ${filter === f ? 'text-white' : 'text-ink-muted'}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction list */}
      <View className="px-3.5">
        {isLoading ? (
          [1,2,3].map(i => <View key={i} className="h-14 bg-border rounded-lg mb-1.5" />)
        ) : filtered.length === 0 ? (
          <Text className="text-center text-ink-faint px-8 py-8 text-xs">No transactions for this period.</Text>
        ) : (
          filtered.map(t => <TxnRow key={t.id} txn={t} />)
        )}
      </View>
    </ScrollView>
  )
}

function TxnRow({ txn: t }: { txn: Transaction }) {
  const isCredit = t.direction === 'credit'
  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border bg-surface px-3 rounded-lg mb-1">
      <View className={`w-8.5 h-8.5 rounded-full items-center justify-center ${isCredit ? 'bg-mint-50' : 'bg-red-50'}`}>
        <Text>{isCredit ? '↑' : '↓'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-ink text-xs font-medium">{t.description}</Text>
        <Text className="text-ink-faint text-xs">{new Date(t.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</Text>
      </View>
      <Text className={`text-xs font-semibold ${isCredit ? 'text-mint-500' : 'text-red-500'}`}>
        {isCredit ? '+' : '-'}{t.amount.toLocaleString()}
      </Text>
    </View>
  )
}
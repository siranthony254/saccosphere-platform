import { useState } from 'react'
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@saccosphere/api-client'
import { useTransactions } from '../../hooks/useTransactions'
import { useMembershipBySacco } from '../../hooks/useMembership'
import type { Transaction } from '@saccosphere/schemas'

const FILTERS = ['All', 'Contributions', 'Loans', 'Dividends']

export default function StatementScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [monthDate, setMonthDate] = useState(startOfMonth(new Date()))
  const [filter, setFilter] = useState('All')
  const [isDownloading, setIsDownloading] = useState(false)
  const { data: transactions, isLoading } = useTransactions({ sacco: slug })
  const { data: membership } = useMembershipBySacco(slug)

  const month = monthDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
  const statementRange = getMonthRange(monthDate)

  const filtered =
    transactions?.filter((t) => {
      if (filter === 'Contributions') return t.txn_type === 'contribution'
      if (filter === 'Loans') return t.txn_type === 'loan_repayment' || t.txn_type === 'loan_disbursement'
      if (filter === 'Dividends') return t.txn_type === 'dividend'
      return true
    }) ?? []

  const totalCredits = filtered.filter((t) => t.direction === 'credit').reduce((sum, t) => sum + t.amount, 0)
  const totalDebits = filtered.filter((t) => t.direction === 'debit').reduce((sum, t) => sum + t.amount, 0)

  const handleDownload = async () => {
    if (!membership?.sacco_id) {
      Alert.alert('Statement unavailable', 'We could not resolve this SACCO membership yet. Pull to refresh and try again.')
      return
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Download available on web', 'Open Saccosphere in a browser to download the PDF statement.')
      return
    }

    setIsDownloading(true)
    try {
      const { blob, filename } = await api.member.downloadStatementPdf({
        sacco_id: membership.sacco_id,
        from_date: statementRange.from,
        to_date: statementRange.to,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      Alert.alert('Download failed', 'Unable to download the statement PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <ScrollView className="bg-surface2">
      <View className="flex-row justify-between items-center px-3.5 py-3.5 bg-surface border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => setMonthDate((current) => addMonths(current, -1))}>
            <Text className="text-violet-500 text-lg font-semibold">{'<'}</Text>
          </TouchableOpacity>
          <Text className="text-ink text-base font-semibold">{month}</Text>
          <TouchableOpacity onPress={() => setMonthDate((current) => addMonths(current, 1))}>
            <Text className="text-violet-500 text-lg font-semibold">{'>'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          className={`border border-violet-500 rounded-lg px-3.5 py-1.5 ${isDownloading ? 'opacity-50' : ''}`}
          onPress={handleDownload}
          disabled={isDownloading}
        >
          <Text className="text-violet-500 text-xs font-semibold">
            {isDownloading ? 'Downloading...' : 'PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-3.5 border border-border">
        {[
          { label: 'Opening balance', value: 'KES 135,000' },
          { label: 'Total contributions', value: `+KES ${totalCredits.toLocaleString()}`, color: '#10B981' },
          { label: 'Loan repayments', value: `-KES ${totalDebits.toLocaleString()}`, color: '#ef4444' },
          { label: 'Closing balance', value: `KES ${(135000 + totalCredits - totalDebits).toLocaleString()}`, bold: true },
        ].map((row) => (
          <View key={row.label} className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className={`text-xs font-semibold text-ink ${row.bold ? 'text-base' : ''}`} style={{ color: row.color }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-surface py-2.5"
        contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
      >
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item}
            className={`px-3.5 py-1.5 rounded-full border ${
              filter === item ? 'bg-violet-500 border-violet-500' : 'bg-surface border-border'
            }`}
            onPress={() => setFilter(item)}
          >
            <Text className={`text-xs font-medium ${filter === item ? 'text-white' : 'text-ink-muted'}`}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="px-3.5">
        {isLoading ? (
          [1, 2, 3].map((item) => <View key={item} className="h-14 bg-border rounded-lg mb-1.5" />)
        ) : filtered.length === 0 ? (
          <Text className="text-center text-ink-faint px-8 py-8 text-xs">No transactions for this period.</Text>
        ) : (
          filtered.map((transaction) => <TxnRow key={transaction.id} txn={transaction} />)
        )}
      </View>
    </ScrollView>
  )
}

function TxnRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.direction === 'credit'
  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border bg-surface px-3 rounded-lg mb-1">
      <View className={`w-8.5 h-8.5 rounded-full items-center justify-center ${isCredit ? 'bg-mint-50' : 'bg-red-50'}`}>
        <Text>{isCredit ? '+' : '-'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-ink text-xs font-medium">{txn.description}</Text>
        <Text className="text-ink-faint text-xs">
          {new Date(txn.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text className={`text-xs font-semibold ${isCredit ? 'text-mint-500' : 'text-red-500'}`}>
        {isCredit ? '+' : '-'}{txn.amount.toLocaleString()}
      </Text>
    </View>
  )
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function getMonthRange(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    from: toIsoDate(first),
    to: toIsoDate(last),
  }
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

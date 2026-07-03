import { useState } from 'react'
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { useTransactions } from '../../hooks/useTransactions'
import { useMembershipBySacco } from '../../hooks/useMembership'
import type { Transaction } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../DeepSpaceBackground'

const FILTERS = ['All', 'Contributions', 'Loans', 'Dividends']

export default function StatementScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
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
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-white/10">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
              <Text className="text-white/80 text-xs">←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-white text-base font-bold">Statement</Text>
              <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{membership?.sacco_name || 'SACCO'}</Text>
            </View>
          </View>
          <TouchableOpacity
            className={`bg-violet-600 rounded-lg px-4 py-2 ${isDownloading ? 'opacity-50' : ''}`}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Text className="text-white text-xs font-bold uppercase tracking-tighter">
              {isDownloading ? '...' : 'PDF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View className="flex-row justify-center items-center py-5 gap-6">
          <TouchableOpacity onPress={() => setMonthDate((current) => addMonths(current, -1))}>
            <Text className="text-violet-400 text-2xl font-light">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold min-w-[140px] text-center">{month}</Text>
          <TouchableOpacity onPress={() => setMonthDate((current) => addMonths(current, 1))}>
            <Text className="text-violet-400 text-2xl font-light">›</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View className="bg-white/5 mx-4 mb-6 rounded-2xl p-4 border border-white/10">
          {[
            { label: 'Opening balance', value: 'KES 135,000' },
            { label: 'Total contributions', value: `+KES ${totalCredits.toLocaleString()}`, color: '#4ade80' },
            { label: 'Loan repayments', value: `-KES ${totalDebits.toLocaleString()}`, color: '#f87171' },
            { label: 'Closing balance', value: `KES ${(135000 + totalCredits - totalDebits).toLocaleString()}`, bold: true },
          ].map((row, i, arr) => (
            <View key={row.label} className={`flex-row justify-between py-2.5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className={`text-xs font-bold ${row.bold ? 'text-base text-white' : ''}`} style={{ color: row.color || 'rgba(255,255,255,0.9)' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              className={`px-5 py-2 rounded-full border ${
                filter === item ? 'bg-violet-600 border-violet-600' : 'bg-white/5 border-white/10'
              }`}
              onPress={() => setFilter(item)}
            >
              <Text className={`text-xs font-bold ${filter === item ? 'text-white' : 'text-white/40'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <View className="px-4">
          {isLoading ? (
            [1, 2, 3].map((item) => <View key={item} className="h-16 bg-white/5 rounded-2xl mb-2 border border-white/5" />)
          ) : filtered.length === 0 ? (
            <View className="py-20 items-center">
              <Text className="text-white/30 text-xs font-medium">No transactions for this period.</Text>
            </View>
          ) : (
            filtered.map((transaction) => <TxnRow key={transaction.id} txn={transaction} />)
          )}
        </View>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

function TxnRow({ txn }: { txn: Transaction }) {
  const isCredit = txn.direction === 'credit'
  return (
    <View className="flex-row items-center gap-4 py-3.5 border-b border-white/5 bg-white/5 px-4 rounded-2xl mb-2 border border-white/5">
      <View className={`w-10 h-10 rounded-xl items-center justify-center ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <Text style={{ color: isCredit ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{isCredit ? '↓' : '↑'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-xs font-bold">{txn.description}</Text>
        <Text className="text-white/40 text-[10px] uppercase font-bold mt-0.5">
          {new Date(txn.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text className={`text-xs font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
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

import { useState } from 'react'
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { api } from '@saccosphere/api-client'
import { useQuery } from '@tanstack/react-query'
import { useTransactions } from '../../hooks/useTransactions'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { Icon, type IconName } from '../ui/Icon'
import type { Transaction } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../DeepSpaceBackground'
import { useMoney, useBalanceHidden, MONEY_MASK } from '../../lib/money'

const FILTERS = ['All', 'Contributions', 'Withdrawals', 'Transfers', 'Loans', 'Dividends', 'Fees']

export default function StatementScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const money = useMoney()
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
      const type = t.txn_type.toLowerCase()
      if (filter === 'Contributions') return type === 'contribution' || type === 'deposit'
      if (filter === 'Withdrawals') return type === 'withdrawal'
      if (filter === 'Transfers') return type === 'transfer'
      if (filter === 'Loans') return type === 'loan_repayment' || type === 'loan_disbursement'
      if (filter === 'Dividends') return type === 'dividend'
      if (filter === 'Fees') return type === 'fee' || type === 'registration_fee'
      return true
    }) ?? []

  const totalCredits = filtered.filter((t) => t.direction === 'credit').reduce((sum, t) => sum + t.amount, 0)
  const totalDebits = filtered.filter((t) => t.direction === 'debit').reduce((sum, t) => sum + t.amount, 0)

  const handleDownload = async () => {
    if (!membership?.sacco_id) {
      Alert.alert('Statement unavailable', 'We could not resolve this SACCO membership yet. Pull to refresh and try again.')
      return
    }

    setIsDownloading(true)
    try {
      const { blob, filename } = await api.member.downloadStatementPdf({
        sacco_id: membership.sacco_id,
        from_date: statementRange.from,
        to_date: statementRange.to,
      })

      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
      } else {
        // Native mobile implementation
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1]
            const fileUri = `${(FileSystem as any).cacheDirectory}${filename}`
            await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' })

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri)
            } else {
              Alert.alert('Success', `Statement saved: ${filename}`)
            }
          } catch (e) {
            console.error('File share error:', e)
            Alert.alert('Error', 'Failed to save or share statement.')
          }
        }
        reader.readAsDataURL(blob)
      }
    } catch {
      Alert.alert('Download failed', 'Unable to download the statement PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const { data: statementData } = useQuery({
    queryKey: ['ledgerStatement', membership?.sacco_id, statementRange.from, statementRange.to],
    queryFn: () =>
      api.member.getStatement({
        sacco_id: membership!.sacco_id,
        from_date: statementRange.from,
        to_date: statementRange.to,
      }),
    enabled: Boolean(membership?.sacco_id),
  })

  const openingBalance = Number(statementData?.opening_balance ?? 0)
  const closingBalance = Number(statementData?.closing_balance ?? (openingBalance + totalCredits - totalDebits))

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
            { label: 'Opening balance', value: money(openingBalance) },
            { label: 'Total contributions', value: `+${money(statementData?.total_credits ?? totalCredits)}`, color: '#4ade80' },
            { label: 'Loan repayments', value: `-${money(statementData?.total_debits ?? totalDebits)}`, color: '#f87171' },
            { label: 'Closing balance', value: money(closingBalance), bold: true },
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
  const hidden = useBalanceHidden()
  const isCredit = txn.direction === 'credit'
  const type = txn.txn_type.toLowerCase()

  const getIcon = (): IconName => {
    if (type === 'contribution' || type === 'deposit') return 'cash'
    if (type === 'loan_repayment') return 'send'
    if (type === 'loan_disbursement') return 'receive'
    if (type === 'withdrawal') return 'withdraw'
    if (type === 'transfer') return 'swap'
    if (type === 'dividend') return 'dividend'
    return isCredit ? 'receive' : 'send'
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(member)/transaction-detail', params: { id: txn.id } } as any)}
      className="flex-row items-center gap-4 py-3.5 border-b border-white/5 bg-white/5 px-4 rounded-2xl mb-2 border border-white/5"
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <Icon name={getIcon()} size={16} color={isCredit ? '#4ade80' : '#f87171'} />
      </View>
      <View className="flex-1">
        <Text className="text-white text-xs font-bold">{txn.description}</Text>
        <Text className="text-white/40 text-[10px] uppercase font-bold mt-0.5">
          {new Date(txn.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} · {txn.txn_type.replace('_', ' ')}
        </Text>
      </View>
      <Text className={`text-xs font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
        {isCredit ? '+' : '-'}{hidden ? MONEY_MASK : txn.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
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


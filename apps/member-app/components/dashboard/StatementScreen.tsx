import { useState } from 'react'
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { api } from '@saccosphere/api-client'
import { useQuery } from '@tanstack/react-query'
import { useTransactions } from '../../hooks/useTransactions'
import { useMembershipBySacco } from '../../hooks/useMembership'
import { Icon, type IconName } from '../ui/Icon'
import { Skeleton } from '../ui/Skeleton'
import type { Transaction } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../DeepSpaceBackground'
import { useMoney, useBalanceHidden, MONEY_MASK } from '../../lib/money'
import { useTheme } from '../../theme/ThemeProvider'

const FILTERS = ['All', 'Contributions', 'Withdrawals', 'Transfers', 'Loans', 'Dividends', 'Fees']

export default function StatementScreen() {
  const { colors: c } = useTheme()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const money = useMoney()
  const insets = useSafeAreaInsets()
  const [monthDate, setMonthDate] = useState(startOfMonth(new Date()))
  const [filter, setFilter] = useState('All')
  const [isDownloading, setIsDownloading] = useState(false)
  const month = monthDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
  const statementRange = getMonthRange(monthDate)
  const { data: transactions, isLoading, isRefetching, refetch } = useTransactions({ sacco: slug, from: statementRange.from, to: statementRange.to })
  const { data: membership } = useMembershipBySacco(slug)

  const monthTransactions = transactions ?? []

  const filtered = monthTransactions.filter((t) => {
    const type = t.txn_type.toLowerCase()
    if (filter === 'Contributions') return type === 'contribution' || type === 'deposit'
    if (filter === 'Withdrawals') return type === 'withdrawal'
    if (filter === 'Transfers') return type === 'transfer'
    if (filter === 'Loans') return type === 'loan_repayment' || type === 'loan_disbursement'
    if (filter === 'Dividends') return type === 'dividend'
    if (filter === 'Fees') return type === 'fee' || type === 'registration_fee'
    return true
  })

  // Summary totals reflect the whole month regardless of the active category
  // filter — the labels ("Total contributions", "Loan repayments") describe
  // fixed categories, not "whatever's currently filtered".
  const totalCredits = monthTransactions.filter((t) => t.direction === 'credit').reduce((sum, t) => sum + t.amount, 0)
  const totalDebits = monthTransactions.filter((t) => t.direction === 'debit').reduce((sum, t) => sum + t.amount, 0)

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
        const base64Data = await blobToBase64(blob)
        const file = new File(Paths.cache, filename)
        if (file.exists) file.delete()
        file.create()
        file.write(base64Data, { encoding: 'base64' })

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri)
        } else {
          Alert.alert('Success', `Statement saved: ${filename}`)
        }
      }
    } catch (error) {
      console.error('Statement download failed:', error)
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.success} />}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: c.border }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: c.surfaceAlt }}>
              <Text className="text-xs" style={{ color: c.textMuted }}>←</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-base font-bold" style={{ color: c.text }}>Statement</Text>
              <Text className="text-[10px] uppercase font-bold tracking-wider" style={{ color: c.textFaint }}>{membership?.sacco_name || 'SACCO'}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="rounded-lg px-4 py-2"
            style={{ backgroundColor: c.accent, opacity: isDownloading ? 0.5 : 1 }}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={c.onAccent} />
            ) : (
              <Text className="text-xs font-bold uppercase tracking-tighter" style={{ color: c.onAccent }}>PDF</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View className="flex-row justify-center items-center py-5 gap-6">
          <TouchableOpacity
            onPress={() => setMonthDate((current) => addMonths(current, -1))}
            accessibilityLabel="Previous month"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-light" style={{ color: c.accent }}>‹</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold min-w-[140px] text-center" style={{ color: c.text }}>{month}</Text>
          <TouchableOpacity
            onPress={() => setMonthDate((current) => addMonths(current, 1))}
            accessibilityLabel="Next month"
            accessibilityRole="button"
          >
            <Text className="text-2xl font-light" style={{ color: c.accent }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View className="mx-4 mb-6 rounded-2xl p-4" style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
          {[
            { label: 'Opening balance', value: money(openingBalance) },
            { label: 'Total contributions', value: `+${money(statementData?.total_credits ?? totalCredits)}`, color: c.success },
            { label: 'Loan repayments', value: `-${money(statementData?.total_debits ?? totalDebits)}`, color: c.danger },
            { label: 'Closing balance', value: money(closingBalance), bold: true },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2.5"
              style={i !== arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : undefined}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className={`font-bold ${row.bold ? 'text-base' : 'text-xs'}`} style={{ color: row.color || c.text }}>
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
          {FILTERS.map((item) => {
            const on = filter === item
            return (
              <TouchableOpacity
                key={item}
                className="px-5 py-2 rounded-full"
                style={{
                  borderWidth: 1,
                  backgroundColor: on ? c.accent : c.surface,
                  borderColor: on ? c.accent : c.border,
                }}
                onPress={() => setFilter(item)}
              >
                <Text className="text-xs font-bold" style={{ color: on ? c.onAccent : c.textFaint }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Transactions List */}
        <View className="px-4">
          {isLoading ? (
            [1, 2, 3].map((item) => <Skeleton key={item} height={64} borderRadius={16} style={{ marginBottom: 8 }} />)
          ) : filtered.length === 0 ? (
            <View className="py-20 items-center">
              <Text className="text-xs font-medium" style={{ color: c.textFaint }}>No transactions for this period.</Text>
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
  const { colors: c } = useTheme()
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
      className="flex-row items-center gap-4 py-3.5 px-4 rounded-2xl mb-2"
      style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: (isCredit ? c.success : c.danger) + '1A' }}>
        <Icon name={getIcon()} size={16} color={isCredit ? c.success : c.danger} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold" style={{ color: c.text }}>{txn.description}</Text>
        <Text className="text-[10px] uppercase font-bold mt-0.5" style={{ color: c.textFaint }}>
          {new Date(txn.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} · {txn.txn_type.replace('_', ' ')}
        </Text>
      </View>
      <Text className="text-xs font-bold" style={{ color: isCredit ? c.success : c.danger }}>
        {isCredit ? '+' : '-'}{hidden ? MONEY_MASK : txn.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(blob)
  })
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


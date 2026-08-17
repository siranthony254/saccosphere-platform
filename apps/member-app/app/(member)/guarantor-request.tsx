import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState, useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function GuarantorRequest() {
  const insets = useSafeAreaInsets()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [notes, setNotes] = useState('')
  const [agreedToLien, setAgreedToLien] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  const { data: requestDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['guarantorRequestDetails', token],
    queryFn: () => api.loans.getGuarantorRequestDetails(token || ''),
    enabled: Boolean(token),
  })

  const respond = useMutation({
    mutationFn: (action: 'accept' | 'decline') =>
      api.loans.respondToExternalGuarantorRequest(token || '', action, notes || undefined),
    onSuccess: () => {
      setHasResponded(true)
      Alert.alert('Success', 'Your response has been recorded.')
    },
    onError: (error: Error) => Alert.alert('Error', error.message),
  })

  if (!token) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
        className="bg-surface py-8"
      >
        <View className="bg-surface2 border border-border rounded-xl p-5 items-center">
          <Text className="text-ink text-sm font-semibold mb-1">Invalid Request</Text>
          <Text className="text-ink-muted text-xs text-center leading-5">
            No response token provided. Please check the link from the SMS or in-app notification.
          </Text>
        </View>
      </ScrollView>
    )
  }

  if (hasResponded) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
        className="bg-surface py-8"
      >
        <View className="bg-surface2 border border-border rounded-xl p-5 items-center">
          <Text className="text-ink text-sm font-semibold mb-1">Response Recorded</Text>
          <Text className="text-ink-muted text-xs text-center leading-5">
            Thank you for responding to this guarantor request. The borrower and SACCO administration have been notified.
          </Text>
        </View>
      </ScrollView>
    )
  }

  const guaranteeAmount = requestDetails?.guarantee_amount ?? 0
  const savingsBalance = requestDetails?.savings_balance ?? 0

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface py-8"
    >
      <View className="mb-4">
        <Text className="text-ink text-base font-bold mb-1">Guarantor & Savings Freeze Request</Text>
        <Text className="text-ink-muted text-xs leading-5">
          Review the borrower's request and collateral encumbrance warnings before accepting.
        </Text>
      </View>

      {/* Borrower & Loan Details Card */}
      <View className="bg-surface2 border border-border rounded-xl p-4 mb-4">
        <Text className="text-ink text-xs font-bold uppercase tracking-wider mb-3">Borrower & Loan Details</Text>
        {loadingDetails ? (
          <ActivityIndicator color="#6D28D9" />
        ) : (
          <View className="gap-2">
            <View className="flex-row justify-between py-1 border-b border-border">
              <Text className="text-ink-muted text-xs">Borrower Name</Text>
              <Text className="text-ink text-xs font-bold">{requestDetails?.borrower_name || '—'}</Text>
            </View>
            <View className="flex-row justify-between py-1 border-b border-border">
              <Text className="text-ink-muted text-xs">Loan Product</Text>
              <Text className="text-ink text-xs font-semibold">{requestDetails?.loan_product_name || 'Loan'}</Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-ink-muted text-xs">Requested Guarantee Amount</Text>
              <Text className="text-violet-600 text-xs font-bold">KES {guaranteeAmount.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 🔒 Savings Freeze & Collateral Lien Warning Card */}
      <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-base">🔒</Text>
          <Text className="text-amber-500 text-xs font-bold uppercase tracking-wider">Savings Freeze & Lien Notice</Text>
        </View>
        <Text className="text-ink text-xs leading-5 mb-3">
          Accepting this request will place a <Text className="font-bold text-amber-500">collateral lien hold</Text> on your SACCO savings balance equal to <Text className="font-bold">KES {guaranteeAmount.toLocaleString()}</Text>.
        </Text>

        <View className="bg-surface/80 rounded-lg p-3 gap-1.5 border border-amber-500/20 mb-3">
          {savingsBalance > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-ink-muted text-[11px]">Your Current Savings</Text>
              <Text className="text-ink text-[11px] font-semibold">KES {savingsBalance.toLocaleString()}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-amber-500 text-[11px] font-bold">Amount to be Encumbered/Frozen</Text>
            <Text className="text-amber-500 text-[11px] font-bold">KES {guaranteeAmount.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAgreedToLien(!agreedToLien)}
          className="flex-row items-center gap-2.5 pt-1"
        >
          <View className={`w-5 h-5 rounded border items-center justify-center ${agreedToLien ? 'bg-amber-500 border-amber-500' : 'border-amber-500/50 bg-surface'}`}>
            {agreedToLien && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="text-ink text-[11px] font-medium flex-1">
            I acknowledge and agree to freeze KES {guaranteeAmount.toLocaleString()} of my savings balance until loan settlement.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Response Form Card */}
      <View className="bg-surface2 border border-border rounded-xl p-4 mb-4">
        <Text className="text-ink text-xs font-bold uppercase tracking-wider mb-3">Your Response</Text>

        <View className="mb-4">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">Notes / Conditions (Optional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-3 text-ink text-xs"
            placeholder="Add any notes for borrower or SACCO..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View className="gap-2.5">
          <TouchableOpacity
            className={`rounded-xl p-3.5 items-center ${agreedToLien && !respond.isPending ? 'bg-violet-600' : 'bg-violet-600/40'}`}
            onPress={() => respond.mutate('accept')}
            disabled={!agreedToLien || respond.isPending}
          >
            {respond.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-xs font-bold">🔒 Agree & Accept Guarantee Hold</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-xl p-3.5 items-center"
            onPress={() => respond.mutate('decline')}
            disabled={respond.isPending}
          >
            {respond.isPending ? (
              <ActivityIndicator color="#9CA3AF" />
            ) : (
              <Text className="text-red-500 text-xs font-semibold">Decline Guarantee Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-ink-muted text-[10px] text-center leading-4">
        By accepting, you agree to the SACCO Bylaws collateral lien rules. Funds are auto-released upon borrower loan repayment.
      </Text>
    </ScrollView>
  )
}

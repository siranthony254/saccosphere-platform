import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function GuarantorRequest() {
  const insets = useSafeAreaInsets()
  const { token } = useLocalSearchParams<{ token?: string }>()
  const [notes, setNotes] = useState('')
  const [hasResponded, setHasResponded] = useState(false)

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
            No response token provided. Please check the link from the SMS.
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
            Thank you for responding to this guarantor request. The borrower will be notified.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface py-8"
    >
      <View className="mb-6">
        <Text className="text-ink text-base font-bold mb-2">External Guarantor Request</Text>
        <Text className="text-ink-muted text-xs leading-5">
          You have been requested to guarantee a loan. Please review and respond below.
        </Text>
      </View>

      <View className="bg-surface2 border border-border rounded-xl p-5 mb-6">
        <Text className="text-ink text-sm font-semibold mb-4">Your Response</Text>

        <View className="mb-4">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">Notes (Optional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl p-3 text-ink text-xs"
            placeholder="Add any notes or conditions..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View className="gap-3">
          <TouchableOpacity
            className="bg-violet-500 rounded-xl p-3.5 items-center"
            onPress={() => respond.mutate('accept')}
            disabled={respond.isPending}
          >
            {respond.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-xs font-semibold">Accept Guarantee</Text>
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
              <Text className="text-ink text-xs font-semibold">Decline Guarantee</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-ink-muted text-[10px] text-center leading-4">
        By accepting, you agree to guarantee this loan. The SACCO will contact you for KYC verification.
      </Text>
    </ScrollView>
  )
}

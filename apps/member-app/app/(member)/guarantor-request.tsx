import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function GuarantorRequest() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      api.loans.respondToGuarantorRequest(id, action),
    onSuccess: () => {
      Alert.alert('Updated', 'Your guarantor response has been sent.')
    },
    onError: (error: Error) => Alert.alert('Unable to respond', error.message),
  })

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface py-8"
    >
      <View className="mb-6">
        <Text className="text-ink text-base font-bold mb-2">Guarantor requests</Text>
        <Text className="text-ink-muted text-xs leading-5">
          This feature is not currently available.
        </Text>
      </View>

      <View className="bg-surface2 border border-border rounded-xl p-5 items-center">
        <Text className="text-ink text-sm font-semibold mb-1">Feature unavailable</Text>
        <Text className="text-ink-muted text-xs text-center leading-5">
          Guarantor requests are not supported by the current backend version.
        </Text>
      </View>
    </ScrollView>
  )
}

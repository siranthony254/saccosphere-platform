import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useGuarantorRequests } from '../../hooks/useLoans'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function GuarantorRequest() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { data: requests = [], isLoading, isError, refetch, isRefetching } = useGuarantorRequests()
  const respond = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      api.loans.respondToGuarantorRequest(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantor-requests'] })
      Alert.alert('Updated', 'Your guarantor response has been sent.')
    },
    onError: (error: Error) => Alert.alert('Unable to respond', error.message),
  })

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingBottom: insets.bottom + 20 }}
      className="bg-surface py-8"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
    >
      <View className="mb-6">
        <Text className="text-ink text-base font-bold mb-2">Guarantor requests</Text>
        <Text className="text-ink-muted text-xs leading-5">
          Requests here are loaded from the backend and update after you approve or decline.
        </Text>
      </View>

      {isLoading ? (
        <View className="py-8 items-center">
          <ActivityIndicator color="#10B981" />
          <Text className="text-ink-muted text-xs mt-3">Loading requests...</Text>
        </View>
      ) : isError ? (
        <View className="bg-red-50 border border-red-100 rounded-xl p-4">
          <Text className="text-red-700 text-xs mb-3">Unable to load guarantor requests.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-violet-500 text-xs font-semibold">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <View className="bg-surface2 border border-border rounded-xl p-5 items-center">
          <Text className="text-ink text-sm font-semibold mb-1">No pending requests</Text>
          <Text className="text-ink-muted text-xs text-center leading-5">
            When another member asks you to guarantee a loan, it will appear here.
          </Text>
        </View>
      ) : (
        requests.map((request) => (
          <View key={request.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-12 h-12 rounded-full bg-blue-200 justify-center items-center">
                <Text className="text-blue-700 text-sm font-bold">
                  {getInitials(request.applicant_name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink text-sm font-semibold">{request.applicant_name}</Text>
                <Text className="text-ink-muted text-xs">{request.sacco_name}</Text>
              </View>
              <Text className="text-blue-700 text-xs font-semibold">{request.status}</Text>
            </View>

            <View className="bg-blue-100 rounded-lg p-3 mb-4">
              <InfoRow label="Loan ref" value={request.loan_ref} />
              <InfoRow label="Loan amount" value={`KES ${Number(request.amount ?? 0).toLocaleString()}`} />
            </View>

            <Text className="text-blue-800 text-xs leading-4.5 mb-4">
              By approving, you agree to guarantee this loan according to the SACCO terms.
            </Text>

            <TouchableOpacity
              className="w-full bg-violet-500 py-3 rounded-xl items-center mb-3"
              onPress={() => respond.mutate({ id: request.id, action: 'approve' })}
              disabled={respond.isPending}
            >
              <Text className="text-white text-xs font-semibold">Approve guarantee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-surface2 py-3 rounded-xl items-center"
              onPress={() => respond.mutate({ id: request.id, action: 'decline' })}
              disabled={respond.isPending}
            >
              <Text className="text-ink-soft text-xs font-semibold">Decline</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-blue-200">
      <Text className="text-blue-700 text-xs">{label}</Text>
      <Text className="text-blue-900 text-xs font-semibold">{value}</Text>
    </View>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GR'
}

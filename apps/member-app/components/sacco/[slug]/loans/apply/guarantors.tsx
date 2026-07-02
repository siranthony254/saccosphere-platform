import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { api } from '@saccosphere/api-client'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useMutation, useQuery } from '@tanstack/react-query'

export default function LoanGuarantors() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { loanId, step1 } = useLoanApplicationStore()
  const [search, setSearch] = useState('')
  const [requestedIds, setRequestedIds] = useState<string[]>([])

  if (!loanId) {
    router.replace({ pathname: '/sacco/[slug]/loans/apply', params: { slug } })
    return null
  }

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['searchGuarantors', loanId, search],
    queryFn: () => api.loans.searchGuarantors(loanId, search),
    enabled: search.length >= 3,
  })

  const { mutate: requestGuarantor, isPending: isRequesting } = useMutation({
    mutationFn: ({ guarantorId }: { guarantorId: string }) =>
      api.loans.requestGuarantor(loanId, guarantorId),
    onSuccess: (_, { guarantorId }) => {
      setRequestedIds((prev) => [...prev, guarantorId])
      Alert.alert('Success', 'Guarantor request sent!')
      setSearch('')
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  return (
    <ScrollView className="bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-border" />
      </View>
      <Text className="text-ink-faint text-xs mb-5">Step 2 of 3 - Guarantors</Text>

      <Text className="text-ink text-sm font-semibold mb-2">Internal Guarantors</Text>
      <Text className="text-ink-muted text-xs leading-5 mb-4">
        Search for members in the same SACCO to guarantee your loan.
      </Text>

      <View className="mb-4">
        <TextInput
          className="bg-surface2 border border-border rounded-xl p-3 text-ink text-xs"
          placeholder="Search by phone number (e.g., 07...)"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {isFetching && <ActivityIndicator className="mt-2" color="#8B5CF6" />}
      </View>

      {searchResults && searchResults.length > 0 && (
        <View className="mb-6 gap-2">
          {searchResults.map((g) => (
            <View key={g.id} className="flex-row justify-between items-center p-3 border border-border rounded-xl bg-surface2">
              <View>
                <Text className="text-ink text-xs font-semibold">{g.user?.first_name} {g.user?.last_name}</Text>
                <Text className="text-ink-muted text-xs">{g.user?.phone_number}</Text>
              </View>
              <TouchableOpacity
                className={`px-3 py-1.5 rounded-lg ${requestedIds.includes(g.id) ? 'bg-mint-100' : 'bg-violet-100'}`}
                onPress={() => requestGuarantor({ guarantorId: g.id })}
                disabled={requestedIds.includes(g.id) || isRequesting}
              >
                <Text className={`text-xs font-semibold ${requestedIds.includes(g.id) ? 'text-mint-700' : 'text-violet-700'}`}>
                  {requestedIds.includes(g.id) ? 'Requested' : 'Request'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {searchResults && searchResults.length === 0 && search.length >= 3 && !isFetching && (
        <Text className="text-ink-muted text-xs mb-6">No members found.</Text>
      )}

      <View className="border-t border-border my-6 pt-6">
        <Text className="text-ink text-sm font-semibold mb-2">External Guarantors</Text>
        <Text className="text-ink-muted text-xs leading-5 mb-4">
          Need a guarantor who isn't a member? You can add them here.
        </Text>
        <TouchableOpacity
          className="border border-violet-500 rounded-xl p-3.5 items-center mb-6 bg-violet-50"
          onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply/external-guarantors', params: { slug } })}
        >
          <Text className="text-violet-700 text-xs font-semibold">+ Add External Guarantor</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-violet-500 rounded-xl p-3.5 items-center mt-4"
        onPress={() => router.replace({ pathname: '/sacco/[slug]/loans/apply/review', params: { slug } })}
      >
        <Text className="text-white text-xs font-semibold">Review loan →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

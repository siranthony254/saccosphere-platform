import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'

export default function LoanGuarantors() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { loanId } = useLoanApplicationStore()
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
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, paddingTop: insets.top }}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-white/60 text-lg">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-bold">Guarantors</Text>
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Step 2 of 3 - Secure your loan</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-white/10" />
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <Text className="text-white text-sm font-bold mb-2">Search Members</Text>
          <Text className="text-white/60 text-xs leading-5 mb-4">
            Search for other members in this SACCO to guarantee your loan.
          </Text>

          <View className="mb-2">
            <TextInput
              className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs"
              placeholder="Search by phone number (e.g., 07...)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
            {isFetching && <ActivityIndicator className="mt-3" color="#8B5CF6" />}
          </View>

          {searchResults && searchResults.length > 0 && (
            <View className="mt-4 gap-2">
              {searchResults.map((g) => (
                <View key={g.id} className="flex-row justify-between items-center p-3 border border-white/10 rounded-xl bg-white/5">
                  <View>
                    <Text className="text-white text-xs font-bold">{g.user?.first_name} {g.user?.last_name}</Text>
                    <Text className="text-white/40 text-[10px] mt-0.5">{g.user?.phone_number}</Text>
                  </View>
                  <TouchableOpacity
                    className={`px-3 py-1.5 rounded-lg ${requestedIds.includes(g.id) ? 'bg-mint-500/20 border border-mint-500/30' : 'bg-violet-500/20 border border-violet-500/30'}`}
                    onPress={() => requestGuarantor({ guarantorId: g.id })}
                    disabled={requestedIds.includes(g.id) || isRequesting}
                  >
                    <Text className={`text-[10px] font-bold uppercase tracking-tight ${requestedIds.includes(g.id) ? 'text-mint-400' : 'text-violet-400'}`}>
                      {requestedIds.includes(g.id) ? 'Requested' : 'Request'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {searchResults && searchResults.length === 0 && search.length >= 3 && !isFetching && (
            <Text className="text-white/40 text-xs mt-4 text-center">No members found with that phone number.</Text>
          )}
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
          <Text className="text-white text-sm font-bold mb-2">External Guarantors</Text>
          <Text className="text-white/60 text-xs leading-5 mb-4">
            Need a guarantor who isn't a member? You can invite them here.
          </Text>
          <TouchableOpacity
            className="border border-violet-500/50 bg-violet-500/10 rounded-xl p-3.5 items-center"
            onPress={() => router.push({ pathname: '/sacco/[slug]/loans/apply/external-guarantors', params: { slug } })}
          >
            <Text className="text-violet-400 text-xs font-bold uppercase tracking-tight">+ Add External Guarantor</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-violet-600 rounded-2xl p-4 items-center"
          onPress={() => router.replace({ pathname: '/sacco/[slug]/loans/apply/review', params: { slug } })}
        >
          <Text className="text-white text-sm font-bold uppercase tracking-wider">Review loan application →</Text>
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}


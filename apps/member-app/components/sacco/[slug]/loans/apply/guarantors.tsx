import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@saccosphere/api-client'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DeepSpaceBackground } from '../../../../DeepSpaceBackground'
import { useTheme } from '../../../../../theme/ThemeProvider'

export default function LoanGuarantors() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
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
            <Text className="text-lg" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold" style={{ color: c.text }}>Guarantors</Text>
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.textFaint }}>Step 2 of 3 - Secure your loan</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-6">
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full bg-violet-500" />
          <View className="flex-1 h-1 rounded-full" style={{ backgroundColor: c.border }} />
        </View>

        <View className="border rounded-2xl p-5 mb-6" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Text className="text-sm font-bold mb-2" style={{ color: c.text }}>Search Members</Text>
          <Text className="text-xs leading-5 mb-4" style={{ color: c.textMuted }}>
            Search for other members in this SACCO to guarantee your loan.
          </Text>

          <View className="mb-2">
            <TextInput
              className="border rounded-xl p-3.5 text-xs"
              style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
              placeholder="Phone number (07...) or member number"
              placeholderTextColor={c.textFaint}
              value={search}
              onChangeText={setSearch}
            />
            {isFetching && <ActivityIndicator className="mt-3" color="#8B5CF6" />}
          </View>

          {searchResults && searchResults.length > 0 && (
            <View className="mt-4 gap-2">
              {searchResults.map((g) => (
                <View key={g.id} className="flex-row justify-between items-center p-3 border rounded-xl" style={{ backgroundColor: c.surfaceAlt, borderColor: c.border }}>
                  <View>
                    <Text className="text-xs font-bold" style={{ color: c.text }}>{g.user?.first_name} {g.user?.last_name}</Text>
                    <Text className="text-[10px] mt-0.5" style={{ color: c.textFaint }}>{g.user?.phone_number}</Text>
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
            <Text className="text-xs mt-4 text-center" style={{ color: c.textFaint }}>No member found with that phone or member number.</Text>
          )}
        </View>

        <View className="border rounded-2xl p-5 mb-8" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Text className="text-sm font-bold mb-2" style={{ color: c.text }}>External Guarantors</Text>
          <Text className="text-xs leading-5 mb-4" style={{ color: c.textMuted }}>
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


import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'

export default function LoanGuarantors() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  return (
    <ScrollView className="bg-surface" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="text-ink text-sm font-semibold mb-2">Guarantors are requested after submission</Text>
      <Text className="text-ink-muted text-xs leading-5 mb-5">
        The backend guarantor endpoints require an existing loan id, so this app now submits the loan first and keeps
        guarantor requests on the saved loan workflow.
      </Text>

      <TouchableOpacity
        className="bg-violet-500 rounded-xl p-3.5 items-center"
        onPress={() => router.replace({ pathname: '/(member)/sacco/[slug]/loans/apply/review', params: { slug } })}
      >
        <Text className="text-white text-xs font-semibold">Review loan</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

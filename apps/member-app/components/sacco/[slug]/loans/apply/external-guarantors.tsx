import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { api } from '@saccosphere/api-client'
import { useLoanApplicationStore } from '../../../../../store/useLoanApplicationStore'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTheme } from '../../../../../theme/ThemeProvider'

export default function ExternalGuarantorsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { colors: c } = useTheme()
  const { loanId } = useLoanApplicationStore()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!loanId) {
      router.replace({ pathname: '/sacco/[slug]/loans/apply', params: { slug } })
    }
  }, [loanId, slug])

  const { data: existingExternal = [], refetch } = useQuery({
    queryKey: ['externalGuarantors', loanId],
    queryFn: () => api.loans.getExternalGuarantors(loanId!),
    enabled: !!loanId,
  })

  const { mutate: submitExternal, isPending } = useMutation({
    mutationFn: () =>
      api.loans.submitExternalGuarantor(loanId!, {
        full_name: fullName,
        phone_number: phone,
        id_number: idNumber,
        employment_status: employmentStatus,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        guarantee_amount: amount ? parseFloat(amount) : undefined,
      }),
    onSuccess: () => {
      Alert.alert('Success', 'External guarantor request submitted!')
      setFullName('')
      setPhone('')
      setIdNumber('')
      setEmploymentStatus('')
      setMonthlyIncome('')
      setAmount('')
      refetch()
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  })

  if (!loanId) return null

  const isValid = fullName.length > 2 && phone.length > 8 && idNumber.length === 8

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: c.border }} />
      </View>
      <Text className="text-xs mb-5" style={{ color: c.textFaint }}>Step 2 of 3 - External Guarantors</Text>

      <Text className="text-sm font-semibold mb-2" style={{ color: c.text }}>Add External Guarantor</Text>
      <Text className="text-xs leading-5 mb-5" style={{ color: c.textMuted }}>
        Provide details of someone who is not a member of the SACCO but is willing to guarantee your loan. They will be contacted to provide their consent and KYC details.
      </Text>

      {existingExternal.length > 0 && (
        <View className="mb-6 border rounded-xl p-4" style={{ backgroundColor: c.surfaceAlt, borderColor: c.border }}>
          <Text className="text-xs font-semibold mb-3" style={{ color: c.text }}>Requested External Guarantors ({existingExternal.length})</Text>
          <View className="gap-2">
            {existingExternal.map((g: any, i: number) => (
              <View key={g.id || i} className="flex-row justify-between items-center py-2 border-b" style={{ borderColor: c.border }}>
                <View>
                  <Text className="text-xs font-medium" style={{ color: c.text }}>{g.full_name || g.guarantor_name}</Text>
                  <Text className="text-[10px]" style={{ color: c.textMuted }}>{g.phone_number || g.guarantor_phone} · ID: {g.id_number || g.guarantor_national_id}</Text>
                </View>
                <View className="px-2 py-1 rounded bg-violet-500/10 border border-violet-500/20">
                  <Text className="text-violet-500 text-[10px] font-bold uppercase">{g.status || 'PENDING'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="gap-4 mb-6">
        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>Full Name <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="John Doe"
            placeholderTextColor={c.textFaint}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>Phone Number <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="+254 700 000000"
            placeholderTextColor={c.textFaint}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>ID Number <Text className="text-red-500">*</Text></Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="8-digit ID number"
            placeholderTextColor={c.textFaint}
            keyboardType="numeric"
            maxLength={8}
            value={idNumber}
            onChangeText={setIdNumber}
          />
        </View>

        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>Employment Status</Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="e.g. Employed, Self-employed"
            placeholderTextColor={c.textFaint}
            value={employmentStatus}
            onChangeText={setEmploymentStatus}
          />
        </View>

        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>Monthly Income</Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="e.g. 50000"
            placeholderTextColor={c.textFaint}
            keyboardType="numeric"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
          />
        </View>

        <View>
          <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>Amount they are guaranteeing (Optional)</Text>
          <TextInput
            className="border rounded-xl p-3 text-xs"
            style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, color: c.text }}
            placeholder="e.g. 50000"
            placeholderTextColor={c.textFaint}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <TouchableOpacity
        className={`bg-violet-500 rounded-xl p-3.5 items-center mb-4 ${(!isValid || isPending) ? 'opacity-50' : ''}`}
        onPress={() => submitExternal()}
        disabled={!isValid || isPending}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-semibold">Submit External Guarantor</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        className="border rounded-xl p-3.5 items-center"
        style={{ backgroundColor: c.surfaceAlt, borderColor: c.border }}
        onPress={() => router.back()}
      >
        <Text className="text-xs font-semibold" style={{ color: c.text }}>Back to Internal Guarantors</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6 items-center"
        onPress={() => router.replace({ pathname: '/sacco/[slug]/loans/apply/review', params: { slug } })}
      >
        <Text className="text-violet-600 text-xs font-semibold">Continue to Review →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useCurrentUser } from '../../store/useAuthStore'
import { useMembershipApplicationStore } from '../../store/useMembershipApplicationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoApplicationStep1() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const { setSacco, setFormData, setMonthlyContribution, formData, monthlyContribution } = useMembershipApplicationStore()

  const [firstName, setFirstName] = useState<string>(formData.firstName as string ?? user?.first_name ?? '')
  const [lastName, setLastName] = useState<string>(formData.lastName as string ?? user?.last_name ?? '')
  const [nationalId, setNationalId] = useState<string>(formData.nationalId as string ?? (user as any)?.national_id ?? '')
  const [dob, setDob] = useState<string>(formData.dob as string ?? (user as any)?.date_of_birth ?? '')
  const [employer, setEmployer] = useState<string>(formData.employer as string ?? '')
  const [employmentType, setEmploymentType] = useState<string>(formData.employmentType as string ?? '')
  const [income, setIncome] = useState<string>(formData.income as string ?? '')
  const [contribution, setContribution] = useState<string>(monthlyContribution ? String(monthlyContribution) : '')

  useEffect(() => {
    if (slug) setSacco(slug)
  }, [slug, setSacco])

  useEffect(() => {
    if (!user) return
    setFirstName((current) => current || user.first_name || '')
    setLastName((current) => current || user.last_name || '')
    setNationalId((current) => current || (user as any).national_id || '')
    setDob((current) => current || (user as any).date_of_birth || '')
  }, [user])

  const contributionNumber = Number(contribution.replace(/[^0-9]/g, ''))
  const canContinue = Boolean(
    firstName && lastName && nationalId && dob && employer && employmentType && contributionNumber >= 1000
  )

  const handleContinue = () => {
    setFormData({
      firstName,
      lastName,
      nationalId,
      dob,
      employer,
      employmentType,
      income,
    })
    setMonthlyContribution(contributionNumber)
    router.push(`/(member)/discover/${slug}/apply/documents`)
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
      }}
      className="bg-surface"
    >
      {/* Header */}
      <View className="py-2.5 px-4 border-b border-border flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-ink-soft text-lg">←</Text>
        </TouchableOpacity>
        <View className="ml-3">
          <Text className="text-ink text-sm font-semibold">Apply — {slug?.toUpperCase() ?? 'SACCO'}</Text>
          <Text className="text-ink-faint text-xs">Membership application</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-400" />
        <View className="flex-1 h-0.75 rounded bg-border" />
        <View className="flex-1 h-0.75 rounded bg-border" />
      </View>
      <Text className="text-ink-faint text-xs mb-4">Step 1 of 3 — Personal & employment</Text>

      {/* Info Alert */}
      <View className="bg-blue-50 rounded-xl p-3 mb-4">
        <Text className="text-blue-700 text-xs leading-4.5">
          Your name and ID details are loaded from your Saccosphere profile. Verify and complete the fields below.
        </Text>
      </View>

      {/* Form */}
      <View className="grid grid-cols-2 gap-2 mb-3">
        <View>
          <Text className="text-ink-soft text-xs font-medium mb-1">First name</Text>
          <TextInput
            className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View>
          <Text className="text-ink-soft text-xs font-medium mb-1">Last name</Text>
          <TextInput
            className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">National ID</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={nationalId}
          onChangeText={setNationalId}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Date of birth</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={dob}
          onChangeText={setDob}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Employer / Business</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={employer}
          onChangeText={setEmployer}
          placeholder="e.g. Safaricom Ltd"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Employment type</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={employmentType}
          onChangeText={setEmploymentType}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Gross monthly income (KES)</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={income}
          onChangeText={setIncome}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-4">
        <Text className="text-ink-soft text-xs font-medium mb-1">Monthly contribution (min KES 1,000)</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={contribution}
          onChangeText={setContribution}
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
        <Text className="text-mint-600 text-xs mt-1">
          This will be deducted via M-Pesa on the 25th of each month
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${!canContinue ? 'bg-surface2' : 'bg-violet-500'}`}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text className={`text-xs font-semibold ${!canContinue ? 'text-ink-muted' : 'text-white'}`}>Continue →</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}
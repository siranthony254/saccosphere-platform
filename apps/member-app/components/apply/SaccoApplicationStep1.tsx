import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useCurrentUser } from '../../store/useAuthStore'
import { useMembershipApplicationStore } from '../../store/useMembershipApplicationStore'
import { useSacco } from '../../hooks/useSaccos'
import { useSaccoFields } from '../../hooks/useSaccoFields'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

import { DynamicField } from './DynamicField'

export default function SaccoApplicationStep1() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const { setSacco, setFormData, setMonthlyContribution, formData, monthlyContribution } = useMembershipApplicationStore()
  const { data: sacco } = useSacco(slug)
  const { data: fieldsData, isLoading: fieldsLoading } = useSaccoFields(sacco?.id ?? '')

  const [firstName, setFirstName] = useState<string>(formData.firstName as string ?? user?.first_name ?? '')
  const [lastName, setLastName] = useState<string>(formData.lastName as string ?? user?.last_name ?? '')
  const [nationalId, setNationalId] = useState<string>(formData.nationalId as string ?? (user as any)?.national_id ?? '')
  const [dob, setDob] = useState<string>(formData.dob as string ?? (user as any)?.date_of_birth ?? '')
  const [employer, setEmployer] = useState<string>(formData.employer as string ?? '')
  const [employmentType, setEmploymentType] = useState<string>(formData.employmentType as string ?? '')
  const [income, setIncome] = useState<string>(formData.income as string ?? '')
  const [contribution, setContribution] = useState<string>(monthlyContribution ? String(monthlyContribution) : '')
  const [customFields, setCustomFields] = useState<Record<string, any>>(formData.customFields as Record<string, any> ?? {})

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
  const minContribution = sacco?.min_monthly_contribution ?? 1000

  // Custom field definitions from SACCO config
  const fieldDefinitions = Array.isArray(fieldsData?.results) ? fieldsData.results : []

  const canContinue = Boolean(
    firstName && lastName && nationalId && dob && employer && employmentType && contributionNumber >= minContribution &&
    fieldDefinitions.every((f: any) => !f.is_required || !!customFields[f.id])
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
      customFields,
    })
    setMonthlyContribution(contributionNumber)
    router.push(`/(member)/discover/${slug}/apply/documents`)
  }

  if (fieldsLoading) {
    return (
      <View className="bg-surface flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-ink-muted text-xs mt-3">Loading application form...</Text>
      </View>
    )
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
          <Text className="text-ink text-sm font-semibold">Apply — {sacco?.name?.toUpperCase() ?? 'SACCO'}</Text>
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

      {/* Standard Form Fields */}
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">First name</Text>
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
            value={firstName}
            onChangeText={setFirstName}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View className="flex-1">
          <Text className="text-ink-soft text-xs font-medium mb-1.5">Last name</Text>
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
            value={lastName}
            onChangeText={setLastName}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">National ID</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={nationalId}
          onChangeText={setNationalId}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">Date of birth</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">Employer / Business</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={employer}
          onChangeText={setEmployer}
          placeholder="e.g. Safaricom Ltd"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">Employment type</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={employmentType}
          onChangeText={setEmploymentType}
          placeholder="e.g. Salaried, Self-employed"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">Gross monthly income (KES)</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={income}
          onChangeText={setIncome}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Dynamic Custom Fields */}
      {fieldDefinitions.map((f: any) => (
        <DynamicField
          key={f.id}
          field={{
            key: f.id,
            label: f.label,
            type: (f.field_type || 'text').toLowerCase() as any,
            required: !!f.is_required,
            options: f.options,
          }}
          value={customFields[f.id]}
          onChange={(val) => setCustomFields(prev => ({ ...prev, [f.id]: val }))}
        />
      ))}

      <View className="mb-4">
        <Text className="text-ink-soft text-xs font-medium mb-1.5">Monthly contribution (min KES {minContribution.toLocaleString()})</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
          value={contribution}
          onChangeText={setContribution}
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
        <Text className="text-mint-600 text-[10px] mt-1.5 font-medium">
          Note: This contribution will be deducted via M-Pesa once your application is approved.
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        className={`w-full py-3.5 rounded-xl items-center shadow-sm ${!canContinue ? 'bg-surface2' : 'bg-violet-600'}`}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text className={`text-xs font-bold ${!canContinue ? 'text-ink-muted' : 'text-white'}`}>Continue to Documents →</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-10" />
    </ScrollView>
  )
}
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useProfile } from '../../../../../hooks/useProfile'
import type { AdditionalField } from '@saccosphere/schemas'

export default function ApplyStep1Screen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()

  const { setSacco, setFormData, setMonthlyContribution, formData, monthlyContribution } =
    useMembershipApplicationStore()

  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')
  const { data: userProfile } = useProfile()

  // Standard employment fields (from backend SaccoApplication model)
  const [employer, setEmployer] = useState<string>(
    (formData.employer as string) ?? ''
  )
  const [employmentType, setEmploymentType] = useState<string>(
    (formData.employmentType as string) ?? 'Employed — salaried'
  )
  const [monthlyIncome, setMonthlyIncome] = useState<string>(
    (formData.monthlyIncome as string) ?? ''
  )

  // SACCO-driven dynamic values
  const [contribution, setContribution] = useState<string>(
    monthlyContribution ? String(monthlyContribution) : ''
  )
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
    (formData.customFields as Record<string, string>) ?? {}
  )

  useEffect(() => {
    if (slug) setSacco(slug)
  }, [slug, setSacco])

  const handleCustomFieldChange = (fieldKey: string, value: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const employmentOptions = [
    'Employed — salaried',
    'Self employed',
    'Business owner',
    'Unemployed',
    'Retired',
    'Student',
  ]

  if (isLoadingConfig) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <ActivityIndicator color="#6D28D9" />
        <Text className="text-ink-muted text-xs mt-3">Loading form fields...</Text>
      </View>
    )
  }

  const saccoName = slug?.toUpperCase() ?? 'SACCO'
  const contributionNumber = Number(contribution.replace(/[^0-9]/g, ''))
  const incomeNumber = Number(monthlyIncome.replace(/[^0-9]/g, ''))
  const minContribution = config?.membership.min_monthly_contribution_kes ?? 1000

  const requiredCustomFieldsValid =
    config?.membership.additional_fields
      .filter((field) => field.required)
      .every((field) => {
        const value = customFieldValues[field.key]
        if (field.type === 'number') {
          const numValue = Number(value?.replace(/[^0-9]/g, '') || 0)
          return numValue >= (field.min ?? 0)
        }
        return Boolean(value?.trim())
      }) ?? true

  const canContinue =
    Boolean(employer && employmentType && incomeNumber >= 0) &&
    contributionNumber >= minContribution &&
    requiredCustomFieldsValid

  const handleContinue = () => {
    setFormData({
      ...formData,
      employer,
      employmentType,
      monthlyIncome,
      customFields: customFieldValues,
    })
    setMonthlyContribution(contributionNumber)
    router.push(`/(member)/discover/${slug}/apply/documents`)
  }

  return (
    <ScrollView
      className="bg-surface flex-1"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Header */}
      <View className="px-4 py-2.5 border-b border-border flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-ink-soft text-lg">←</Text>
        </TouchableOpacity>
        <View className="ml-2.5">
          <Text className="text-ink text-sm font-semibold">Apply — {saccoName}</Text>
          <Text className="text-ink-faint text-xs">Membership application</Text>
        </View>
      </View>

      {/* Progress bar - step 1 of 3 */}
      <View className="flex-row gap-1 mx-4 mb-1.5">
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
        <View className="flex-1 h-0.75 rounded bg-border" />
        <View className="flex-1 h-0.75 rounded bg-border" />
      </View>
      <Text className="text-ink-faint text-xs mx-4 mb-4">Step 1 of 3 — Application details</Text>

      {/* User info from KYC - read only */}
      <View className="mx-4 mb-4 rounded-xl p-3" style={{ backgroundColor: '#E8F1FB', borderLeftWidth: 3, borderLeftColor: '#1A5FA8' }}>
        <Text className="text-xs leading-4.5" style={{ color: '#1A5FA8' }}>
          Applying as: {userProfile?.first_name} {userProfile?.last_name}
        </Text>
        <Text className="text-ink-faint text-xs mt-1">
          ID: {userProfile?.national_id || 'Not verified'} · Phone: {userProfile?.phone_number || 'Not verified'}
        </Text>
      </View>

      {/* Employment fields (standard backend fields) */}
      <View className="mx-4 mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Employer / Business</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={employer}
          onChangeText={setEmployer}
          placeholder="e.g. Safaricom Ltd"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="mx-4 mb-3">
        <Text className="text-ink-soft text-xs font-medium mb-1">Employment type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {employmentOptions.map((option) => (
            <TouchableOpacity
              key={option}
              className={`px-3 py-2 rounded-lg border ${
                employmentType === option
                  ? 'bg-violet-500 border-violet-500'
                  : 'bg-surface2 border-border'
              }`}
              onPress={() => setEmploymentType(option)}
            >
              <Text
                className={`text-xs ${
                  employmentType === option ? 'text-white' : 'text-ink'
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="mx-4 mb-4">
        <Text className="text-ink-soft text-xs font-medium mb-1">Gross monthly income (KES)</Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          placeholder="85,000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
      </View>

      {/* Dynamic custom fields from sacco config */}
      {config?.membership.additional_fields.map((field: AdditionalField) => (
        <View key={field.key} className="mx-4 mb-3">
          <Text className="text-ink-soft text-xs font-medium mb-1">
            {field.label}
            {field.required && <Text className="text-red-500"> *</Text>}
          </Text>

          {field.type === 'select' && field.options ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {field.options.map((option) => (
                <TouchableOpacity
                  key={option}
                  className={`px-3 py-2 rounded-lg border ${
                    customFieldValues[field.key] === option
                      ? 'bg-violet-500 border-violet-500'
                      : 'bg-surface2 border-border'
                  }`}
                  onPress={() => handleCustomFieldChange(field.key, option)}
                >
                  <Text
                    className={`text-xs ${
                      customFieldValues[field.key] === option ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : field.type === 'textarea' ? (
            <TextInput
              className="bg-surface2 rounded-xl p-2.5 text-xs text-ink min-h-[80px]"
              value={customFieldValues[field.key] ?? ''}
              onChangeText={(value) => handleCustomFieldChange(field.key, value)}
              placeholder={field.placeholder ?? ''}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          ) : (
            <TextInput
              className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
              value={customFieldValues[field.key] ?? ''}
              onChangeText={(value) => handleCustomFieldChange(field.key, value)}
              placeholder={field.placeholder ?? ''}
              placeholderTextColor="#9ca3af"
              keyboardType={
                field.type === 'number' || field.type === 'phone' ? 'numeric' : 'default'
              }
            />
          )}

          {field.hint && <Text className="text-ink-faint text-xs mt-1">{field.hint}</Text>}
        </View>
      ))}

      <View className="mx-4 mb-4">
        <Text className="text-ink-soft text-xs font-medium mb-1">
          Monthly contribution (min KES {minContribution.toLocaleString()})
        </Text>
        <TextInput
          className="bg-surface2 rounded-xl p-2.5 text-xs text-ink"
          value={contribution}
          onChangeText={setContribution}
          placeholder="3,000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
        <Text className="text-violet-500 text-xs mt-1">
          This will be deducted via M-Pesa on the {config?.contributions.deduction_day ?? 25}th of
          each month
        </Text>
      </View>

      {/* Continue button */}
      <TouchableOpacity
        className={`mx-4 py-3 rounded-xl items-center ${
          !canContinue ? 'bg-surface2' : 'bg-violet-500'
        }`}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text className={`text-xs font-semibold ${!canContinue ? 'text-ink-muted' : 'text-white'}`}>
          Continue →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}


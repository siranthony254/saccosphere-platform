import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useProfile } from '../../../../../hooks/useProfile'
import type { AdditionalField } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'
import { useTheme } from '../../../../../theme/ThemeProvider'

export default function ApplyStep1Screen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()

  const {
    saccoSlug: storedSaccoSlug,
    setSacco,
    setFormData,
    setMonthlyContribution,
    formData,
    monthlyContribution,
    reset: resetApplicationStore,
  } = useMembershipApplicationStore()

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
    if (!slug) return
    // Starting a fresh application for a different SACCO than whatever was
    // last in progress — clear stale form data / uploaded-document state
    // rather than carrying it into this application by mistake.
    if (storedSaccoSlug && storedSaccoSlug !== slug) {
      resetApplicationStore()
    }
    setSacco(slug)
    // Only re-run when the slug itself changes — reading storedSaccoSlug at
    // effect-run time (not as a dependency) avoids re-triggering right after
    // setSacco/reset update it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, setSacco, resetApplicationStore])

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
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-xs mt-3" style={{ color: c.textMuted }}>Loading form fields...</Text>
        </View>
      </DeepSpaceBackground>
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
    <DeepSpaceBackground>
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 py-2.5 border-b flex-row items-center mb-4" style={{ borderColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.surface }}>
            <Text className="text-xs" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-sm font-semibold" style={{ color: c.text }}>Apply — {saccoName}</Text>
            <Text className="text-xs" style={{ color: c.textMuted }}>Membership application</Text>
          </View>
        </View>

        {/* Progress bar - step 1 of 3 */}
        <View className="flex-row gap-1 mx-4 mb-1.5">
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: c.border }} />
          <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: c.border }} />
        </View>
        <Text className="text-xs mx-4 mb-4" style={{ color: c.textFaint }}>Step 1 of 3 — Application details</Text>

        {/* User info from KYC - read only */}
        <View className="mx-4 mb-4 rounded-xl p-3" style={{ backgroundColor: c.surface, borderLeftWidth: 3, borderLeftColor: '#6D28D9' }}>
          <Text className="text-xs leading-4.5" style={{ color: c.text }}>
            Applying as: {userProfile?.first_name} {userProfile?.last_name}
          </Text>
          <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
            ID: {userProfile?.national_id || 'Not verified'} · Phone: {userProfile?.phone_number || 'Not verified'}
          </Text>
        </View>

        {/* Employment fields (standard backend fields) */}
        <View className="mx-4 mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>Employer / Business</Text>
          <TextInput
            className="rounded-xl p-2.5 text-xs border"
            style={{ backgroundColor: c.surface, color: c.text, borderColor: c.border }}
            value={employer}
            onChangeText={setEmployer}
            placeholder="e.g. Safaricom Ltd"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View className="mx-4 mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>Employment type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {employmentOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`px-3 py-2 rounded-lg border ${
                  employmentType === option ? 'bg-violet-500 border-violet-500' : ''
                }`}
                style={employmentType === option ? undefined : { backgroundColor: c.surface, borderColor: c.border }}
                onPress={() => setEmploymentType(option)}
              >
                <Text
                  className="text-xs"
                  style={{ color: employmentType === option ? '#FFFFFF' : c.textMuted }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mx-4 mb-4">
          <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>Gross monthly income (KES)</Text>
          <TextInput
            className="border rounded-xl p-2.5 text-xs"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
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
            <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>
              {field.label}
              {field.required && <Text className="text-red-400"> *</Text>}
            </Text>

            {field.type === 'select' && field.options ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {field.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    className={`px-3 py-2 rounded-lg border ${
                      customFieldValues[field.key] === option ? 'bg-violet-500 border-violet-500' : ''
                    }`}
                    style={customFieldValues[field.key] === option ? undefined : { backgroundColor: c.surface, borderColor: c.border }}
                    onPress={() => handleCustomFieldChange(field.key, option)}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: customFieldValues[field.key] === option ? '#FFFFFF' : c.textMuted }}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : field.type === 'textarea' ? (
              <TextInput
                className="border rounded-xl p-2.5 text-xs min-h-[80px]"
                style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
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
                className="border rounded-xl p-2.5 text-xs"
                style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
                value={customFieldValues[field.key] ?? ''}
                onChangeText={(value) => handleCustomFieldChange(field.key, value)}
                placeholder={field.placeholder ?? ''}
                placeholderTextColor="#9ca3af"
                keyboardType={
                  field.type === 'number' || field.type === 'phone' ? 'numeric' : 'default'
                }
              />
            )}

            {field.hint && <Text className="text-xs mt-1" style={{ color: c.textFaint }}>{field.hint}</Text>}
          </View>
        ))}

        <View className="mx-4 mb-4">
          <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>
            Monthly contribution (min KES {minContribution.toLocaleString()})
          </Text>
          <TextInput
            className="border rounded-xl p-2.5 text-xs"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}
            value={contribution}
            onChangeText={setContribution}
            placeholder="3,000"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
          <Text className="text-violet-400 text-xs mt-1.5">
            This will be deducted via M-Pesa on the {config?.contributions.deduction_day ?? 25}th of
            each month
          </Text>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          className={`mx-4 py-3 rounded-xl items-center ${!canContinue ? '' : 'bg-violet-500'}`}
          style={!canContinue ? { backgroundColor: c.surface } : undefined}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text className="text-xs font-semibold" style={{ color: !canContinue ? c.textFaint : '#FFFFFF' }}>
            Continue →
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </DeepSpaceBackground>
  )
}


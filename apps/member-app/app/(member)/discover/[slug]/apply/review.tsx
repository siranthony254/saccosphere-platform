import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSubmitMembershipApplication } from '../../../../../hooks/useMembershipApplication'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useProfile } from '../../../../../hooks/useProfile'

export default function ApplyReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { formData, monthlyContribution, saccoSlug, reset } = useMembershipApplicationStore()
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')
  const { data: userProfile } = useProfile()
  const { mutateAsync: submitApplication } = useSubmitMembershipApplication()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoadingConfig) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <ActivityIndicator color="#6D28D9" />
        <Text className="text-ink-muted text-xs mt-3">Loading application details...</Text>
      </View>
    )
  }

  const saccoName = slug?.toUpperCase() ?? 'SACCO'
  const applicantName =
    `${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`.trim() || 'Applicant'
  const employment = `${formData.employer ?? 'Employer'} · ${formData.employmentType ?? 'Employment'}`
  const contributionString = `KES ${monthlyContribution.toLocaleString()}`
  const registrationFee = config?.membership.registration_fee_kes ?? 1000
  const shareCapital = config?.membership.min_share_capital_kes ?? 5000
  const canSubmit = Boolean(
    saccoSlug &&
    (userProfile?.first_name || userProfile?.last_name) &&
    monthlyContribution >= 1000
  )

  const handleSubmit = async () => {
    if (!canSubmit || !saccoSlug) return
    setIsSubmitting(true)

    try {
      await submitApplication({
        sacco_slug: saccoSlug,
        form_data: formData,
        monthly_contribution: monthlyContribution,
      })
      reset()
      router.replace(`/(member)/discover/${slug}/apply/success`)
    } catch (error: unknown) {
      Alert.alert(
        'Submission failed',
        (error as { message?: string })?.message ??
          'Unable to submit application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
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
          <Text className="text-ink-faint text-xs">Step 3 of 3 — Review</Text>
        </View>
      </View>

      {/* Progress bar - step 3 of 3 */}
      <View className="flex-row gap-1 mx-4 mb-1.5">
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
      </View>
      <Text className="text-ink-faint text-xs mx-4 mb-4">Step 3 of 3 — Review & confirm</Text>

      {/* Application summary */}
      <View className="mx-4 bg-surface border border-border rounded-xl p-3.5 mb-2.5">
        <Text className="text-ink text-xs font-semibold mb-2">Application summary</Text>
        {[  
          { label: 'SACCO', value: saccoName },
          { label: 'Applicant', value: applicantName },
          { label: 'Employment', value: employment },
          { label: 'Monthly contribution', value: contributionString },
          { label: 'Registration fee', value: `KES ${registrationFee.toLocaleString()} · Paid via M-Pesa` },
          { label: 'Share capital to pay', value: `KES ${shareCapital.toLocaleString()}` },
        ].map((row) => (
          <View
            key={row.label}
            className="flex-row justify-between py-2 border-b border-border last:border-b-0"
          >
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <Text className="text-ink text-xs font-semibold">{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Documents */}
      <View className="mx-4 bg-surface border border-border rounded-xl p-3.5 mb-2.5">
        <Text className="text-ink text-xs font-semibold mb-2">Documents</Text>
        {config?.membership.required_documents.map((doc) => (
          <View
            key={doc.key}
            className="flex-row justify-between py-2 border-b border-border last:border-b-0"
          >
            <Text className="text-ink-muted text-xs">{doc.label}</Text>
            <View className={`px-2 py-0.5 rounded-md ${doc.already_verified_from_kyc ? 'bg-mint-100' : 'bg-blue-50'}`}>
              <Text className={`text-xs font-semibold ${doc.already_verified_from_kyc ? 'text-mint-700' : 'text-blue-700'}`}>
                {doc.already_verified_from_kyc ? '✓ Verified' : '✓ Uploaded'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Warning alert */}
      <View className="mx-4 rounded-xl p-3 mb-4" style={{ backgroundColor: '#FEF3C7' }}>
        <Text className="text-xs leading-4.5" style={{ color: '#92400E' }}>
          By submitting you agree to {saccoName}'s{' '}
          <Text className="font-semibold" style={{ color: '#C47D0E' }}>bylaws and membership terms</Text>. Your monthly
          contribution will begin after approval.
        </Text>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        className={`mx-4 py-3 rounded-xl items-center ${
          !canSubmit ? 'bg-surface2' : 'bg-violet-500'
        }`}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            className={`text-xs font-semibold ${
              !canSubmit ? 'text-ink-muted' : 'text-white'
            }`}
          >
            Submit application
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

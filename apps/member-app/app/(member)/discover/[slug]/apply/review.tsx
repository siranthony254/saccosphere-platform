import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSubmitMembershipApplication } from '../../../../../hooks/useMembershipApplication'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useProfile } from '../../../../../hooks/useProfile'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'

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
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-white/60 text-xs mt-3">Loading application details...</Text>
        </View>
      </DeepSpaceBackground>
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
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="px-4 py-2.5 border-b border-white/10 flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full bg-white/10 items-center justify-center">
            <Text className="text-white/80 text-xs">←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-white text-sm font-semibold">Apply — {saccoName}</Text>
            <Text className="text-white/60 text-xs">Step 3 of 3 — Review</Text>
          </View>
        </View>

        {/* Progress bar - step 3 of 3 */}
        <View className="flex-row gap-1 mx-4 mb-1.5">
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
        </View>
        <Text className="text-white/40 text-xs mx-4 mb-4">Step 3 of 3 — Review & confirm</Text>

        {/* Application summary */}
        <View className="mx-4 bg-white/5 border border-white/10 rounded-xl p-3.5 mb-2.5">
          <Text className="text-white text-xs font-semibold mb-2">Application summary</Text>
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
              className="flex-row justify-between py-2 border-b border-white/5 last:border-b-0"
            >
              <Text className="text-white/60 text-xs">{row.label}</Text>
              <Text className="text-white text-xs font-semibold">{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Documents */}
        <View className="mx-4 bg-white/5 border border-white/10 rounded-xl p-3.5 mb-2.5">
          <Text className="text-white text-xs font-semibold mb-2">Documents</Text>
          {config?.membership.required_documents.map((doc) => (
            <View
              key={doc.key}
              className="flex-row justify-between py-2 border-b border-white/5 last:border-b-0"
            >
              <Text className="text-white/60 text-xs">{doc.label}</Text>
              <View className={`px-2 py-0.5 rounded-md ${doc.already_verified_from_kyc ? 'bg-mint-500/20' : 'bg-blue-500/20'}`}>
                <Text className={`text-xs font-semibold ${doc.already_verified_from_kyc ? 'text-mint-400' : 'text-blue-400'}`}>
                  {doc.already_verified_from_kyc ? '✓ Verified' : '✓ Uploaded'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Warning alert */}
        <View className="mx-4 rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <Text className="text-xs leading-4.5 text-amber-500">
            By submitting you agree to {saccoName}'s{' '}
            <Text className="font-semibold text-amber-400">bylaws and membership terms</Text>. Your monthly
            contribution will begin after approval.
          </Text>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          className={`mx-4 py-3 rounded-xl items-center ${
            !canSubmit ? 'bg-white/10' : 'bg-violet-500'
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className={`text-xs font-semibold ${
                !canSubmit ? 'text-white/40' : 'text-white'
              }`}
            >
              Submit application
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

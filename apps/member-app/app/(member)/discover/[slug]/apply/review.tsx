import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSubmitMembershipApplication } from '../../../../../hooks/useMembershipApplication'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import { useProfile } from '../../../../../hooks/useProfile'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'
import { useTheme } from '../../../../../theme/ThemeProvider'

const KYC_DOCUMENT_KEYS = ['id_front', 'id_back', 'passport', 'huduma']

export default function ApplyReviewScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { formData, monthlyContribution, saccoSlug, uploadedDocumentIds, reset } = useMembershipApplicationStore()
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')
  const { data: userProfile } = useProfile()
  const { data: kycStatus } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: () => api.kyc.getStatus(),
  })
  const { mutateAsync: submitApplication } = useSubmitMembershipApplication()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasIdentityOnFile = Boolean(
    kycStatus && ((kycStatus.has_id_front && kycStatus.has_id_back) || kycStatus.has_passport)
  )

  if (isLoadingConfig) {
    return (
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-xs mt-3" style={{ color: c.textMuted }}>Loading application details...</Text>
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
  const minContribution = config?.membership.min_monthly_contribution_kes ?? 1000
  const canSubmit = Boolean(
    saccoSlug &&
    (userProfile?.first_name || userProfile?.last_name) &&
    monthlyContribution >= minContribution
  )

  const handleSubmit = async () => {
    if (!canSubmit || !saccoSlug) return
    setIsSubmitting(true)

    try {
      await submitApplication({
        sacco_slug: saccoSlug,
        form_data: formData,
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
        <View className="px-4 py-2.5 border-b flex-row items-center mb-4" style={{ borderColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.surface }}>
            <Text className="text-xs" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-sm font-semibold" style={{ color: c.text }}>Apply — {saccoName}</Text>
            <Text className="text-xs" style={{ color: c.textMuted }}>Step 3 of 3 — Review</Text>
          </View>
        </View>

        {/* Progress bar - step 3 of 3 */}
        <View className="flex-row gap-1 mx-4 mb-1.5">
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
        </View>
        <Text className="text-xs mx-4 mb-4" style={{ color: c.textFaint }}>Step 3 of 3 — Review & confirm</Text>

        {/* Application summary */}
        <View className="mx-4 border rounded-xl p-3.5 mb-2.5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Text className="text-xs font-semibold mb-2" style={{ color: c.text }}>Application summary</Text>
          {[
            { label: 'SACCO', value: saccoName },
            { label: 'Applicant', value: applicantName },
            { label: 'Employment', value: employment },
            { label: 'Monthly contribution', value: contributionString },
            { label: 'Registration fee', value: `KES ${registrationFee.toLocaleString()} · Due after approval` },
            { label: 'Share capital to pay', value: `KES ${shareCapital.toLocaleString()}` },
          ].map((row) => (
            <View
              key={row.label}
              className="flex-row justify-between py-2 border-b last:border-b-0"
              style={{ borderColor: c.border }}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>{row.label}</Text>
              <Text className="text-xs font-semibold" style={{ color: c.text }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Documents */}
        <View className="mx-4 border rounded-xl p-3.5 mb-2.5" style={{ backgroundColor: c.surface, borderColor: c.border }}>
          <Text className="text-xs font-semibold mb-2" style={{ color: c.text }}>Documents</Text>
          {config?.membership.required_documents.map((doc) => {
            const isVerifiedFromKyc = Boolean(
              doc.already_verified_from_kyc || (KYC_DOCUMENT_KEYS.includes(doc.key) && hasIdentityOnFile)
            )
            const isUploaded = isVerifiedFromKyc || uploadedDocumentIds.includes(doc.key)
            return (
              <View
                key={doc.key}
                className="flex-row justify-between py-2 border-b last:border-b-0"
                style={{ borderColor: c.border }}
              >
                <Text className="text-xs" style={{ color: c.textMuted }}>{doc.label}</Text>
                <View className={`px-2 py-0.5 rounded-md ${isVerifiedFromKyc ? 'bg-mint-500/20' : isUploaded ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                  <Text className={`text-xs font-semibold ${isVerifiedFromKyc ? 'text-mint-400' : isUploaded ? 'text-blue-400' : 'text-amber-500'}`}>
                    {isVerifiedFromKyc ? 'Verified' : isUploaded ? 'Uploaded' : 'Missing'}
                  </Text>
                </View>
              </View>
            )
          })}
          {config?.membership.required_documents.some(
            (doc) => doc.already_verified_from_kyc || (KYC_DOCUMENT_KEYS.includes(doc.key) && hasIdentityOnFile)
          ) && (
            <Text className="text-xs mt-2" style={{ color: c.textFaint }}>
              &ldquo;Verified&rdquo; documents are confirmed directly with {saccoName} from your account
              verification, rather than attached to this application.
            </Text>
          )}
        </View>

        {/* Warning alert */}
        <View className="mx-4 rounded-xl p-3 mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <Text className="text-xs leading-4.5 text-amber-500">
            By submitting you agree to {saccoName}&apos;s{' '}
            <Text className="font-semibold text-amber-400">bylaws and membership terms</Text>. Your monthly
            contribution will begin after approval.
          </Text>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          className={`mx-4 py-3 rounded-xl items-center ${!canSubmit ? '' : 'bg-violet-500'}`}
          style={!canSubmit ? { backgroundColor: c.surface } : undefined}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              className="text-xs font-semibold"
              style={{ color: !canSubmit ? c.textFaint : '#FFFFFF' }}
            >
              Submit application
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

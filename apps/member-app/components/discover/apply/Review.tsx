import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMembershipApplicationStore } from '../../../store/useMembershipApplicationStore'
import { useSubmitMembershipApplication } from '../../../hooks/useMembershipApplication'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

export default function SaccoApplicationReview() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { formData, monthlyContribution, saccoSlug } = useMembershipApplicationStore()
  const { mutateAsync: submitApplication } = useSubmitMembershipApplication()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applicantName = `${formData.firstName ?? ''} ${formData.lastName ?? ''}`.trim() || 'Applicant'
  const employment = `${formData.employer ?? 'Employer'} · ${formData.employmentType ?? 'Employment'}`
  const contributionString = `KES ${monthlyContribution.toLocaleString()}`
  const saccoName = saccoSlug ? saccoSlug.toUpperCase() : slug?.toUpperCase() ?? 'SACCO'

  const canSubmit = Boolean(saccoSlug && formData.firstName && formData.lastName && monthlyContribution >= 1000)

  const handleSubmit = async () => {
    if (!canSubmit || !saccoSlug) return
    setIsSubmitting(true)

    try {
      await submitApplication({
        sacco_slug: saccoSlug,
        form_data: formData,
        monthly_contribution: monthlyContribution,
      })
      router.push(`/(member)/discover/${slug}/apply/success`)
    } catch (error: unknown) {
      Alert.alert('Submission failed', (error as { message?: string })?.message ?? 'Unable to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
          <Text className="text-ink text-sm font-semibold">Apply — {saccoName}</Text>
          <Text className="text-ink-faint text-xs">Step 3 of 3 — Review</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="flex-row gap-1 mb-1.5">
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-500" />
        <View className="flex-1 h-0.75 rounded bg-violet-400" />
      </View>
      <Text className="text-ink-faint text-xs mb-4">Step 3 of 3 — Review & confirm</Text>

      {/* Application Summary */}
      <View className="bg-surface border border-border rounded-xl p-3.5 mb-2.5">
        <Text className="text-ink text-xs font-semibold mb-2">Application summary</Text>
        {[
          { label: 'SACCO', value: saccoName },
          { label: 'Applicant', value: applicantName },
          { label: 'Employment', value: employment },
          { label: 'Monthly contribution', value: contributionString },
          { label: 'Registration fee', value: 'KES 1,000 · Paid via M-Pesa' },
          { label: 'Share capital to pay', value: 'KES 5,000' },
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
      <View className="bg-surface border border-border rounded-xl p-3.5 mb-2.5">
        <Text className="text-ink text-xs font-semibold mb-2">Documents</Text>
        {[
          { label: 'National ID', status: '✓ Verified' },
          { label: 'Passport photo', status: '✓ Verified' },
          { label: 'Payslip', status: '✓ Uploaded' },
          { label: 'Bank statement', status: '✓ Uploaded' },
        ].map((row) => (
          <View
            key={row.label}
            className="flex-row justify-between py-2 border-b border-border last:border-b-0"
          >
            <Text className="text-ink-muted text-xs">{row.label}</Text>
            <View className="bg-mint-100 px-2 py-0.5 rounded-md">
              <Text className="text-mint-700 text-xs font-semibold">{row.status}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Warning Alert */}
      <View className="bg-amber-50 rounded-xl p-3 mb-4">
        <Text className="text-amber-700 text-xs leading-4.5">
          By submitting you agree to {saccoName}'s <Text className="text-amber-700 font-semibold">bylaws and membership terms</Text>. Your monthly contribution will begin after approval.
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${!canSubmit ? 'bg-surface2' : 'bg-violet-500'}`}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className={`text-xs font-semibold ${!canSubmit ? 'text-ink-muted' : 'text-white'}`}>Submit application</Text>
        )}
      </TouchableOpacity>

      {/* Spacer */}
      <View className="h-7.5" />
    </ScrollView>
  )
}
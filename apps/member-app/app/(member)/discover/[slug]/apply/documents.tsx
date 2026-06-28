import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import type { RequiredDocument } from '@saccosphere/schemas'

export default function ApplyDocumentsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { saccoSlug } = useMembershipApplicationStore()
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')

  const saccoName = slug?.toUpperCase() ?? 'SACCO'
  const isReady = Boolean(saccoSlug && config)

  if (isLoadingConfig) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <ActivityIndicator color="#6D28D9" />
        <Text className="text-ink-muted text-xs mt-3">Loading document requirements...</Text>
      </View>
    )
  }

  const requiredDocs = config?.membership.required_documents ?? []
  const kycVerifiedDocs = requiredDocs.filter(doc => doc.already_verified_from_kyc)
  const docsToUpload = requiredDocs.filter(doc => !doc.already_verified_from_kyc)
  const registrationFee = config?.membership.registration_fee_kes ?? 1000

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
          <Text className="text-ink-faint text-xs">Step 2 of 3 — Documents</Text>
        </View>
      </View>

      {/* Progress bar - step 2 of 3 */}
      <View className="flex-row gap-1 mx-4 mb-1.5">
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
        <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: '#6D28D9' }} />
        <View className="flex-1 h-0.75 rounded bg-border" />
      </View>
      <Text className="text-ink-faint text-xs mx-4 mb-4">Step 2 of 3 — Required documents</Text>

      <Text className="text-ink text-xs font-medium mx-4 mb-2.5">
        {saccoName} requires the following:
      </Text>

      {/* KYC Verified Documents */}
      {kycVerifiedDocs.length > 0 && (
        <>
          <Text className="text-ink-faint text-xs mb-2 mx-4">Auto-imported from your KYC</Text>
          {kycVerifiedDocs.map((doc: RequiredDocument) => (
            <View key={doc.key} className="flex-row gap-2.5 mx-4 mb-3">
              <View className="w-6 h-6 rounded-full justify-center items-center" style={{ backgroundColor: '#10B981' }}>
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
              <View>
                <Text className="text-ink text-xs font-semibold" style={{ color: '#084D32' }}>
                  {doc.label}
                </Text>
                <Text className="text-ink-faint text-xs">Auto-imported from your KYC · Verified</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Documents to Upload */}
      {docsToUpload.length > 0 && (
        <>
          <Text className="text-ink-faint text-xs mb-2 mx-4 mt-4">Upload the following</Text>
          {docsToUpload.map((doc: RequiredDocument) => (
            <TouchableOpacity key={doc.key} className="mx-4 bg-surface2 border border-border rounded-xl p-3 mb-2.5 flex-row gap-2.5 items-start">
              <Text className="text-base">📄</Text>
              <View className="flex-1">
                <Text className="text-ink text-xs font-semibold mb-0.5">{doc.label}</Text>
                <Text className="text-ink-faint text-xs">
                  Required by {saccoName}
                  {doc.accepted_formats && ` · ${doc.accepted_formats.join(', ')}`}
                </Text>
                {doc.hint && (
                  <Text className="text-ink-faint text-xs mt-0.5">{doc.hint}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Payment of registration fee */}
      <View className="mx-4 mb-4">
        <Text className="text-ink-soft text-xs font-medium mb-1">
          Payment of registration fee (KES {registrationFee.toLocaleString()})
        </Text>
        <View className="flex-row gap-2 mt-1">
          <TouchableOpacity className="flex-1 p-2.5 rounded-xl items-center" style={{ borderWidth: 2, borderColor: '#10B981' }}>
            <Text className="text-xs font-semibold" style={{ color: '#10B981' }}>
              Pay via M-Pesa
            </Text>
            <Text className="text-ink-faint text-xs">Instant · +KES 25 fee</Text>
          </TouchableOpacity>
          {config?.payments.accepted_methods.includes('bank_transfer') && (
            <TouchableOpacity className="flex-1 p-2.5 border border-border rounded-xl items-center">
              <Text className="text-ink-soft text-xs font-semibold">Bank transfer</Text>
              <Text className="text-ink-faint text-xs">3–5 days</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Continue button */}
      <TouchableOpacity
        className={`mx-4 py-3 rounded-xl items-center ${
          !isReady ? 'bg-surface2' : 'bg-violet-500'
        }`}
        onPress={() => router.push(`/(member)/discover/${slug}/apply/review`)}
        disabled={!isReady}
      >
        <Text
          className={`text-xs font-semibold ${
            !isReady ? 'text-ink-muted' : 'text-white'
          }`}
        >
          Continue →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

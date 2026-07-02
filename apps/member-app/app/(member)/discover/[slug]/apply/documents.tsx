import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import type { RequiredDocument } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'

export default function ApplyDocumentsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { saccoSlug } = useMembershipApplicationStore()
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')

  const saccoName = slug?.toUpperCase() ?? 'SACCO'
  const isReady = Boolean(saccoSlug && config)

  if (isLoadingConfig) {
    return (
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-white/60 text-xs mt-3">Loading document requirements...</Text>
        </View>
      </DeepSpaceBackground>
    )
  }

  const requiredDocs = config?.membership.required_documents ?? []
  const kycVerifiedDocs = requiredDocs.filter(doc => doc.already_verified_from_kyc)
  const docsToUpload = requiredDocs.filter(doc => !doc.already_verified_from_kyc)
  const registrationFee = config?.membership.registration_fee_kes ?? 1000

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
            <Text className="text-white/60 text-xs">Step 2 of 3 — Documents</Text>
          </View>
        </View>

        {/* Progress bar - step 2 of 3 */}
        <View className="flex-row gap-1 mx-4 mb-1.5">
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-white/20" />
        </View>
        <Text className="text-white/40 text-xs mx-4 mb-4">Step 2 of 3 — Required documents</Text>

        <Text className="text-white/80 text-xs font-medium mx-4 mb-2.5">
          {saccoName} requires the following:
        </Text>

        {/* KYC Verified Documents */}
        {kycVerifiedDocs.length > 0 && (
          <>
            <Text className="text-white/40 text-xs mb-2 mx-4">Auto-imported from your KYC</Text>
            {kycVerifiedDocs.map((doc: RequiredDocument) => (
              <View key={doc.key} className="flex-row gap-2.5 mx-4 mb-3">
                <View className="w-6 h-6 rounded-full justify-center items-center bg-mint-500">
                  <Text className="text-white text-xs font-bold">✓</Text>
                </View>
                <View>
                  <Text className="text-mint-400 text-xs font-semibold">
                    {doc.label}
                  </Text>
                  <Text className="text-white/60 text-xs">Auto-imported from your KYC · Verified</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Documents to Upload */}
        {docsToUpload.length > 0 && (
          <>
            <Text className="text-white/40 text-xs mb-2 mx-4 mt-4">Upload the following</Text>
            {docsToUpload.map((doc: RequiredDocument) => (
              <TouchableOpacity key={doc.key} className="mx-4 bg-white/5 border border-white/10 rounded-xl p-3 mb-2.5 flex-row gap-2.5 items-start">
                <Text className="text-base">📄</Text>
                <View className="flex-1">
                  <Text className="text-white text-xs font-semibold mb-0.5">{doc.label}</Text>
                  <Text className="text-white/60 text-xs">
                    Required by {saccoName}
                    {doc.accepted_formats && ` · ${doc.accepted_formats.join(', ')}`}
                  </Text>
                  {doc.hint && (
                    <Text className="text-white/40 text-xs mt-0.5">{doc.hint}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Payment of registration fee */}
        <View className="mx-4 mb-4 mt-2">
          <Text className="text-white/80 text-xs font-medium mb-1">
            Payment of registration fee (KES {registrationFee.toLocaleString()})
          </Text>
          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity className="flex-1 p-2.5 rounded-xl items-center border border-mint-500 bg-mint-500/10">
              <Text className="text-xs font-semibold text-mint-400">
                Pay via M-Pesa
              </Text>
              <Text className="text-white/60 text-xs">Instant · +KES 25 fee</Text>
            </TouchableOpacity>
            {config?.payments.accepted_methods.includes('bank_transfer') && (
              <TouchableOpacity className="flex-1 p-2.5 border border-white/20 rounded-xl items-center bg-white/5">
                <Text className="text-white/80 text-xs font-semibold">Bank transfer</Text>
                <Text className="text-white/40 text-xs">3–5 days</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          className={`mx-4 py-3 rounded-xl items-center ${
            !isReady ? 'bg-white/10' : 'bg-violet-500'
          }`}
          onPress={() => router.push(`/(member)/discover/${slug}/apply/review`)}
          disabled={!isReady}
        >
          <Text
            className={`text-xs font-semibold ${
              !isReady ? 'text-white/40' : 'text-white'
            }`}
          >
            Continue →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </DeepSpaceBackground>
  )
}

import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@saccosphere/api-client'
import { useMembershipApplicationStore } from '../../../../../store/useMembershipApplicationStore'
import { useSaccoConfig } from '../../../../../hooks/useSaccoConfig'
import type { RequiredDocument } from '@saccosphere/schemas'
import { DeepSpaceBackground } from '../../../../../components/DeepSpaceBackground'
import { Icon } from '../../../../../components/ui/Icon'
import { useTheme } from '../../../../../theme/ThemeProvider'

const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const
const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const
const KYC_DOCUMENT_KEYS = ['id_front', 'id_back', 'passport', 'huduma'] as const
type KycDocumentKey = (typeof KYC_DOCUMENT_KEYS)[number]

function isKycDocumentKey(key: string): key is KycDocumentKey {
  return (KYC_DOCUMENT_KEYS as readonly string[]).includes(key)
}

function hasAcceptedExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return Boolean(extension && (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(extension))
}

function isAcceptedImage(fileName: string, mimeType: string) {
  return (
    (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase()) &&
    hasAcceptedExtension(fileName)
  )
}

function buildDocFileName(fileName: string | null | undefined, key: string, mimeType: string) {
  const fallbackExtension = mimeType === 'image/png' ? 'png' : 'jpg'
  const fallbackName = `${key}.${fallbackExtension}`
  const name = fileName?.trim() || fallbackName
  return hasAcceptedExtension(name) ? name : `${name}.${fallbackExtension}`
}

export default function ApplyDocumentsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { saccoSlug, uploadedDocumentIds, addDocument } = useMembershipApplicationStore()
  const { data: config, isLoading: isLoadingConfig } = useSaccoConfig(slug ?? '')
  const { data: kycStatus, isLoading: isLoadingKyc } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: () => api.kyc.getStatus(),
  })
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const saccoName = slug?.toUpperCase() ?? 'SACCO'

  // Any full identity document already on file from registration covers all
  // of id_front/id_back/passport/huduma here — they're interchangeable proof
  // of identity, and the KYCUploadView endpoint this screen would otherwise
  // call to "upload" a document is currently broken server-side (every
  // request 500s). Skip re-uploading whatever the member already has.
  const hasIdentityOnFile = Boolean(
    kycStatus && ((kycStatus.has_id_front && kycStatus.has_id_back) || kycStatus.has_passport)
  )

  const requiredDocs = config?.membership.required_documents ?? []
  const kycVerifiedDocs = requiredDocs.filter(
    (doc) => doc.already_verified_from_kyc || (isKycDocumentKey(doc.key) && hasIdentityOnFile)
  )
  const docsToUpload = requiredDocs.filter(
    (doc) => !doc.already_verified_from_kyc && !(isKycDocumentKey(doc.key) && hasIdentityOnFile)
  )
  const registrationFee = config?.membership.registration_fee_kes ?? 1000

  // Mark KYC-covered documents as satisfied in the application store so the
  // "Continue" gate below sees them as done, without ever calling the
  // broken per-document upload endpoint.
  useEffect(() => {
    kycVerifiedDocs.forEach((doc) => {
      if (!uploadedDocumentIds.includes(doc.key)) addDocument(doc.key)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIdentityOnFile, requiredDocs.length])

  const allRequiredUploaded = docsToUpload
    .filter(doc => doc.required)
    .every(doc => uploadedDocumentIds.includes(doc.key))
  const isReady = Boolean(saccoSlug && config && allRequiredUploaded)

  const handleUpload = async (doc: RequiredDocument) => {
    if (!isKycDocumentKey(doc.key)) {
      Alert.alert('Not supported yet', `${doc.label} can't be uploaded from this screen yet — contact ${saccoName} directly.`)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    const mimeType = asset.mimeType ?? 'image/jpeg'
    const fileName = buildDocFileName(asset.fileName, doc.key, mimeType)

    if (!isAcceptedImage(fileName, mimeType)) {
      Alert.alert('Unsupported file', 'Upload a JPG, JPEG, or PNG image.')
      return
    }

    setUploadingKey(doc.key)
    try {
      await api.kyc.uploadDocument({
        document_type: doc.key,
        file: { uri: asset.uri, name: fileName, type: mimeType },
      })
      addDocument(doc.key)
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Unable to upload this document. Please try again.')
    } finally {
      setUploadingKey(null)
    }
  }

  if (isLoadingConfig || isLoadingKyc) {
    return (
      <DeepSpaceBackground>
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator color="#6D28D9" />
          <Text className="text-xs mt-3" style={{ color: c.textMuted }}>Loading document requirements...</Text>
        </View>
      </DeepSpaceBackground>
    )
  }

  return (
    <DeepSpaceBackground>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="px-4 py-2.5 border-b flex-row items-center mb-4" style={{ borderColor: c.border }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: c.surface }}>
            <Text className="text-xs" style={{ color: c.textMuted }}>←</Text>
          </TouchableOpacity>
          <View className="ml-2.5">
            <Text className="text-sm font-semibold" style={{ color: c.text }}>Apply — {saccoName}</Text>
            <Text className="text-xs" style={{ color: c.textMuted }}>Step 2 of 3 — Documents</Text>
          </View>
        </View>

        {/* Progress bar - step 2 of 3 */}
        <View className="flex-row gap-1 mx-4 mb-1.5">
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded bg-violet-500" />
          <View className="flex-1 h-0.75 rounded" style={{ backgroundColor: c.border }} />
        </View>
        <Text className="text-xs mx-4 mb-4" style={{ color: c.textFaint }}>Step 2 of 3 — Required documents</Text>

        <Text className="text-xs font-medium mx-4 mb-2.5" style={{ color: c.textMuted }}>
          {saccoName} requires the following:
        </Text>

        {/* KYC Verified Documents */}
        {kycVerifiedDocs.length > 0 && (
          <>
            <Text className="text-xs mb-2 mx-4" style={{ color: c.textFaint }}>Already on file from your account verification</Text>
            {kycVerifiedDocs.map((doc: RequiredDocument) => (
              <View key={doc.key} className="flex-row gap-2.5 mx-4 mb-3">
                <View className="w-6 h-6 rounded-full justify-center items-center bg-mint-500">
                  <Icon name="check" size={12} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text className="text-mint-400 text-xs font-semibold">
                    {doc.label}
                  </Text>
                  <Text className="text-xs" style={{ color: c.textMuted }}>Verified during account setup — no need to re-upload</Text>
                </View>
              </View>
            ))}
            <View className="mx-4 mb-4 rounded-xl p-3 border" style={{ borderColor: c.border, backgroundColor: c.surfaceAlt }}>
              <Text className="text-xs leading-4.5" style={{ color: c.textFaint }}>
                {saccoName} will confirm your identity verification status directly rather than receiving these images
                as part of this application.
              </Text>
            </View>
          </>
        )}

        {/* Documents to Upload */}
        {docsToUpload.length > 0 && (
          <>
            <Text className="text-xs mb-2 mx-4 mt-4" style={{ color: c.textFaint }}>Upload the following</Text>
            {docsToUpload.map((doc: RequiredDocument) => {
              const isUploaded = uploadedDocumentIds.includes(doc.key)
              const isUploading = uploadingKey === doc.key
              return (
                <TouchableOpacity
                  key={doc.key}
                  className="mx-4 border rounded-xl p-3 mb-2.5 flex-row gap-2.5 items-start"
                  style={{
                    backgroundColor: c.surface,
                    borderColor: isUploaded ? c.success : c.border,
                  }}
                  onPress={() => handleUpload(doc)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={c.accent} />
                  ) : (
                    <Icon name={isUploaded ? 'check' : 'file'} size={16} color={isUploaded ? c.success : '#6B7280'} />
                  )}
                  <View className="flex-1">
                    <Text className="text-xs font-semibold mb-0.5" style={{ color: c.text }}>{doc.label}</Text>
                    <Text className="text-xs" style={{ color: isUploaded ? c.success : c.textMuted }}>
                      {isUploading
                        ? 'Uploading…'
                        : isUploaded
                          ? 'Uploaded — tap to replace'
                          : `Required by ${saccoName}${doc.accepted_formats ? ` · ${doc.accepted_formats.join(', ')}` : ''}`}
                    </Text>
                    {doc.hint && !isUploaded && (
                      <Text className="text-xs mt-0.5" style={{ color: c.textFaint }}>{doc.hint}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </>
        )}

        {/* Registration fee notice */}
        <View className="mx-4 mb-4 mt-2">
          <Text className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>
            Registration fee (KES {registrationFee.toLocaleString()})
          </Text>
          <View className="rounded-xl p-3 border" style={{ borderColor: c.border, backgroundColor: c.surface }}>
            <Text className="text-xs leading-4.5" style={{ color: c.textMuted }}>
              No payment is needed to submit. {saccoName} will send M-Pesa payment instructions
              once your application is approved.
            </Text>
          </View>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          className={`mx-4 py-3 rounded-xl items-center ${!isReady ? '' : 'bg-violet-500'}`}
          style={!isReady ? { backgroundColor: c.surface } : undefined}
          onPress={() => router.push(`/(member)/discover/${slug}/apply/review`)}
          disabled={!isReady}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: !isReady ? c.textFaint : '#FFFFFF' }}
          >
            Continue →
          </Text>
        </TouchableOpacity>
        {!isReady && docsToUpload.some(doc => doc.required) && (
          <Text className="text-xs text-center mt-2" style={{ color: c.textFaint }}>
            Upload all required documents to continue
          </Text>
        )}
      </ScrollView>
    </DeepSpaceBackground>
  )
}

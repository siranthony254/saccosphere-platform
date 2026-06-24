import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@saccosphere/api-client'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { useIsAuthenticated } from '../../../store/useAuthStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const VIOLET = '#6D28D9'
const MINT = '#10B981'
const MINT_LIGHT = '#E6F7F1'
const MINT_700 = '#084D32'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const SURFACE3 = '#F1F5F9'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

type PickedDocument = {
  uri: string
  name: string
  type: string
  file?: Blob
}

const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const
const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const

type IdSide = 'front' | 'back'

export default function RegisterKYC() {
  const insets = useSafeAreaInsets()
  const { step1, otpVerified, addKYCDocument } = useRegistrationStore()
  const isAuthenticated = useIsAuthenticated()
  const [idFront, setIdFront] = useState<PickedDocument | null>(null)
  const [idBack, setIdBack] = useState<PickedDocument | null>(null)
  const [loading, setLoading] = useState(false)

  const canContinue = idFront && idBack

  if (!step1 || !isAuthenticated || !otpVerified) {
    if (!step1) router.replace('/(auth)/register')
    else router.replace('/(auth)/register/otp')
    return null
  }

  const handleUpload = async (side: IdSide) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    })

    if (result.canceled) return

    const asset = result.assets[0]
    const mimeType = asset.mimeType ?? 'image/jpeg'
    const fileName = buildKycFileName(asset.fileName, side, mimeType)

    if (!isAcceptedImage(fileName, mimeType)) {
      Alert.alert('Unsupported file', 'Upload a JPG, JPEG, or PNG image.')
      return
    }

    const document = {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
      file: asset.file,
    }

    if (side === 'front') setIdFront(document)
    else setIdBack(document)
  }

  const uploadPickedDocument = async (document_type: 'id_front' | 'id_back', document: PickedDocument) => {
    const uploaded = await api.kyc.uploadDocument({
      document_type,
      file: document as unknown as Blob,
    })
    if (uploaded?.id) addKYCDocument(uploaded.id)
  }

  const handleContinue = async () => {
    if (!step1 || !idFront || !idBack) return
    if (!isAuthenticated) {
      router.replace('/(auth)/register/otp')
      return
    }
    setLoading(true)
    try {
      await uploadPickedDocument('id_front', idFront)
      await uploadPickedDocument('id_back', idBack)
      router.push('/(auth)/register/link-saccos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
        paddingTop: 20,
      }}
      keyboardShouldPersistTaps="handled"
      className="bg-surface"
    >
      {/* Step progress bar */}
      <View className="flex-row gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i < 3 ? VIOLET : BORDER }}
          />
        ))}
      </View>
      <Text className="text-xs mb-4" style={{ color: INK_FAINT }}>
        Step 3 of 4 — Verify your identity
      </Text>

      {/* Brand */}
      <Text className="text-sm font-bold mb-4" style={{ color: VIOLET, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-ink text-base font-bold mb-1">ID verification</Text>
      <Text className="text-xs mb-5" style={{ color: INK_MUTED, lineHeight: 18 }}>
        Required by SASRA regulations. Your documents are encrypted and never shared.
      </Text>

      {/* ID Front - uploaded state */}
      {idFront ? (
        <View className="flex-row items-center gap-3 rounded-xl p-3 mb-2.5" style={{ backgroundColor: MINT_LIGHT }}>
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: MINT }}
          >
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
          <View>
            <Text className="text-xs font-semibold" style={{ color: MINT_700 }}>
              National ID — Front
            </Text>
            <Text className="text-xs" style={{ color: MINT }}>
              {idFront.name || 'Ready to upload securely'}
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="border-2 border-dashed rounded-xl p-4 items-center mb-3"
          style={{ borderColor: BORDER_MID, backgroundColor: SURFACE2 }}
          onPress={() => handleUpload('front')}
        >
          <View
            className="w-8 h-8 rounded-xl items-center justify-center mb-2"
            style={{ backgroundColor: SURFACE3 || '#F1F5F9' }}
          >
            <Text className="text-base">📷</Text>
          </View>
          <Text className="text-xs font-semibold mb-0.5" style={{ color: INK }}>
            Upload ID — Front
          </Text>
          <Text className="text-xs" style={{ color: INK_FAINT }}>
            JPG, PNG or PDF · Max 5MB
          </Text>
        </TouchableOpacity>
      )}

      {/* ID Back - uploaded state */}
      {idBack ? (
        <View className="flex-row items-center gap-3 rounded-xl p-3 mb-2.5" style={{ backgroundColor: MINT_LIGHT }}>
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: MINT }}
          >
            <Text className="text-white text-xs font-bold">✓</Text>
          </View>
          <View>
            <Text className="text-xs font-semibold" style={{ color: MINT_700 }}>
              National ID — Back
            </Text>
            <Text className="text-xs" style={{ color: MINT }}>
              {idBack.name || 'Ready to upload securely'}
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="border-2 border-dashed rounded-xl p-4 items-center mb-3"
          style={{ borderColor: BORDER_MID, backgroundColor: SURFACE2 }}
          onPress={() => handleUpload('back')}
        >
          <View className="w-8 h-8 rounded-sm bg-surface3 items-center justify-center mb-2">
            <Text className="text-base">📷</Text>
          </View>
          <Text className="text-xs font-semibold mb-0.5" style={{ color: INK }}>
            Upload ID — Back
          </Text>
          <Text className="text-xs" style={{ color: INK_FAINT }}>
            JPG, PNG or PDF · Max 5MB
          </Text>
        </TouchableOpacity>
      )}

      {/* Alert */}
      <View
        className="rounded-xl p-3 mb-5"
        style={{
          backgroundColor: '#FEF3E8',
          borderLeftWidth: 3,
          borderLeftColor: '#D97706',
        }}
      >
        <Text className="text-xs leading-5" style={{ color: '#7A4F08' }}>
          Why we need this: SASRA requires all SACCO platform operators to verify member
          identity before processing transactions.{' '}
          <Text className="font-semibold" style={{ color: '#D97706' }}>
            Learn more
          </Text>
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        className="rounded-xl py-3.5 items-center"
        style={{ backgroundColor: VIOLET, opacity: !canContinue ? 0.5 : 1 }}
        onPress={handleContinue}
        disabled={!canContinue || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Continue →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

function buildKycFileName(fileName: string | null | undefined, side: IdSide, mimeType: string) {
  const fallbackExtension = mimeType === 'image/png' ? 'png' : 'jpg'
  const fallbackName = `${side}-id.${fallbackExtension}`
  const name = fileName?.trim() || fallbackName

  return hasAcceptedExtension(name) ? name : `${name}.${fallbackExtension}`
}

function isAcceptedImage(fileName: string, mimeType: string) {
  return (
    (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase()) &&
    hasAcceptedExtension(fileName)
  )
}

function hasAcceptedExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return Boolean(extension && (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(extension))
}

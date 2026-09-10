import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScreen } from '../../../components/ui/KeyboardAwareScreen'
import * as ImagePicker from 'expo-image-picker'
import { useRegistrationStore } from '../../../store/useRegistrationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
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

import { Icon } from '../../../components/ui/Icon'

type PickedDocument = {
  uri: string
  name: string
  type: string
  file?: Blob
}

const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const
const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const

type IdSide = 'id_front' | 'id_back' | 'passport' | 'huduma'
type DocType = 'id_card' | 'passport' | 'huduma_card'

export default function RegisterKYC() {
  const insets = useSafeAreaInsets()
  const {
    step1,
    otpVerified,
    setKYCDocuments,
    setIDInfo,
    idNumber: initialIdNumber,
    dateOfBirth: initialDob,
    documentType: initialDocType,
    kycDocuments: savedDocs
  } = useRegistrationStore()

  const [docType, setDocType] = useState<DocType>(initialDocType || 'id_card')
  const [idFront, setIdFront] = useState<PickedDocument | null>(savedDocs.id_front)
  const [idBack, setIdBack] = useState<PickedDocument | null>(savedDocs.id_back)
  const [passport, setPassport] = useState<PickedDocument | null>(savedDocs.passport)
  const [huduma, setHuduma] = useState<PickedDocument | null>(savedDocs.huduma)

  const [idNumber, setIdNumber] = useState(initialIdNumber || '')
  const [dob, setDob] = useState(initialDob || '')
  const [loading, setLoading] = useState(false)

  const canContinue = (() => {
    if (idNumber.length < 7 || dob.length !== 10) return false
    if (docType === 'id_card') return !!idFront && !!idBack
    if (docType === 'passport') return !!passport
    if (docType === 'huduma_card') return !!huduma
    return false
  })()

  if (!step1 || !otpVerified) {
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
    }

    if (side === 'id_front') setIdFront(document)
    else if (side === 'id_back') setIdBack(document)
    else if (side === 'passport') setPassport(document)
    else if (side === 'huduma') setHuduma(document)
  }

  const handleContinue = async () => {
    if (!step1) return
    
    setIDInfo(idNumber, dob, docType)

    setKYCDocuments({
      id_front: idFront,
      id_back: idBack,
      passport: passport,
      huduma: huduma,
    })
    
    router.push('/(auth)/register/link-saccos')
  }

  return (
    <KeyboardAwareScreen
      background={BACKGROUND}
      contentContainerStyle={{
        paddingHorizontal: PADDING_H,
        paddingBottom: insets.bottom + 20,
        paddingTop: insets.top + 20,
      }}
    >
      {/* Step progress bar */}
      <View className="flex-row gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 h-0.5 rounded"
            style={{ backgroundColor: i < 3 ? VIOLET : BORDER_WHITE }}
          />
        ))}
      </View>
      <Text className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
        Step 3 of 4 — Verify your identity
      </Text>

      <Text className="text-sm font-bold mb-4" style={{ color: VIOLET, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      <Text className="text-base font-bold mb-1" style={{ color: TEXT }}>ID verification</Text>
      <Text className="text-xs mb-5" style={{ color: TEXT_MUTED, lineHeight: 18 }}>
        Required by SASRA regulations. Your documents are encrypted and never shared.
      </Text>

      {/* Document Type Selector */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: TEXT_MUTED }}>
        Select Document Type
      </Text>
      <View className="flex-row gap-2 mb-4">
        {(['id_card', 'passport', 'huduma_card'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setDocType(type)}
            className="flex-1 py-2 px-1 border rounded-lg items-center justify-center"
            style={{
              borderColor: docType === type ? VIOLET : BORDER_WHITE,
              backgroundColor: docType === type ? 'rgba(109, 40, 217, 0.1)' : FROSTED_DARK
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase text-center"
              style={{ color: docType === type ? VIOLET : TEXT_MUTED }}
            >
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ID Number */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: TEXT_MUTED }}>
        {docType === 'passport' ? 'Passport Number' : 'National ID Number'}
      </Text>
      <TextInput
        className="border rounded-xl p-3 text-sm mb-3"
        style={{
          borderColor: BORDER_WHITE,
          color: TEXT,
          backgroundColor: FROSTED_DARK,
        }}
        value={idNumber}
        onChangeText={setIdNumber}
        placeholder={docType === 'passport' ? 'A12345678' : '12345678'}
        autoCapitalize="characters"
        placeholderTextColor={TEXT_MUTED}
      />

      {/* Date of Birth */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: TEXT_MUTED }}>
        Date of Birth (YYYY-MM-DD)
      </Text>
      <TextInput
        className="border rounded-xl p-3 text-sm mb-4"
        style={{
          borderColor: BORDER_WHITE,
          color: TEXT,
          backgroundColor: FROSTED_DARK,
        }}
        value={dob}
        onChangeText={setDob}
        placeholder="1990-01-01"
        placeholderTextColor={TEXT_MUTED}
      />

      {/* Conditional Document Uploads */}
      {docType === 'id_card' && (
        <>
          <KycUploadButton
            label="Upload ID — Front"
            side="id_front"
            document={idFront}
            onUpload={() => handleUpload('id_front')}
          />
          <KycUploadButton
            label="Upload ID — Back"
            side="id_back"
            document={idBack}
            onUpload={() => handleUpload('id_back')}
          />
        </>
      )}

      {docType === 'passport' && (
        <KycUploadButton
          label="Upload Passport Bio-page"
          side="passport"
          document={passport}
          onUpload={() => handleUpload('passport')}
        />
      )}

      {docType === 'huduma_card' && (
        <KycUploadButton
          label="Upload Huduma Card"
          side="huduma"
          document={huduma}
          onUpload={() => handleUpload('huduma')}
        />
      )}

      {/* Alert */}
      <View
        className="rounded-xl p-3 mb-5"
        style={{
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          borderLeftWidth: 3,
          borderLeftColor: '#D97706',
        }}
      >
        <Text className="text-xs leading-5" style={{ color: '#FDBA74' }}>
          Why we need this: SASRA requires all SACCO platform operators to verify member
          identity before processing transactions.
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
    </KeyboardAwareScreen>
  )
}

function KycUploadButton({
  label,
  side,
  document,
  onUpload
}: {
  label: string,
  side: IdSide,
  document: PickedDocument | null,
  onUpload: () => void
}) {
  if (document) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl p-3 mb-2.5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: MINT }}>
        <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: MINT }}>
          <Icon name="check" size={12} color="#fff" />
        </View>
        <View>
          <Text className="text-xs font-semibold" style={{ color: MINT }}>{label}</Text>
          <Text className="text-xs" style={{ color: TEXT_MUTED }}>Ready to upload securely</Text>
        </View>
        <TouchableOpacity onPress={onUpload} className="ml-auto">
          <Text className="text-[10px] text-violet-400 font-bold uppercase">Change</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <TouchableOpacity
      className="border-2 border-dashed rounded-xl p-4 items-center mb-3"
      style={{ borderColor: BORDER_WHITE, backgroundColor: FROSTED_DARK }}
      onPress={onUpload}
    >
      <View className="w-8 h-8 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: FROSTED }}>
        <Icon name="file" size={18} color={TEXT} />
      </View>
      <Text className="text-xs font-semibold mb-0.5" style={{ color: TEXT }}>{label}</Text>
      <Text className="text-xs" style={{ color: TEXT_MUTED }}>JPG or PNG · Max 5MB</Text>
    </TouchableOpacity>
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

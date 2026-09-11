import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScreen } from '../../../components/ui/KeyboardAwareScreen'
import * as ImagePicker from 'expo-image-picker'
import { useRegistrationStore } from '../../../store/useRegistrationStore'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))


import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'

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
  const { colors: c } = useTheme()
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

  const missingReasons = (() => {
    const reasons: string[] = []
    if (idNumber.length < 7) reasons.push(docType === 'passport' ? 'passport number' : 'ID number')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) reasons.push('date of birth (YYYY-MM-DD)')
    if (docType === 'id_card' && (!idFront || !idBack)) reasons.push('both sides of your ID')
    if (docType === 'passport' && !passport) reasons.push('passport bio-page photo')
    if (docType === 'huduma_card' && !huduma) reasons.push('Huduma card photo')
    return reasons
  })()
  const canContinue = missingReasons.length === 0

  if (!step1 || !otpVerified) {
    if (!step1) router.replace('/(auth)/register')
    else router.replace('/(auth)/register/otp')
    return null
  }

  const handleUpload = async (side: IdSide) => {
    try {
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
    } catch (error) {
      console.error('Image picker failed:', error)
      Alert.alert('Error', 'Could not open the photo picker. Please try again.')
    }
  }

  const handleContinue = async () => {
    if (!step1) return

    setLoading(true)
    try {
      setIDInfo(idNumber, dob, docType)

      setKYCDocuments({
        id_front: idFront,
        id_back: idBack,
        passport: passport,
        huduma: huduma,
      })

      router.push('/(auth)/register/link-saccos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAwareScreen
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
            style={{ backgroundColor: i < 3 ? c.accent : c.border }}
          />
        ))}
      </View>
      <Text className="text-xs mb-4" style={{ color: c.textMuted }}>
        Step 3 of 4 — Verify your identity
      </Text>

      <Text className="text-sm font-bold mb-4" style={{ color: c.accent, fontFamily: 'Fraunces_700Bold' }}>
        Saccosphere
      </Text>

      <Text className="text-base font-bold mb-1" style={{ color: c.text }}>ID verification</Text>
      <Text className="text-xs mb-5" style={{ color: c.textMuted, lineHeight: 18 }}>
        Required by SASRA regulations. Your documents are encrypted and never shared.
      </Text>

      {/* Document Type Selector */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>
        Select Document Type
      </Text>
      <View className="flex-row gap-2 mb-4">
        {(['id_card', 'passport', 'huduma_card'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setDocType(type)}
            className="flex-1 py-2 px-1 border rounded-lg items-center justify-center"
            style={{
              borderColor: docType === type ? c.accent : c.border,
              backgroundColor: docType === type ? 'rgba(109, 40, 217, 0.1)' : c.surface
            }}
          >
            <Text
              className="text-[10px] font-bold uppercase text-center"
              style={{ color: docType === type ? c.accent : c.textMuted }}
            >
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ID Number */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>
        {docType === 'passport' ? 'Passport Number' : 'National ID Number'}
      </Text>
      <TextInput
        className="border rounded-xl p-3 text-sm mb-3"
        style={{
          borderColor: c.border,
          color: c.text,
          backgroundColor: c.surface,
        }}
        value={idNumber}
        onChangeText={setIdNumber}
        placeholder={docType === 'passport' ? 'A12345678' : '12345678'}
        autoCapitalize="characters"
        placeholderTextColor={c.textMuted}
      />

      {/* Date of Birth */}
      <Text className="text-xs font-medium mb-1.5" style={{ color: c.textMuted }}>
        Date of Birth (YYYY-MM-DD)
      </Text>
      <TextInput
        className="border rounded-xl p-3 text-sm mb-4"
        style={{
          borderColor: c.border,
          color: c.text,
          backgroundColor: c.surface,
        }}
        value={dob}
        onChangeText={setDob}
        placeholder="1990-01-01"
        placeholderTextColor={c.textMuted}
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
        style={{ backgroundColor: c.accent, opacity: !canContinue ? 0.5 : 1 }}
        onPress={handleContinue}
        disabled={!canContinue || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Continue →</Text>
        )}
      </TouchableOpacity>
      {!canContinue && missingReasons.length > 0 && (
        <Text className="text-xs text-center mt-2" style={{ color: c.textMuted }}>
          Still needed: {missingReasons.join(', ')}
        </Text>
      )}
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
  const { colors: c } = useTheme()
  if (document) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl p-3 mb-2.5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: c.success }}>
        <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: c.success }}>
          <Icon name="check" size={12} color="#fff" />
        </View>
        <View>
          <Text className="text-xs font-semibold" style={{ color: c.success }}>{label}</Text>
          <Text className="text-xs" style={{ color: c.textMuted }}>Ready to upload securely</Text>
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
      style={{ borderColor: c.border, backgroundColor: c.surface }}
      onPress={onUpload}
    >
      <View className="w-8 h-8 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: c.surfaceAlt }}>
        <Icon name="file" size={18} color={c.text} />
      </View>
      <Text className="text-xs font-semibold mb-0.5" style={{ color: c.text }}>{label}</Text>
      <Text className="text-xs" style={{ color: c.textMuted }}>JPG or PNG · Max 5MB</Text>
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

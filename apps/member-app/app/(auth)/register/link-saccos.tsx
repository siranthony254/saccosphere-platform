import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScreen } from '../../../components/ui/KeyboardAwareScreen'
import { api } from '@saccosphere/api-client'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { useSaccos } from '../../../hooks/useSaccos'
import { useIsAuthenticated } from '../../../store/useAuthStore'
import { useLinkMembership } from '../../../hooks/useLinkMembership'
import { useMemberships } from '../../../hooks/useMembership'
import { useRegister, useGoogleAuth } from '../../../hooks/useAuth'
import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const MINT_LIGHT = '#E6F7F1'
const MINT_500 = '#10B981'
const SURFACE = '#FFFFFF'
const SURFACE2 = '#F8FAFC'
const INK = '#111827'
const INK_SOFT = '#374151'
const INK_MUTED = '#6B7280'
const INK_FAINT = '#9CA3AF'
const BORDER = 'rgba(0,0,0,0.08)'
const BORDER_MID = 'rgba(0,0,0,0.13)'

export default function LinkSaccos() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const {
    step1,
    kycDocuments,
    setLinkedSaccos,
    selectedSaccoSlug: selectedSlugFromStore,
    setSelectedSaccoSlug,
    reset: resetRegistrationStore,
  } = useRegistrationStore()
  const [selected, setSelected] = useState<string[]>(
    selectedSlugFromStore ? [selectedSlugFromStore] : []
  )
  const { data: saccos = [], isLoading: saccosLoading } = useSaccos({
    search: search || undefined,
  })
  const { mutateAsync: register, isPending: isRegistering } = useRegister()
  const { mutateAsync: googleAuth, isPending: isGooglePending } = useGoogleAuth()
  const { mutate: linkMembership, isPending: isLinkPending } = useLinkMembership()
  const isAuthenticated = useIsAuthenticated()
  const { data: memberships = [], refetch: refetchMemberships } = useMemberships()

  // Merge already-membership data into results for lookup
  const existingSlugs = useMemo(
    () => new Set(memberships.map((m) => m.sacco_slug)),
    [memberships]
  )

  const toggle = (slug: string) => {
    setSelected((prev) => (prev.includes(slug) ? [] : [slug]))
  }

  const selectedSaccoSlug = selectedSlugFromStore ?? selected[0] ?? null

  const routeAfterRegister = async () => {
    const slug = selectedSaccoSlug
    if (!slug) {
      router.replace('/(member)')
      return
    }

    try {
      const { data: myMemberships } = await refetchMemberships()
      const list = myMemberships || []
      const existingMembership = list.find((m) => m.sacco_slug === slug)
      if (existingMembership) {
        setLinkedSaccos([slug])
        router.replace('/(member)')
      } else {
        router.push(`/(member)/discover/${slug}/apply`)
      }
    } catch {
      router.push('/(auth)/register/success')
    }
  }

  const handleFinish = async () => {
    if (!step1) {
      Alert.alert('Missing information', 'Registration data is missing. Please start again.')
      router.replace('/(auth)/register')
      return
    }

    try {
      // 1. PERFORM REGISTRATION (ONLY AT THIS FINAL STEP)
      if (!isAuthenticated) {
        if (step1.google_id_token) {
          await googleAuth({ id_token: step1.google_id_token, flow: 'signup' })
        } else {
          await register(step1)
        }
      }

      // 2. SUBMIT ID NUMBER (REQUIRED BEFORE DOCUMENT UPLOAD)
      const { idNumber, dateOfBirth } = useRegistrationStore.getState()
      if (idNumber && dateOfBirth) {
        try {
          await api.kyc.submitId({ id_number: idNumber, date_of_birth: dateOfBirth })
        } catch (idErr) {
          console.warn('ID submission failed', idErr)
          // Continue anyway, documents might still work if record exists
        }
      }

      // 3. UPLOAD KYC DOCUMENTS
      if ((kycDocuments as any).front && (kycDocuments as any).back) {
        try {
          await Promise.all([
            api.kyc.uploadDocument({
              document_type: 'id_front',
              file: {
                uri: (kycDocuments as any).front.uri,
                name: (kycDocuments as any).front.name,
                type: (kycDocuments as any).front.type,
              }
            }),
            api.kyc.uploadDocument({
              document_type: 'id_back',
              file: {
                uri: (kycDocuments as any).back.uri,
                name: (kycDocuments as any).back.name,
                type: (kycDocuments as any).back.type,
              }
            }),
          ])
        } catch (kycErr) {
          console.warn('KYC upload failed after registration', kycErr)
          // We don't block completion if KYC upload fails,
          // user can re-upload in settings.
        }
      }

      // 3. PROCEED TO LINK SACCO OR DASHBOARD
      setLinkedSaccos(selected)

      if (selected.length > 0 && selected[0]) {
        linkMembership(
          { sacco_slug: selected[0] },
          {
            onSuccess: () => {
              resetRegistrationStore()
              router.replace('/(member)')
            },
            onError: () => routeAfterRegister(),
          }
        )
      } else {
        await routeAfterRegister()
        resetRegistrationStore()
      }
    } catch (err: any) {
      Alert.alert('Setup failed', err.message || 'Unable to complete account setup.')
    }
  }

  const handleContinueWithoutSacco = async () => {
    if (!step1) {
      router.replace('/(member)')
      return
    }

    try {
      if (!isAuthenticated) {
        if (step1.google_id_token) {
          await googleAuth({ id_token: step1.google_id_token, flow: 'signup' })
        } else {
          await register(step1)
        }
      }

      // Upload KYC even if skipping SACCO link
      if ((kycDocuments as any).front && (kycDocuments as any).back) {
        api.kyc.uploadDocument({
          document_type: 'id_front',
          file: { uri: (kycDocuments as any).front.uri, name: (kycDocuments as any).front.name, type: (kycDocuments as any).front.type }
        }).catch(console.warn)
        api.kyc.uploadDocument({
          document_type: 'id_back',
          file: { uri: (kycDocuments as any).back.uri, name: (kycDocuments as any).back.name, type: (kycDocuments as any).back.type }
        }).catch(console.warn)
      }

      setSelected([])
      setSelectedSaccoSlug(null)
      setLinkedSaccos([])
      resetRegistrationStore()
      router.replace('/(member)')
    } catch (err: any) {
      Alert.alert('Setup failed', err.message || 'Unable to complete account setup.')
    }
  }

  const pending = isLinkPending || isRegistering || isGooglePending

  return (
    <KeyboardAwareScreen
      background={c.bg}
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
            style={{ backgroundColor: i < 4 ? c.accent : c.border }}
          />
        ))}
      </View>
      <Text className="text-xs mb-3" style={{ color: c.textMuted }}>
        Step 4 of 4 — Link your SACCOs
      </Text>

      {/* Brand */}
      <Text
        className="text-sm font-bold mb-4"
        style={{ color: c.accent, fontFamily: 'Fraunces_700Bold' }}
      >
        Saccosphere
      </Text>

      {/* Heading */}
      <Text className="text-base font-bold mb-1" style={{ color: c.text }}>
        Which SACCOs are you a member of?
      </Text>
      <Text className="text-xs mb-4" style={{ color: c.textMuted, lineHeight: 18 }}>
        Select all that apply. You can add more later.
      </Text>

      {/* Search */}
      <View
        className="border rounded-xl p-3 text-sm mb-3"
        style={{ borderColor: c.border, backgroundColor: c.surface }}
      >
        <Text className="text-xs" style={{ color: c.textMuted }}>
          Search {saccos.length} SACCOs...
        </Text>
      </View>
      <TextInput
        className="absolute opacity-0 left-0 right-0"
        style={{ height: 0 }}
        value={search}
        onChangeText={setSearch}
        placeholder="Search SACCOs..."
        placeholderTextColor={c.textMuted}
      />

      {/* SACCO list */}
      {saccosLoading ? (
        <View className="py-8 items-center">
          <Text className="text-xs" style={{ color: c.textMuted }}>
            Loading SACCOs...
          </Text>
        </View>
      ) : (
        saccos.map((sacco) => {
          const isSelected = selected.includes(sacco.slug)
          const isAlreadyLinked = existingSlugs.has(sacco.slug)
          return (
            <TouchableOpacity
              key={sacco.id}
              className="flex-row items-center p-3 rounded-xl mb-2"
              style={{
                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : c.surface,
                borderWidth: isSelected ? 1.5 : 1,
                borderColor: isSelected ? c.success : c.border,
                opacity: isAlreadyLinked ? 0.6 : 1,
              }}
              onPress={() => toggle(sacco.slug)}
              disabled={isAlreadyLinked}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: sacco.color || c.accent }}
              >
                <Text className="text-white text-xs font-bold">
                  {sacco.initials || 'SA'}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-xs font-semibold" style={{ color: c.text }}>{sacco.name}</Text>
                <Text className="text-xs mt-0.5" style={{ color: c.textMuted }}>
                  {sacco.sector}
                  {isAlreadyLinked ? ' · Already linked' : ''}
                </Text>
              </View>
              {isSelected && (
                <Icon name="check" size={16} color={c.success} />
              )}
              {!isSelected && (
                <View
                  className="w-4 h-4 rounded-full"
                  style={{
                    borderWidth: 2,
                    borderColor: c.border,
                  }}
                />
              )}
            </TouchableOpacity>
          )
        })
      )}

      {/* Finish */}
      <TouchableOpacity
        className="rounded-xl py-3.5 items-center mb-2"
        style={{ backgroundColor: c.accent, opacity: pending || !step1 ? 0.6 : 1 }}
        onPress={handleFinish}
        disabled={pending || !step1}
      >
        {pending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-xs font-semibold">Finish setup →</Text>
        )}
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity
        onPress={handleContinueWithoutSacco}
        className="rounded-xl py-3 border items-center mb-3"
        style={{
          borderColor: c.border,
          backgroundColor: c.surface,
        }}
        disabled={pending || !step1}
      >
        <Text className="text-xs font-semibold" style={{ color: c.text }}>
          Not in a SACCO yet? Browse & join
        </Text>
        <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
          Your account will work without a linked SACCO
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScreen>
  )
}

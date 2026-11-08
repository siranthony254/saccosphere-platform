import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

// Two entry points into one screen, both reached by a shared link (same
// reasoning as the other governance screens — no member-readable list of
// delegates or open petitions exists):
//  - `delegateId` only: start a new recall petition against that delegate.
//  - `recallMotionId`: add your signature to a petition someone already
//    started (the initiator shares this id with their zone to gather
//    signatures toward the threshold).
export default function DelegateRecall() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { delegateId, recallMotionId, delegateName, zoneName } = useLocalSearchParams<{
    delegateId?: string
    recallMotionId?: string
    delegateName?: string
    zoneName?: string
  }>()

  const [createdMotion, setCreatedMotion] = useState<{ id: string; signature_count: number; signature_fraction: number; threshold_fraction_snapshot: number } | null>(null)
  const [signed, setSigned] = useState<{ signature_count: number; signature_fraction: number; threshold_fraction_snapshot: number } | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const startPetition = useMutation({
    mutationFn: () => api.governance.createRecallMotion(delegateId || '', { reason: 'Member-initiated recall petition' }),
    onSuccess: (motion: any) => {
      setErrorText(null)
      setCreatedMotion(motion)
    },
    onError: (error: Error) => setErrorText(error.message),
  })

  const signPetition = useMutation({
    mutationFn: () => api.governance.signRecallMotion(recallMotionId || ''),
    onSuccess: (motion: any) => {
      setErrorText(null)
      setSigned(motion)
    },
    onError: (error: Error) => {
      if (/already signed/i.test(error.message)) {
        setErrorText(null)
        setSigned(null)
        return
      }
      setErrorText(error.message)
    },
  })

  const handleCopyMotionId = async (id: string) => {
    await Clipboard.setStringAsync(id)
  }

  const renderProgress = (data: { signature_count: number; signature_fraction: number; threshold_fraction_snapshot: number }) => (
    <View style={{ backgroundColor: c.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.border, marginTop: 12 }}>
      <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Signatures so far</Text>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
        {Math.round(data.signature_fraction * 100)}%{' '}
        <Text style={{ fontSize: 11, fontWeight: '500', color: c.textMuted }}>({data.signature_count} signed, needs {Math.round(data.threshold_fraction_snapshot * 100)}%)</Text>
      </Text>
    </View>
  )

  if (!delegateId && !recallMotionId) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Link</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Open this screen from a delegate recall link you were sent.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Delegate Recall</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 20 }}>
          {delegateName ? `${delegateName}${zoneName ? ` — ${zoneName} zone` : ''}` : 'Only members in the delegate\'s own zone can start or sign a recall.'}
        </Text>
      </View>

      {recallMotionId ? (
        signed ? (
          <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: c.success, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Icon name="success" size={24} color={c.success} />
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: 8 }}>Your signature has been recorded</Text>
            {renderProgress(signed)}
          </View>
        ) : (
          <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Sign This Petition</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              Signing adds your name toward the threshold needed to force a recall vote on this delegate.
            </Text>
            <TouchableOpacity
              style={{ borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.accent, opacity: signPetition.isPending ? 0.6 : 1 }}
              onPress={() => signPetition.mutate()}
              disabled={signPetition.isPending}
            >
              {signPetition.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Add My Signature</Text>}
            </TouchableOpacity>
            {!!errorText && <Text style={{ color: c.danger, fontSize: 12, textAlign: 'center', marginTop: 12 }}>{errorText}</Text>}
          </View>
        )
      ) : createdMotion ? (
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="success" size={16} color={c.success} />
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>Petition started</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
            Share this with other members in the same zone so they can add their signature.
          </Text>
          <TouchableOpacity
            onPress={() => handleCopyMotionId(createdMotion.id)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12 }}
          >
            <Text style={{ color: c.text, fontSize: 11, fontFamily: 'monospace', flex: 1 }} numberOfLines={1}>{createdMotion.id}</Text>
            <Icon name="link" size={14} color={c.accent} />
          </TouchableOpacity>
          {renderProgress(createdMotion)}
        </View>
      ) : (
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>Start a Recall Petition</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
            This opens a petition against this delegate. If enough of their zone signs it within the threshold, it moves to a recall vote.
          </Text>
          <TouchableOpacity
            style={{ borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.danger, opacity: startPetition.isPending ? 0.6 : 1 }}
            onPress={() => startPetition.mutate()}
            disabled={startPetition.isPending}
          >
            {startPetition.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Start Recall Petition</Text>}
          </TouchableOpacity>
          {!!errorText && <Text style={{ color: c.danger, fontSize: 12, textAlign: 'center', marginTop: 12 }}>{errorText}</Text>}
        </View>
      )}
    </ScrollView>
  )
}

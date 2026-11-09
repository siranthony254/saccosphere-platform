import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const MEETING_TYPE_LABELS: Record<string, string> = {
  AGM: 'Annual General Meeting',
  SGM: 'Special General Meeting',
  ADM: 'Annual Delegates Meeting',
}

// Reached by a shared link (SMS/WhatsApp/poster QR) carrying the meeting's
// id and a few display-only details, the same deep-link pattern as
// guarantor-request.tsx — the backend has no member-readable meeting list,
// only this self-service check-in action by id.
export default function MeetingCheckIn() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { meetingId, title, meetingType, venue } = useLocalSearchParams<{
    meetingId?: string
    title?: string
    meetingType?: string
    venue?: string
  }>()
  const [checkedIn, setCheckedIn] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const checkIn = useMutation({
    mutationFn: () => api.governance.checkIn(meetingId || ''),
    onSuccess: () => {
      setErrorText(null)
      setCheckedIn(true)
    },
    onError: (error: Error) => {
      // "already checked in" isn't really a failure from the member's
      // point of view — treat it the same as a fresh success.
      if (/already checked in/i.test(error.message)) {
        setCheckedIn(true)
        return
      }
      setErrorText(error.message)
    },
  })

  if (!meetingId) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Link</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Open this screen from the meeting notice link you were sent.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Meeting Check-In</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 20 }}>
          Confirm your attendance so this meeting counts toward quorum.
        </Text>
      </View>

      <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="calendar" size={16} color={c.accent} />
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{title || (meetingType && MEETING_TYPE_LABELS[meetingType]) || 'SACCO Meeting'}</Text>
        </View>
        {!!meetingType && (
          <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 4 }}>{MEETING_TYPE_LABELS[meetingType] || meetingType}</Text>
        )}
        {!!venue && <Text style={{ color: c.textMuted, fontSize: 12 }}>{venue}</Text>}
      </View>

      {checkedIn ? (
        <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: c.success, borderRadius: 12, padding: 16, alignItems: 'center' }}>
          <Icon name="success" size={28} color={c.success} />
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 4 }}>You're checked in</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center' }}>Your attendance has been recorded for this meeting.</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: c.accent, opacity: checkIn.isPending ? 0.6 : 1 }}
            onPress={() => checkIn.mutate()}
            disabled={checkIn.isPending}
          >
            {checkIn.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>Check In Now</Text>}
          </TouchableOpacity>
          {!!errorText && (
            <Text style={{ color: c.danger, fontSize: 12, textAlign: 'center', marginTop: 12 }}>{errorText}</Text>
          )}
        </>
      )}
    </ScrollView>
  )
}

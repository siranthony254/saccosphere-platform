import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { useTheme } from '../../theme/ThemeProvider'

export default function CreditScoreScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()

  // There is no member-facing "view my score" endpoint — a SACCO officer
  // computes it, and a member can only request an explanation for a score
  // they already know the reference for (e.g. from a SACCO notification).
  const [scoreId, setScoreId] = useState('')
  const [statement, setStatement] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const requestMutation = useMutation({
    mutationFn: () => api.creditbureau.requestCreditScoreExplanation(scoreId, statement || undefined),
    onSuccess: () => {
      setSubmitted(true)
      setStatement('')
    },
    onError: (err: any) => {
      if (err?.status === 404) {
        Alert.alert('Score not found', "We couldn't find a score with that reference for your account.")
        return
      }
      Alert.alert('Could not submit', err?.message || 'Please try again.')
    },
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Credit Score Explanation</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Ask your SACCO to explain or review a credit score it computed for you. Use the reference it shared with you — usually in a notification or a decision letter.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {submitted ? (
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16, gap: 8 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Request submitted</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              Your SACCO will review it and notify you once resolved. If you already had one open for this score, this returned that same request rather than creating a new one.
            </Text>
            <TouchableOpacity onPress={() => setSubmitted(false)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Submit another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Score reference</Text>
              <TextInput
                value={scoreId}
                onChangeText={setScoreId}
                autoCapitalize="none"
                placeholder="e.g. the ID from your SACCO's notification"
                placeholderTextColor={c.textMuted}
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13 }}
              />
            </View>
            <View>
              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>Your statement (optional)</Text>
              <TextInput
                value={statement}
                onChangeText={setStatement}
                multiline
                numberOfLines={5}
                placeholder="Explain what you think may be wrong, or ask a question..."
                placeholderTextColor={c.textMuted}
                style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text, fontSize: 13, minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
            <TouchableOpacity
              disabled={!scoreId || requestMutation.isPending}
              onPress={() => requestMutation.mutate()}
              style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: !scoreId ? 0.5 : 1 }}
            >
              {requestMutation.isPending ? <ActivityIndicator color={c.onAccent} /> : <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

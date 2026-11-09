import { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { Skeleton } from '../../components/ui/Skeleton'
import { useTheme } from '../../theme/ThemeProvider'

type Bubble = { id: string; role: 'USER' | 'ASSISTANT'; content: string; pending?: boolean }

const SUGGESTIONS = [
  "What's a BOSA account?",
  'How do dividends work?',
  "What's my loan balance?",
]

// General how-to/FAQ answers, plus questions about the member's own
// account using only the figures the backend hands it — it can't take
// any action (payments, applications, approvals), only answer questions.
export default function AssistantScreen() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Bubble[]>([])
  const [input, setInput] = useState('')
  const [disabledReason, setDisabledReason] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const { data: conversations, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: () => api.assistant.getConversations(),
  })

  const { data: history, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['assistant-messages', conversationId],
    queryFn: () => api.assistant.getMessages(conversationId as string),
    enabled: !!conversationId,
  })

  // Resume the most recent conversation on first load, if one exists.
  useEffect(() => {
    if (conversationId === null && conversations && conversations.length > 0) {
      setConversationId(conversations[0].id)
    }
  }, [conversations, conversationId])

  useEffect(() => {
    if (history) {
      setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content })))
    }
  }, [history])

  const send = useMutation({
    mutationFn: (text: string) => api.assistant.sendMessage(text, conversationId ?? undefined),
    onSuccess: (result, text) => {
      setConversationId(result.conversation_id)
      setMessages((prev) => [
        ...prev.filter((m) => !m.pending),
        { id: `${Date.now()}-reply`, role: 'ASSISTANT', content: result.reply },
      ])
    },
    onError: (error: any) => {
      setMessages((prev) => prev.filter((m) => !m.pending))
      if (error?.code === 'NO_APPROVED_MEMBERSHIP') {
        setDisabledReason("You'll need an active SACCO membership before you can chat with the assistant.")
      } else if (error?.code === 'ASSISTANT_DISABLED') {
        setDisabledReason("Your SACCO hasn't turned the assistant on yet.")
      } else if (error?.code === 'ASSISTANT_UNAVAILABLE') {
        setMessages((prev) => [...prev, { id: `${Date.now()}-err`, role: 'ASSISTANT', content: "I'm having trouble replying right now — please try again in a moment." }])
      } else {
        setMessages((prev) => [...prev, { id: `${Date.now()}-err`, role: 'ASSISTANT', content: error?.message || 'Something went wrong. Please try again.' }])
      }
    },
  })

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim()
    if (!value || send.isPending) return
    setInput('')
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'USER', content: value }, { id: 'pending', role: 'ASSISTANT', content: '', pending: true }])
    send.mutate(value)
  }

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={14} color={c.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>SACCO Assistant</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Answers questions — can't make payments or changes for you</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              onPress={() => { setConversationId(null); setMessages([]); setDisabledReason(null) }}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="plus" size={16} color={c.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}>
          {isHistoryLoading || isMessagesLoading ? (
            <View style={{ gap: 10 }}>
              <Skeleton height={44} borderRadius={14} />
              <Skeleton height={64} borderRadius={14} />
            </View>
          ) : disabledReason ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 }}>
              <Icon name="info" size={28} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>{disabledReason}</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bulb" size={26} color="#fff" />
              </View>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Ask me anything about your SACCO</Text>
              <View style={{ gap: 8, width: '100%' }}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity key={s} onPress={() => handleSend(s)} style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12 }}>
                    <Text style={{ color: c.text, fontSize: 12 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => (
              <View key={m.id} style={{ alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <View
                  style={{
                    backgroundColor: m.role === 'USER' ? c.accent : c.surface,
                    borderWidth: m.role === 'USER' ? 0 : 1,
                    borderColor: c.border,
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  {m.pending ? (
                    <ActivityIndicator color={c.textMuted} size="small" />
                  ) : (
                    <Text style={{ color: m.role === 'USER' ? '#fff' : c.text, fontSize: 13, lineHeight: 19 }}>{m.content}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {!disabledReason && (
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 0.5, borderTopColor: c.border, paddingBottom: insets.bottom + 12 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question..."
              placeholderTextColor={c.textFaint}
              multiline
              style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: c.text, fontSize: 13, maxHeight: 100 }}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!input.trim() || send.isPending}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', opacity: input.trim() && !send.isPending ? 1 : 0.5 }}
            >
              <Icon name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

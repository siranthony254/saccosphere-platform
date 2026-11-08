import { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'
import { useMemberships } from '../../../hooks/useMembership'
import { getActiveMemberships } from '../../../lib/membership'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

const ELECTION_TYPE_LABELS: Record<string, string> = {
  BOARD: 'Board of Directors Election',
  SUPERVISORY_COMMITTEE: 'Supervisory Committee Election',
  DELEGATE: 'Zone Delegate Election',
  RECALL_VOTE: 'Delegate Recall Vote',
}

type Candidate = { id: string; name: string }

// Reached by a shared link, same reasoning as meeting-checkin.tsx — the
// backend has no member-readable election/candidate list, so whoever
// announces the election (admin, SMS, poster QR) passes the election id
// and, once candidates are finalized, their id+name pairs as a `candidates`
// param. This screen covers all three self-service actions a member can
// take by id alone: nominate, vote, and view certified results.
export default function ElectionHub() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const params = useLocalSearchParams<{
    electionId?: string
    title?: string
    electionType?: string
    seatsAvailable?: string
    saccoSlug?: string
    candidates?: string
  }>()
  const { electionId, title, electionType, saccoSlug } = params
  const seatsAvailable = Math.max(1, Number(params.seatsAvailable) || 1)

  const candidates: Candidate[] = useMemo(() => {
    if (!params.candidates) return []
    try {
      const parsed = JSON.parse(params.candidates)
      return Array.isArray(parsed) ? parsed.filter((it) => it && it.id && it.name) : []
    } catch {
      return []
    }
  }, [params.candidates])

  const { data: memberships = [] } = useMemberships()
  const ownMembershipId = useMemo(() => {
    if (!saccoSlug) return null
    return getActiveMemberships(memberships).find((m) => m.sacco_slug === saccoSlug)?.id ?? null
  }, [memberships, saccoSlug])

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])
  const [nominated, setNominated] = useState(false)
  const [voted, setVoted] = useState(false)

  const resultsQuery = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: () => api.governance.getElectionResults(electionId || ''),
    enabled: !!electionId,
    retry: false,
  })
  // Results aren't certified yet — not an error worth showing, just an
  // empty section.
  const resultsAvailable = resultsQuery.isSuccess && Array.isArray(resultsQuery.data) && resultsQuery.data.length > 0

  const nominate = useMutation({
    mutationFn: () => api.governance.nominateCandidate(electionId || '', { membership_id: ownMembershipId || '' }),
    onSuccess: () => setNominated(true),
    onError: (error: Error) => {
      if (/already been nominated/i.test(error.message)) {
        setNominated(true)
        return
      }
      Alert.alert('Could not nominate you', error.message)
    },
  })

  const castVote = useMutation({
    mutationFn: () => api.governance.castVote(electionId || '', { option_codes: selectedCandidateIds }),
    onSuccess: () => setVoted(true),
    onError: (error: Error) => Alert.alert('Could not record your vote', error.message),
  })

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (seatsAvailable === 1) return [id]
      if (prev.length >= seatsAvailable) {
        Alert.alert('Seat limit reached', `You can select up to ${seatsAvailable} candidate${seatsAvailable > 1 ? 's' : ''}.`)
        return prev
      }
      return [...prev, id]
    })
  }

  const candidateNameFor = (code: string) => candidates.find((cand) => cand.id === code)?.name ?? code

  if (!electionId) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Invalid Link</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
            Open this screen from the election link you were sent.
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }} style={{ backgroundColor: c.bg }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
          {title || (electionType && ELECTION_TYPE_LABELS[electionType]) || 'SACCO Election'}
        </Text>
        {!!electionType && <Text style={{ color: c.textMuted, fontSize: 12 }}>{ELECTION_TYPE_LABELS[electionType] || electionType}</Text>}
      </View>

      {/* Nominate */}
      <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Stand as a Candidate</Text>
        {nominated ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="success" size={16} color={c.success} />
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>You're nominated. Watch for a vetting update.</Text>
          </View>
        ) : (
          <>
            <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              If nominations are open and you're eligible, you can put yourself forward.
            </Text>
            <TouchableOpacity
              style={{ borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.accent, opacity: nominate.isPending ? 0.6 : 1 }}
              onPress={() => nominate.mutate()}
              disabled={nominate.isPending}
            >
              {nominate.isPending ? <ActivityIndicator color={c.accent} /> : <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>Nominate Myself</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Vote */}
      {candidates.length > 0 && (
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Cast Your Secret Ballot {seatsAvailable > 1 ? `(choose up to ${seatsAvailable})` : ''}
          </Text>
          {voted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="success" size={16} color={c.success} />
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Your vote has been recorded. Thank you.</Text>
            </View>
          ) : (
            <>
              <View style={{ gap: 8, marginBottom: 14 }}>
                {candidates.map((cand) => {
                  const selected = selectedCandidateIds.includes(cand.id)
                  return (
                    <TouchableOpacity
                      key={cand.id}
                      onPress={() => toggleCandidate(cand.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: selected ? c.accent : c.border, backgroundColor: selected ? 'rgba(109,40,217,0.08)' : c.surface }}
                    >
                      <View style={{ width: 20, height: 20, borderRadius: seatsAvailable === 1 ? 10 : 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.accent : 'transparent', borderColor: selected ? c.accent : c.textFaint }}>
                        {selected && <Icon name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{cand.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              <TouchableOpacity
                style={{ borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: c.accent, opacity: selectedCandidateIds.length > 0 && !castVote.isPending ? 1 : 0.4 }}
                onPress={() => castVote.mutate()}
                disabled={selectedCandidateIds.length === 0 || castVote.isPending}
              >
                {castVote.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Submit Vote</Text>}
              </TouchableOpacity>
              <Text style={{ color: c.textFaint, fontSize: 10, textAlign: 'center', marginTop: 10, lineHeight: 15 }}>
                Your ballot is anonymous — there's no record anywhere linking you to your choice.
              </Text>
            </>
          )}
        </View>
      )}

      {/* Results */}
      {resultsAvailable && (
        <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Certified Results</Text>
          <View style={{ gap: 8 }}>
            {resultsQuery.data
              .slice()
              .sort((a: any, b: any) => b.votes_count - a.votes_count)
              .map((row: any) => (
                <View key={row.option_code} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {row.is_elected && <Icon name="success" size={14} color={c.success} />}
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: row.is_elected ? '700' : '500' }}>{candidateNameFor(row.option_code)}</Text>
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>{row.votes_count} vote{row.votes_count === 1 ? '' : 's'}</Text>
                </View>
              ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

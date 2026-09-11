import { View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRegistrationStore } from '../../../store/useRegistrationStore'
import { useMemberships } from '../../../hooks/useMembership'
import { Icon } from '../../../components/ui/Icon'
import { useTheme } from '../../../theme/ThemeProvider'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PADDING_H = Math.max(16, Math.min(24, SCREEN_WIDTH * 0.05))

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export default function RegistrationSuccessScreen() {
  const { linkedSaccoSlugs } = useRegistrationStore()
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { data: memberships, isLoading } = useMemberships()

  const handleDashboard = () => {
    router.replace('/(member)')
  }

  const linkedMemberships = (memberships ?? []).filter((m) => linkedSaccoSlugs?.includes(m.sacco_slug))
  const saccoCount = linkedSaccoSlugs?.length ?? 0

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20, alignItems: 'center' }}
      style={{ backgroundColor: c.bg }}
    >
      {/* Success Ring */}
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="check" size={18} color="#ffffff" />
        </View>
      </View>

      {/* Description */}
      <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
        Your Saccosphere account is live. {saccoCount} SACCO{saccoCount !== 1 ? 's' : ''} linked. You can now manage everything in one place.
      </Text>

      {/* Linked SACCOs Summary */}
      {saccoCount > 0 && (
        <View style={{ width: '100%', backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginBottom: 12 }}>Linked SACCOs</Text>

          {isLoading ? (
            <ActivityIndicator color={c.accent} style={{ marginVertical: 8 }} />
          ) : (
            linkedSaccoSlugs?.map((slug: string) => {
              const membership = linkedMemberships.find((m) => m.sacco_slug === slug)
              return (
                <View key={slug} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
                  <View
                    style={{ width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: membership?.sacco_color || c.accent }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {membership ? initialsFor(membership.sacco_name) : '?'}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, color: c.text, fontSize: 12, fontWeight: '500' }}>{membership?.sacco_name || 'SACCO'}</Text>
                  <Icon name="check" size={16} color="#10b981" />
                </View>
              )
            })
          )}

          <TouchableOpacity style={{ marginTop: 8 }} onPress={() => router.replace('/(member)/discover')}>
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Add more SACCOs later →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {saccoCount === 0 && (
        <View style={{ width: '100%', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 16, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ color: c.text, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>No SACCOs linked yet</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
            You can add SACCOs anytime from your dashboard, or search our SACCO directory.
          </Text>
        </View>
      )}

      {/* CTA Button */}
      <TouchableOpacity style={{ width: '100%', backgroundColor: c.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} onPress={handleDashboard}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Go to dashboard →</Text>
      </TouchableOpacity>

      {/* Spacer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

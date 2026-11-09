import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@saccosphere/api-client'
import { Icon } from '../../components/ui/Icon'
import { Skeleton } from '../../components/ui/Skeleton'
import { useTheme } from '../../theme/ThemeProvider'

type ClaimGuidance = { summary: string; steps: string[]; note: string }

// Public, static informational content (AllowAny on the backend) — no
// money moves through this app for a surrendered deposit; it explains how
// a member claims it directly from UFAA.
export default function UfaaGuidanceScreen() {
  const insets = useSafeAreaInsets()
  const { colors: c } = useTheme()
  const { data, isLoading } = useQuery({
    queryKey: ['ufaa-claim-guidance'],
    queryFn: () => api.ufaa.getClaimGuidance() as Promise<ClaimGuidance>,
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrow-right" size={14} color={c.text} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Unclaimed Funds (UFAA)</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Claiming money surrendered to the Unclaimed Financial Assets Authority</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 14 }}>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <Skeleton height={60} borderRadius={12} />
            <Skeleton height={160} borderRadius={12} />
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 14 }}>
              <Text style={{ color: c.text, fontSize: 12, lineHeight: 18 }}>{data?.summary}</Text>
            </View>

            <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16 }}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>How to claim</Text>
              <View style={{ gap: 12 }}>
                {data?.steps.map((step, index) => (
                  <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{index + 1}</Text>
                    </View>
                    <Text style={{ color: c.text, fontSize: 12, lineHeight: 18, flex: 1 }}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            {!!data?.note && (
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 14 }}>
                <Icon name="info" size={16} color={c.warning} />
                <Text style={{ color: c.text, fontSize: 11, lineHeight: 17, flex: 1 }}>{data.note}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

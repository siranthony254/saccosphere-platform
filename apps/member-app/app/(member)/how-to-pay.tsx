import * as Clipboard from 'expo-clipboard'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useHowToPay } from '../../hooks/useMembership'
import { useTheme } from '../../theme/ThemeProvider'

export default function HowToPayScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { data: rows = [], isLoading, isRefetching, refetch } = useHowToPay()

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value)
    Alert.alert('Copied', `${label}: ${value}`)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>How to pay via paybill</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Pay directly from the M-Pesa menu on your phone — no need to open the app.
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
        >
          {rows.length === 0 ? (
            <Text style={{ color: c.textMuted, fontSize: 13 }}>No SACCO memberships found.</Text>
          ) : (
            rows.map((row) => (
              <View key={row.sacco_id} style={{ borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 16 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>{row.sacco_name}</Text>

                {row.shortcode ? (
                  <>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <InfoBlock label="Paybill" value={row.shortcode} onCopy={() => copy(row.shortcode!, 'Paybill')} />
                      {row.short_number != null ? (
                        <InfoBlock label="Account no." value={String(row.short_number)} onCopy={() => copy(String(row.short_number), 'Account number')} />
                      ) : null}
                    </View>

                    {row.aliases.length > 0 ? (
                      <View style={{ gap: 8, marginBottom: 12 }}>
                        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                          Or pay a specific account
                        </Text>
                        {row.aliases.map((alias: { alias: string; target_type: string; label: string }) => (
                          <TouchableOpacity
                            key={alias.alias}
                            onPress={() => copy(alias.alias, alias.label)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}
                          >
                            <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{alias.label}</Text>
                            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>{alias.alias}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : null}

                <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>{row.instructions}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function InfoBlock({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  const { colors: c } = useTheme()
  return (
    <TouchableOpacity onPress={onCopy} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color: c.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
    </TouchableOpacity>
  )
}

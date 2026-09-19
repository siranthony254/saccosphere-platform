import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTheme } from '../../theme/ThemeProvider'
import { ThemePicker } from '../../components/ui/ThemePicker'
import { CardBackgroundSettings } from '../../components/ui/CardBackgroundSettings'
import { Coachmark } from '../../components/ui/Coachmark'

export default function AppearanceScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Theme
        </Text>
        <View style={{ backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 20 }}>
          <View style={{ padding: 14, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>App theme</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 12 }}>
              Pick an appearance, or follow your device&apos;s light / dark setting.
            </Text>
            <ThemePicker />
          </View>

          <View style={{ padding: 14, position: 'relative' }}>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>Card backgrounds</Text>
            <Text style={{ color: c.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 12 }}>
              Set a nature photo behind your Profile Details, Balances, and SACCO Profile cards.
            </Text>
            <CardBackgroundSettings />
            <Coachmark id="cardBackdrop" text="New: set a photo background for your cards here" style={{ top: 2, right: 0 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

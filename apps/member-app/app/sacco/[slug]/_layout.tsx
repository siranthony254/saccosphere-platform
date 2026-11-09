import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'

// This whole subtree (SACCO detail, statement, pay, compare, loan
// application flow, membership actions) had no safe-area handling at
// all - it rode on the root Stack with nothing but SafeAreaProvider's
// context, so content could render under the status bar/notch or the
// home indicator. Matches the wrapping pattern already used by the
// (member) tab group's own _layout.tsx.
export default function SaccoSlugLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </SafeAreaView>
  )
}

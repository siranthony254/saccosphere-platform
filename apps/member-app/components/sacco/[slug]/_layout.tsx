import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'

export default function SaccoStackLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerTintColor: '#0d7a4e',
        }}
      />
    </SafeAreaView>
  )
}

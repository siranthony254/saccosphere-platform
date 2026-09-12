import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTheme } from '../../../theme/ThemeProvider'

export default function SaccoStackLayout() {
  const { colors: c } = useTheme()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      <Stack
        screenOptions={{
          // Every screen under this stack (compare, pay, disbursed, loans/*,
          // etc.) builds its own custom back-button header in JSX — none of
          // them opt out of the native header, so without this every one of
          // them showed both: this navigator's native header AND its own.
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          // Unifies the step-forward feel across iOS/Android for this whole
          // subtree, most visibly the loan-application wizard's steps.
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  )
}

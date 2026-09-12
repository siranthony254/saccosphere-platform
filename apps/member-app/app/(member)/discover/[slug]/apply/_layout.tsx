import { Stack } from 'expo-router'

export default function ApplyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        // Unifies the step-forward feel across iOS/Android (which otherwise
        // default to slide vs. fade respectively) for this wizard.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="review" />
      <Stack.Screen name="success" />
    </Stack>
  )
}

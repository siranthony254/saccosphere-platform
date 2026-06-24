import { Stack } from 'expo-router'

export default function ApplyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="review" />
      <Stack.Screen name="success" />
    </Stack>
  )
}

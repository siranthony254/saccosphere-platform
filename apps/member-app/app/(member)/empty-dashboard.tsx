import { Redirect } from 'expo-router'

export default function LegacyEmptyDashboard() {
  return <Redirect href="/(member)" />
}

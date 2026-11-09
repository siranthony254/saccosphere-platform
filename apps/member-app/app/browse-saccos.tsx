import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SaccoBrowseList } from '../components/discover/SaccoBrowseList'

// Reached from outside the (member) tab group (its own _layout.tsx already
// wraps every screen in a SafeAreaView), so this top-level route needs its
// own - otherwise content renders under the status bar/notch.
export default function BrowseSaccos() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      <SaccoBrowseList
        title="Discover SACCOs"
        subtitle="Tap a SACCO to start your application."
        onSelectSacco={(sacco) => router.push(`/sacco/${sacco.slug}`)}
      />
    </SafeAreaView>
  )
}

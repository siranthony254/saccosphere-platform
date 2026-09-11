import { router } from 'expo-router'
import { SaccoBrowseList } from '../components/discover/SaccoBrowseList'

export default function BrowseSaccos() {
  return (
    <SaccoBrowseList
      title="Discover SACCOs"
      subtitle="Tap a SACCO to start your application."
      onSelectSacco={(sacco) => router.push(`/sacco/${sacco.slug}`)}
    />
  )
}

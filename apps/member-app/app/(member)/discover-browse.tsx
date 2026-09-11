import { router } from 'expo-router'
import { useRegistrationStore } from '../../store/useRegistrationStore'
import { SaccoBrowseList } from '../../components/discover/SaccoBrowseList'

export default function DiscoverBrowse() {
  const { setSelectedSaccoSlug } = useRegistrationStore()

  return (
    <SaccoBrowseList
      title="Find a SACCO"
      subtitle="Tap a SACCO to continue to account creation."
      onSelectSacco={(sacco) => {
        setSelectedSaccoSlug(sacco.slug)
        router.push('/(auth)/register')
      }}
    />
  )
}

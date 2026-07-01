import SaccoDetailScreen from '../../dashboard/SaccoDetailScreen'
import SaccoProfileScreen from '../../discover/SaccoProfileScreen'
import { useLocalSearchParams } from 'expo-router'

export default function SaccoDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  // If user is not a member of this SACCO, show profile screen for application
  // If user is a member, show detail screen
  // For now, show profile screen for all non-member contexts
  return <SaccoProfileScreen />
}

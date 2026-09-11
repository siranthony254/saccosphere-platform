import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import SaccoDetailScreen from '../../dashboard/SaccoDetailScreen'
import SaccoProfileScreen from '../../discover/SaccoProfileScreen'
import { DeepSpaceBackground } from '../../DeepSpaceBackground'
import { useMembershipBySacco } from '../../../hooks/useMembership'
import { useIsAuthenticated } from '../../../store/useAuthStore'
import { isActiveMembership } from '../../../lib/membership'

export default function SaccoDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const isAuthenticated = useIsAuthenticated()
  const { data: membership, isLoading } = useMembershipBySacco(slug)

  // Only an active member of this SACCO sees its dashboard; everyone else
  // (signed-out visitors, or signed-in members who haven't joined this one)
  // sees the browse/apply screen instead.
  if (isAuthenticated && isLoading) {
    return (
      <DeepSpaceBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6D28D9" />
        </View>
      </DeepSpaceBackground>
    )
  }

  if (isAuthenticated && membership && isActiveMembership(membership)) {
    return <SaccoDetailScreen />
  }

  return <SaccoProfileScreen />
}

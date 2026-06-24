/**
 * Screen 23 — Member profile & settings
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { api } from '@saccosphere/api-client'

export default function ProfileScreen() {
  const user = useCurrentUser()
  const { mutate: logout } = useLogout()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'JK'

  const handleDownloadStatements = async () => {
    try {
      // Download statements for all active SACCOs
      for (const membership of activeMemberships) {
        const { blob, filename } = await api.ledger.downloadStatementPdf({
          sacco_id: membership.sacco_id,
          from_date: '2024-01-01', // Default to current year
          to_date: new Date().toISOString().split('T')[0],
        })
        // Handle blob download - this would need platform-specific implementation
        console.log(`Downloaded ${filename} for ${membership.sacco_name}`)
      }
    } catch (error) {
      console.error('Failed to download statements:', error)
    }
  }

  const settings = [
    { icon: '📱', label: 'M-Pesa number', value: user?.phone ?? '+254 712 ···', action: () => {} },
    { icon: '🏦', label: 'Linked bank account', value: 'None', action: () => {} },
    { icon: '👆', label: 'Biometric login', toggle: true, action: () => console.log('Biometric - backend endpoint to be implemented') },
    { icon: '🔔', label: 'Push notifications', toggle: true, action: () => {} },
    { icon: '🔒', label: 'Change password', action: () => router.push('/(auth)/forgot-password') },
    { icon: '📄', label: 'Download all statements', action: handleDownloadStatements },
  ]

  return (
    <ScrollView className="bg-surface2">
      <View className="pt-13 px-4 pb-3 bg-surface border-b border-border">
        <Text className="text-ink text-xl font-bold">Profile</Text>
      </View>

      {/* Avatar + info */}
      <View className="items-center py-6 bg-surface border-b border-border">
        <View className="w-18 h-18 rounded-2xl bg-violet-500 items-center justify-center mb-2.5">
          <Text className="text-white text-2xl font-bold">{initials}</Text>
        </View>
        <Text className="text-ink text-base font-semibold mb-0.5">{user?.first_name} {user?.last_name}</Text>
        <Text className="text-ink-faint text-xs mb-2.5">SS-2024-00891 · Member since Apr 2024</Text>
        <View className={`px-3 py-1 rounded-full ${user?.kyc_status === 'verified' ? 'bg-mint-50' : 'bg-amber-50'}`}>
          <Text className={`text-xs font-semibold ${user?.kyc_status === 'verified' ? 'text-mint-700' : 'text-amber-700'}`}>
            {user?.kyc_status === 'verified' ? '✓ KYC Verified' : '⏳ KYC Pending'}
          </Text>
        </View>
      </View>

      {/* SACCO memberships summary */}
      <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-4 border border-border">
        <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-3">MY SACCOS</Text>
        {activeMemberships.length > 0 ? (
          activeMemberships.map((membership) => (
            <View key={membership.id} className="flex-row justify-between items-center py-2 border-b border-border last:border-b-0">
              <Text className="text-ink-muted text-xs">{membership.sacco_name}</Text>
              <View className="bg-mint-50 px-2 py-0.5 rounded-lg">
                <Text className="text-mint-700 text-xs font-semibold capitalize">{membership.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-ink-muted text-xs mb-3">No active SACCOs linked yet.</Text>
        )}
        <TouchableOpacity onPress={() => router.push('/(member)/discover')}>
          <Text className="text-violet-500 text-xs font-semibold mt-3">+ Link another SACCO</Text>
        </TouchableOpacity>
      </View>

      {/* Settings list */}
      <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-4 border border-border">
        <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-3">ACCOUNT SETTINGS</Text>
        {settings.map((s, i) => (
          <TouchableOpacity key={i} className={`flex-row items-center gap-3 py-3 border-b border-border ${i === settings.length - 1 ? 'border-b-0' : ''}`} onPress={s.action}>
            <View className="w-8.5 h-8.5 rounded-lg bg-surface3 items-center justify-center"><Text>{s.icon}</Text></View>
            <Text className="flex-1 text-ink text-xs font-medium">{s.label}</Text>
            {s.toggle ? (
              <View className="w-9.5 h-5.5 rounded-full bg-violet-500" />
            ) : (
              <>
                {s.value && <Text className="text-ink-faint text-xs mr-1">{s.value}</Text>}
                <Text className="text-ink-faint text-lg">›</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity className="mx-3.5 my-3.5 bg-red-50 rounded-xl p-4 items-center" onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
        <Text className="text-red-700 text-xs font-semibold">🚪  Sign out</Text>
      </TouchableOpacity>

      <Text className="text-center text-ink-faint text-xs mb-10">Saccosphere v1.0 · SASRA regulated · CBK licensed</Text>
    </ScrollView>
  )
}

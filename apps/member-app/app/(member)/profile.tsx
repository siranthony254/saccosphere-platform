/**
 * Screen 23 — Member profile & settings
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { api } from '@saccosphere/api-client'

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const { mutate: logout } = useLogout()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'JK'

  const handleDownloadStatements = async () => {
    try {
      // Download statements for all active SACCOs
      for (const membership of activeMemberships) {
        const { blob, filename } = await api.member.downloadStatementPdf({
          sacco_id: membership.sacco_id,
          from_date: '2024-01-01', // Default to current year
          to_date: new Date().toISOString().split('T')[0],
        })
        
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1]
            const file = new File(Paths.document, filename)
            file.write(base64Data, { encoding: 'base64' })
            
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(file.uri)
            } else {
              Alert.alert('Success', `Statement downloaded: ${filename}`)
            }
          } catch (e) {
            console.error('File write error:', e)
            Alert.alert('Error', 'Failed to save statement.')
          }
        }
        reader.readAsDataURL(blob)
      }
    } catch (error) {
      console.error('Failed to download statements:', error)
      Alert.alert('Error', 'Failed to download statements. Please try again.')
    }
  }

  const settings = [
    { icon: '📱', label: 'M-Pesa number', value: user?.phone_number || user?.phone || 'Not set', action: () => {} },
    { icon: '🔒', label: 'Change password', action: () => router.push('/(auth)/forgot-password') },
    { icon: '📄', label: 'Download all statements', action: handleDownloadStatements },
  ]


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Profile</Text>
      </View>

      {/* Avatar + info */}
      <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
        <View style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{initials}</Text>
        </View>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{user?.first_name} {user?.last_name}</Text>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 10 }}>
          {user?.id ? `ID: ${user.id.slice(0, 8).toUpperCase()}` : ''} · Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'recently'}
        </Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: user?.kyc_status === 'verified' ? 'rgba(16, 185, 129, 0.15)' : user?.kyc_status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: user?.kyc_status === 'verified' ? MINT : user?.kyc_status === 'rejected' ? '#F87171' : '#F59E0B' }}>
            {user?.kyc_status === 'verified' ? '✓ KYC Verified' : user?.kyc_status === 'rejected' ? '✗ KYC Rejected' : user?.kyc_status === 'pending' || user?.kyc_status === 'under_review' ? '⏳ KYC Under Review' : '⚠ KYC Not Started'}
          </Text>
        </View>

      </View>

      {/* SACCO memberships summary */}
      <View style={{ backgroundColor: FROSTED_DARK, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>MY SACCOS</Text>
        {activeMemberships.length > 0 ? (
          activeMemberships.map((membership) => (
            <View key={membership.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{membership.sacco_name}</Text>
              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: MINT, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{membership.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 12 }}>No active SACCOs linked yet.</Text>
        )}
        <TouchableOpacity onPress={() => router.push('/(member)/discover')}>
          <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600', marginTop: 12 }}>+ Link another SACCO</Text>
        </TouchableOpacity>
      </View>

      {/* Settings list */}
      <View style={{ backgroundColor: FROSTED_DARK, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
        <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>ACCOUNT SETTINGS</Text>
        {settings.map((s, i) => (
          <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: i === settings.length - 1 ? 'transparent' : BORDER_WHITE }} onPress={s.action}>
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: FROSTED, alignItems: 'center', justifyContent: 'center' }}><Text>{s.icon}</Text></View>
            <Text style={{ flex: 1, color: TEXT, fontSize: 12, fontWeight: '500' }}>{s.label}</Text>
            {('toggle' in s && s.toggle) ? (

              <View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: VIOLET }} />
            ) : (
              <>
                {s.value && <Text style={{ color: TEXT_MUTED, fontSize: 12, marginRight: 4 }}>{s.value}</Text>}
                <Text style={{ color: TEXT_MUTED, fontSize: 18 }}>›</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={{ marginHorizontal: 14, marginVertical: 14, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }} onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
        <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>🚪  Sign out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 12, marginBottom: 40 }}>Saccosphere v1.0 · SASRA regulated · CBK licensed</Text>
    </ScrollView>
    </SafeAreaView>
  )
}

/**
 * Screen 23 — Member profile & settings
 */

import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import { getActiveMemberships } from '../../lib/membership'
import { api } from '@saccosphere/api-client'
import { Icon, IconName } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { useTheme } from '../../theme/ThemeProvider'


const getKycLabel = (status?: string, iprsVerified?: boolean) => {
  if (status === 'verified') return iprsVerified ? 'Official Identity Verified' : 'KYC Verified'
  if (status === 'iprs_mismatch') return 'ID Details Mismatch'
  if (status === 'pending_manual') return 'Manual Review Pending'
  if (status === 'iprs_rejected') return 'Identity Verification Failed'
  if (status === 'rejected') return 'KYC Rejected'
  if (status === 'under_review' || status === 'pending') return 'Review in Progress'
  return 'KYC Not Started'
}

const getKycVariant = (status?: string): any => {
  if (status === 'verified') return 'success'
  if (status === 'rejected' || status === 'iprs_rejected' || status === 'iprs_mismatch') return 'error'
  if (status === 'under_review' || status === 'pending' || status === 'pending_manual') return 'warning'
  return 'neutral'
}

export default function ProfileScreen() {
  const { colors: c } = useTheme()
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
            const fileUri = `${(FileSystem as any).cacheDirectory}${filename}`
            await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: 'base64' })
            
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri)
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

  const settings: Array<{ icon: IconName, label: string, value?: string, action: () => void }> = [
    { icon: 'phone', label: 'M-Pesa number', value: user?.phone_number || user?.phone || 'Not set', action: () => {} },
    { icon: 'security', label: 'Change password', action: () => router.push('/(auth)/forgot-password') },
    { icon: 'file', label: 'Download all statements', action: handleDownloadStatements },
  ]


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: c.bg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Profile</Text>
      </View>

      {/* Avatar + info */}
      <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: c.bg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>{initials}</Text>
        </View>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{user?.first_name} {user?.last_name}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 10 }}>
          {user?.id ? `ID: ${user.id.slice(0, 8).toUpperCase()}` : ''} · Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'recently'}
        </Text>
        <Badge
          label={getKycLabel(user?.kyc_status, user?.iprs_verified)}
          variant={getKycVariant(user?.kyc_status)}
          size="md"
        />
      </View>

      {/* SACCO memberships summary */}
      <View style={{ backgroundColor: c.surface, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>MY SACCOS</Text>
        {activeMemberships.length > 0 ? (
          activeMemberships.map((membership) => (
            <View key={membership.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{membership.sacco_name}</Text>
              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: c.success, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{membership.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 12 }}>No active SACCOs linked yet.</Text>
        )}
        <TouchableOpacity onPress={() => router.push('/(member)/discover')}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600', marginTop: 12 }}>+ Link another SACCO</Text>
        </TouchableOpacity>
      </View>

      {/* Settings list */}
      <View style={{ backgroundColor: c.surface, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>ACCOUNT SETTINGS</Text>
        {settings.map((s, i) => (
          <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: i === settings.length - 1 ? 'transparent' : c.border }} onPress={s.action}>
            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={18} color={c.text} />
            </View>
            <Text style={{ flex: 1, color: c.text, fontSize: 12, fontWeight: '500' }}>{s.label}</Text>
            {('toggle' in s && (s as any).toggle) ? (
              <View style={{ width: 38, height: 22, borderRadius: 11, backgroundColor: c.accent }} />
            ) : (
              <>
                {s.value && <Text style={{ color: c.textMuted, fontSize: 12, marginRight: 4 }}>{s.value}</Text>}
                <Icon name="arrow-right" size={16} color={c.textMuted} />
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={{ marginHorizontal: 14, marginVertical: 14, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }} onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
        <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Sign out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginBottom: 40 }}>Saccosphere v1.0 · SASRA regulated · CBK licensed</Text>
    </ScrollView>
    </SafeAreaView>
  )
}

import { useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Clipboard } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import SaccoSwitcher from '../../components/SaccoSwitcher'
import SaccoSelectModal from '../../components/SaccoSelectModal'
import { getActiveMemberships } from '../../lib/membership'

import { api } from '@saccosphere/api-client'
import { Icon, IconName } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { useTheme } from '../../theme/ThemeProvider'


export default function MenuScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)
  const { mutate: logout } = useLogout()
  const [switcherVisible, setSwitcherVisible] = useState(false)
  const [comparePickerVisible, setComparePickerVisible] = useState(false)
  const [referralsVisible, setReferralsVisible] = useState(false)

  const primaryMembership = activeMemberships[0] ?? null
  const initials = user ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() : 'ME'
  const activeSlug = primaryMembership?.sacco_slug

  // Generated once per user (not per render) so re-renders don't invalidate a
  // code the member may have already shared or copied.
  const referralCode = useMemo(
    () => (user ? `${user.first_name[0]}${user.last_name[0]}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase() : 'SS-JOIN'),
    [user?.id]
  )

  const menuItems: Array<{ label: string, helper: string, icon: IconName, action: () => void, disabled?: boolean }> = [
    {
      label: 'Guarantor requests',
      helper: 'Review and approve loan guarantees',
      icon: 'guarantor',
      action: () => router.push('/(member)/guarantor-inbox'),
    },
    {
      label: 'Referrals',
      helper: 'Invite friends and earn rewards',
      icon: 'dividend',
      action: () => setReferralsVisible(true),
    },
    {
      label: 'SACCO switcher',
      helper: 'Jump to a specific SACCO dashboard',
      icon: 'transfer',
      action: () => setSwitcherVisible(true),
      disabled: activeMemberships.length === 0,
    },
    {
      label: 'Compare loans',
      helper: 'Compare loan interest rates across SACCOs',
      icon: 'loan',
      action: () => {
        if (activeMemberships.length === 0) {
          Alert.alert('No SACCOs linked', 'Link a SACCO first to compare loans.')
        } else if (activeMemberships.length === 1) {
          router.push({ pathname: '/sacco/[slug]/compare', params: { slug: activeMemberships[0].sacco_slug } })
        } else {
          setComparePickerVisible(true)
        }
      },
    },
    {
      label: "Security & Settings",
      helper: 'Manage biometrics and account security',
      icon: 'settings',
      action: () => router.push('/(member)/settings'),
    },
  ]

  const handleCopyReferral = () => {
    Clipboard.setString(referralCode)
    Alert.alert('Copied!', 'Referral code copied to clipboard.')
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: c.bg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Menu</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Saccosphere features and SACCO utilities</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/(member)/notifications')}>
                <Icon name="bell" size={18} color={c.text} />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/(member)/profile')}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Card */}
        <View style={{ backgroundColor: c.surface, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{user ? `${user.first_name} ${user.last_name}` : 'Member'}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{user?.email ?? 'No email saved'}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{user?.phone ?? user?.phone_number ?? 'No phone saved'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(member)/profile')}>
              <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Menu */}
        <View style={{ backgroundColor: c.surface, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>ACTIONS & UTILITIES</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: index === menuItems.length - 1 ? 'transparent' : c.border, opacity: item.disabled ? 0.4 : 1 }}
              onPress={item.action}
              disabled={item.disabled}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Icon name={item.icon} size={20} color={c.text} />
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{item.helper}</Text>
              </View>
              <Icon name="arrow-right" size={16} color={c.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Linked Saccos Quick Access */}
        <View style={{ backgroundColor: c.surface, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>MY SACCOS</Text>
          {activeMemberships.length ? (
            activeMemberships.map((membership) => (
              <View key={membership.id} style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{membership.sacco_name}</Text>
                  <Badge label={membership.status} variant="success" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]/statement', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Statement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 12 }}>No active SACCOs linked yet.</Text>
              <TouchableOpacity style={{ backgroundColor: c.accent, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'flex-start' }} onPress={() => router.push('/(member)/discover')}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Browse & join SACCOs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Log out */}
        <TouchableOpacity style={{ marginHorizontal: 14, marginVertical: 14, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }} onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
          <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Sign out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginBottom: 40 }}>Saccosphere v1.0 • SASRA Regulated</Text>
      </ScrollView>
      </SafeAreaView>

      {/* Switcher bottom sheet */}
      <SaccoSwitcher visible={switcherVisible} onClose={() => setSwitcherVisible(false)} currentSacco={activeSlug} />

      {/* Compare picker prompt */}
      <SaccoSelectModal
        visible={comparePickerVisible}
        onClose={() => setComparePickerVisible(false)}
        onSelect={(slug) => {
          setComparePickerVisible(false)
          router.push({ pathname: '/sacco/[slug]/compare', params: { slug } })
        }}
        title="Compare Loans"
        subtitle="Select a SACCO to view interest rates and multipliers"
      />

      {/* Referrals Modal */}
      <Modal visible={referralsVisible} transparent animationType="fade" onRequestClose={() => setReferralsVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: c.surface, width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Refer & Earn</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              Invite your friends to Saccosphere. When they link their first SACCO and make a contribution, you both earn KES 200.
            </Text>

            <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: c.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Your Referral Code</Text>
              <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', fontFamily: 'monospace', marginBottom: 8 }}>{referralCode}</Text>
              <TouchableOpacity style={{ backgroundColor: c.accent, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 }} onPress={handleCopyReferral}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Copy Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ borderWidth: 1, borderColor: c.border, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }} onPress={() => setReferralsVisible(false)}>
              <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

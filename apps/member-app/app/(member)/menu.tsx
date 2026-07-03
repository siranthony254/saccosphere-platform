import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Clipboard } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import SaccoSwitcher from '../../components/SaccoSwitcher'
import SaccoSelectModal from '../../components/SaccoSelectModal'
import { getActiveMemberships } from '../../lib/membership'

const BACKGROUND = '#06091A'
const FROSTED = 'rgba(255, 255, 255, 0.08)'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function MenuScreen() {
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const { data: memberships = [] } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)
  const { mutate: logout } = useLogout()
  const [switcherVisible, setSwitcherVisible] = useState(false)
  const [comparePickerVisible, setComparePickerVisible] = useState(false)
  const [referralsVisible, setReferralsVisible] = useState(false)
  const [whatsNewVisible, setWhatsNewVisible] = useState(false)

  const primaryMembership = activeMemberships[0] ?? null
  const initials = user ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() : 'ME'
  const activeSlug = primaryMembership?.sacco_slug

  const referralCode = user ? `${user.first_name[0]}${user.last_name[0]}-${Math.floor(1000 + Math.random() * 9000)}`.toUpperCase() : 'SS-JOIN'

  const menuItems = [
    {
      label: 'Guarantor requests',
      helper: 'Review and approve loan guarantees',
      icon: '🤝',
      action: () => router.push('/(member)/guarantor-request'),
    },
    {
      label: 'Referrals',
      helper: 'Invite friends and earn rewards',
      icon: '🎁',
      action: () => setReferralsVisible(true),
    },
    {
      label: 'SACCO switcher',
      helper: 'Jump to a specific SACCO dashboard',
      icon: '🔄',
      action: () => setSwitcherVisible(true),
      disabled: activeMemberships.length === 0,
    },
    {
      label: 'Compare loans',
      helper: 'Compare loan interest rates across SACCOs',
      icon: '⚖️',
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
      label: "What's new",
      helper: 'Check recent updates and announcements',
      icon: '✨',
      action: () => setWhatsNewVisible(true),
    },
    {
      label: "Security & Settings",
      helper: 'Manage biometrics and account security',
      icon: '⚙️',
      action: () => router.push('/(member)/settings'),
    },
  ]

  const handleCopyReferral = () => {
    Clipboard.setString(referralCode)
    Alert.alert('Copied!', 'Referral code copied to clipboard.')
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Header */}
        <View style={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: BACKGROUND, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Menu</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>Saccosphere features and SACCO utilities</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: FROSTED_DARK, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/(member)/notifications')}>
                <Text style={{ fontSize: 14 }}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/(member)/profile')}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Card */}
        <View style={{ backgroundColor: FROSTED_DARK, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: VIOLET, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600' }}>{user ? `${user.first_name} ${user.last_name}` : 'Member'}</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{user?.email ?? 'No email saved'}</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>{user?.phone ?? user?.phone_number ?? 'No phone saved'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(member)/profile')}>
              <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Menu */}
        <View style={{ backgroundColor: FROSTED_DARK, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>ACTIONS & UTILITIES</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: index === menuItems.length - 1 ? 'transparent' : BORDER_WHITE, opacity: item.disabled ? 0.4 : 1 }}
              onPress={item.action}
              disabled={item.disabled}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: FROSTED, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{item.helper}</Text>
              </View>
              <Text style={{ color: TEXT_MUTED, fontSize: 18 }}>{'>'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Linked Saccos Quick Access */}
        <View style={{ backgroundColor: FROSTED_DARK, marginHorizontal: 14, marginVertical: 14, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
          <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>MY SACCOS</Text>
          {activeMemberships.length ? (
            activeMemberships.map((membership) => (
              <View key={membership.id} style={{ paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>{membership.sacco_name}</Text>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: MINT, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{membership.status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: FROSTED, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: FROSTED, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]/pay', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: FROSTED, borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                    onPress={() => router.push({ pathname: '/sacco/[slug]/statement', params: { slug: membership.sacco_slug } })}
                  >
                    <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Statement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 12 }}>No active SACCOs linked yet.</Text>
              <TouchableOpacity style={{ backgroundColor: VIOLET, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'flex-start' }} onPress={() => router.push('/(member)/discover')}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Browse & join SACCOs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Log out */}
        <TouchableOpacity style={{ marginHorizontal: 14, marginVertical: 14, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EF4444' }} onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
          <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '600' }}>Sign out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 12, marginBottom: 40 }}>Saccosphere v1.0 • SASRA Regulated</Text>
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
          <View style={{ backgroundColor: FROSTED_DARK, width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BORDER_WHITE }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>Refer & Earn</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              Invite your friends to Saccosphere. When they link their first SACCO and make a contribution, you both earn KES 200.
            </Text>

            <View style={{ backgroundColor: FROSTED, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER_WHITE, alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: TEXT_MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Your Referral Code</Text>
              <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700', fontFamily: 'monospace', marginBottom: 8 }}>{referralCode}</Text>
              <TouchableOpacity style={{ backgroundColor: VIOLET, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 }} onPress={handleCopyReferral}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Copy Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ borderWidth: 1, borderColor: BORDER_WHITE, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }} onPress={() => setReferralsVisible(false)}>
              <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* What's New Modal */}
      <Modal visible={whatsNewVisible} transparent animationType="slide" onRequestClose={() => setWhatsNewVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: FROSTED_DARK, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ width: 36, height: 4, backgroundColor: BORDER_WHITE, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>What's New</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 16 }}>Latest updates and news from your SACCOs and the Saccosphere platform.</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {[
                {
                  title: 'Unaitas SACCO Lowered Loan Rates',
                  desc: 'Unaitas has updated its BOSA development loan rates to 10.5% p.a. (down from 11.2%). This is now live for all members on the app.',
                  date: 'Today',
                  badge: 'Rate Cut',
                },
                {
                  title: 'Mambo Vendor Integration Complete',
                  desc: 'We completed a platform-wide data partnership with Mambo Core Banking. Smaller community SACCOs on Mambo can now be linked in under 2 minutes.',
                  date: 'Yesterday',
                  badge: 'Platform',
                },
                {
                  title: 'Imarika SACCO Joins Saccosphere',
                  desc: 'Members of Imarika SACCO can now browse, apply to join, and link their memberships directly. Share capital payments are fully supported.',
                  date: '3 days ago',
                  badge: 'New SACCO',
                },
              ].map((update, idx) => (
                <View key={idx} style={{ borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE, paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>{update.title}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(109, 40, 217, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: VIOLET, fontSize: 10, fontWeight: '600' }}>{update.badge}</Text>
                    </View>
                  </View>
                  <Text style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 18, marginBottom: 4 }}>{update.desc}</Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>{update.date}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={{ backgroundColor: VIOLET, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }} onPress={() => setWhatsNewVisible(false)}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

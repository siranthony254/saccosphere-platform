import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Clipboard } from 'react-native'
import { router } from 'expo-router'
import { useCurrentUser } from '../../store/useAuthStore'
import { useLogout } from '../../hooks/useAuth'
import { useMemberships } from '../../hooks/useMembership'
import SaccoSwitcher from '../../components/SaccoSwitcher'
import SaccoSelectModal from '../../components/SaccoSelectModal'
import { getActiveMemberships } from '../../lib/membership'

export default function MenuScreen() {
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
          router.push({ pathname: '/(member)/sacco/[slug]/compare', params: { slug: activeMemberships[0].sacco_slug } })
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
  ]

  const handleCopyReferral = () => {
    Clipboard.setString(referralCode)
    Alert.alert('Copied!', 'Referral code copied to clipboard.')
  }

  return (
    <>
      <ScrollView className="bg-surface2">
        {/* Header */}
        <View className="pt-13 px-4 pb-3 bg-surface border-b border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-ink text-xl font-bold">Menu</Text>
              <Text className="text-ink-faint text-xs mt-0.5">Saccosphere features and SACCO utilities</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity className="w-9 h-9 rounded-full bg-surface3 items-center justify-center" onPress={() => router.push('/(member)/notifications')}>
                <Text className="text-sm">🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-9 h-9 rounded-full bg-violet-500 items-center justify-center" onPress={() => router.push('/(member)/profile')}>
                <Text className="text-white text-xs font-bold">{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* User Card */}
        <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-4 border border-border">
          <View className="flex-row items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-violet-500 items-center justify-center">
              <Text className="text-white text-lg font-bold">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink text-sm font-semibold">{user ? `${user.first_name} ${user.last_name}` : 'Member'}</Text>
              <Text className="text-ink-faint text-xs">{user?.email ?? 'No email saved'}</Text>
              <Text className="text-ink-faint text-xs">{user?.phone ?? user?.phone_number ?? 'No phone saved'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(member)/profile')}>
              <Text className="text-violet-500 text-xs font-semibold">Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Menu */}
        <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-4 border border-border">
          <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-3">ACTIONS & UTILITIES</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center py-3.5 border-b border-border ${index === menuItems.length - 1 ? 'border-b-0' : ''} ${item.disabled ? 'opacity-40' : ''}`}
              onPress={item.action}
              disabled={item.disabled}
            >
              <View className="w-9 h-9 rounded-xl bg-surface2 items-center justify-center mr-3">
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View className="flex-1 pr-3">
                <Text className="text-ink text-xs font-semibold">{item.label}</Text>
                <Text className="text-ink-faint text-xs mt-0.5">{item.helper}</Text>
              </View>
              <Text className="text-ink-faint text-lg">{'>'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Linked Saccos Quick Access */}
        <View className="bg-surface mx-3.5 my-3.5 rounded-xl p-4 border border-border">
          <Text className="text-ink-faint text-xs font-semibold tracking-widest mb-3">MY SACCOS</Text>
          {activeMemberships.length ? (
            activeMemberships.map((membership) => (
              <View key={membership.id} className="py-3 border-b border-border last:border-b-0">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-ink text-xs font-semibold">{membership.sacco_name}</Text>
                  <View className="bg-mint-50 px-2 py-0.5 rounded-lg">
                    <Text className="text-mint-700 text-xs font-semibold capitalize">{membership.status}</Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    className="bg-surface2 border border-border rounded-lg px-3 py-1.5"
                    onPress={() => router.push({ pathname: '/(member)/sacco/[slug]', params: { slug: membership.sacco_slug } })}
                  >
                    <Text className="text-ink-soft text-xs font-semibold">Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-surface2 border border-border rounded-lg px-3 py-1.5"
                    onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/pay', params: { slug: membership.sacco_slug } })}
                  >
                    <Text className="text-ink-soft text-xs font-semibold">Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-surface2 border border-border rounded-lg px-3 py-1.5"
                    onPress={() => router.push({ pathname: '/(member)/sacco/[slug]/statement', params: { slug: membership.sacco_slug } })}
                  >
                    <Text className="text-ink-soft text-xs font-semibold">Statement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="py-2">
              <Text className="text-ink-muted text-xs mb-3">No active SACCOs linked yet.</Text>
              <TouchableOpacity className="bg-violet-500 rounded-xl py-2 px-4 items-center self-start" onPress={() => router.push('/(member)/discover')}>
                <Text className="text-white text-xs font-semibold">Browse & join SACCOs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Log out */}
        <TouchableOpacity className="mx-3.5 my-3.5 bg-red-50 rounded-xl p-4 items-center" onPress={() => logout(undefined, { onSuccess: () => router.replace('/(auth)/login') })}>
          <Text className="text-red-700 text-xs font-semibold">Sign out</Text>
        </TouchableOpacity>

        <Text className="text-center text-ink-faint text-xs mb-10">Saccosphere v1.0 • SASRA Regulated</Text>
      </ScrollView>

      {/* Switcher bottom sheet */}
      <SaccoSwitcher visible={switcherVisible} onClose={() => setSwitcherVisible(false)} currentSacco={activeSlug} />

      {/* Compare picker prompt */}
      <SaccoSelectModal
        visible={comparePickerVisible}
        onClose={() => setComparePickerVisible(false)}
        onSelect={(slug) => {
          setComparePickerVisible(false)
          router.push({ pathname: '/(member)/sacco/[slug]/compare', params: { slug } })
        }}
        title="Compare Loans"
        subtitle="Select a SACCO to view interest rates and multipliers"
      />

      {/* Referrals Modal */}
      <Modal visible={referralsVisible} transparent animationType="fade" onRequestClose={() => setReferralsVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-surface w-full max-w-sm rounded-2xl p-5 border border-border shadow-lg">
            <Text className="text-ink text-lg font-bold mb-1.5 text-center">Refer & Earn</Text>
            <Text className="text-ink-muted text-xs text-center leading-4.5 mb-5">
              Invite your friends to Saccosphere. When they link their first SACCO and make a contribution, you both earn KES 200.
            </Text>

            <View className="bg-surface2 rounded-xl p-3 border border-border items-center mb-5">
              <Text className="text-ink-faint text-[10px] uppercase tracking-wider mb-1">Your Referral Code</Text>
              <Text className="text-ink text-xl font-bold font-mono select-all mb-2">{referralCode}</Text>
              <TouchableOpacity className="bg-violet-500 px-4 py-1.5 rounded-lg" onPress={handleCopyReferral}>
                <Text className="text-white text-xs font-semibold">Copy Code</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity className="border border-border py-2.5 rounded-xl items-center" onPress={() => setReferralsVisible(false)}>
              <Text className="text-ink-soft text-xs font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* What's New Modal */}
      <Modal visible={whatsNewVisible} transparent animationType="slide" onRequestClose={() => setWhatsNewVisible(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <View className="bg-surface rounded-t-3xl p-5 max-h-[80%]">
            <View className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
            <Text className="text-ink text-lg font-bold mb-1.5">What's New</Text>
            <Text className="text-ink-faint text-xs mb-4">Latest updates and news from your SACCOs and the Saccosphere platform.</Text>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-5">
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
                <View key={idx} className="border-b border-border py-3.5 last:border-b-0">
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-1 pr-2">
                      <Text className="text-ink text-xs font-semibold">{update.title}</Text>
                    </View>
                    <View className="bg-violet-50 px-1.5 py-0.5 rounded">
                      <Text className="text-violet-500 text-[10px] font-semibold">{update.badge}</Text>
                    </View>
                  </View>
                  <Text className="text-ink-muted text-xs leading-4.5 mb-1">{update.desc}</Text>
                  <Text className="text-ink-faint text-[10px]">{update.date}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity className="bg-violet-500 py-3 rounded-xl items-center" onPress={() => setWhatsNewVisible(false)}>
              <Text className="text-white text-xs font-semibold">Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

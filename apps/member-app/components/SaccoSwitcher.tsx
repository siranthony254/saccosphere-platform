import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useMemberships, useSaccoSwitcher } from '../hooks/useMembership'
import { getActiveMemberships } from '../lib/membership'
import { SaccoPickerSheet } from './SaccoPickerSheet'
import { Icon } from './ui/Icon'
import { useTheme } from '../theme/ThemeProvider'

interface SaccoSwitcherProps {
  visible: boolean
  onClose: () => void
  currentSacco?: string
}

export default function SaccoSwitcher({ visible, onClose, currentSacco }: SaccoSwitcherProps) {
  const { colors: c } = useTheme()
  const { data: memberships, isLoading } = useMemberships()
  const { data: switcherRows } = useSaccoSwitcher()
  const activeMemberships = getActiveMemberships(memberships ?? [])

  const statsFor = (m: { sacco_id?: string; sacco_name?: string; sacco_slug?: string }) =>
    switcherRows?.find(
      (r) => r.sacco_id === m.sacco_id || r.sacco_name === m.sacco_name || r.sacco_slug === m.sacco_slug
    )

  const handleSaccoSelect = (saccoSlug: string) => {
    router.replace(`/sacco/${saccoSlug}`)
    onClose()
  }

  return (
    <SaccoPickerSheet
      visible={visible}
      onClose={onClose}
      title="Switch SACCO"
      subtitle="Select a SACCO to view its dashboard"
      memberships={activeMemberships}
      isLoading={isLoading}
      loadingLabel="Loading your SACCOs..."
      emptyLabel="No active SACCOs available yet."
      onSelectSacco={handleSaccoSelect}
      isSelected={(m) => m.sacco_slug === currentSacco}
      renderRowAccessory={(membership) => {
        const unread = statsFor(membership)?.unread_notifications ?? 0
        const isCurrent = membership.sacco_slug === currentSacco
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {unread > 0 && (
              <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
            {isCurrent && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent }} />}
          </View>
        )
      }}
      footer={
        <TouchableOpacity
          onPress={() => {
            onClose()
            router.push('/(member)/discover')
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.accentSoft, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="plus" size={20} color={c.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 12, fontWeight: '500' }}>Add another SACCO</Text>
            <Text style={{ color: c.textFaint, fontSize: 12 }}>Browse and join new SACCOs</Text>
          </View>
        </TouchableOpacity>
      }
    />
  )
}

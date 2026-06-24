import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMemberships } from '../hooks/useMembership'
import { getActiveMemberships } from '../lib/membership'

const SACCO_COLORS: Record<string, string> = {
  'stima-sacco': '#0070ba',
  'teachers-sacco': '#7c3aed',
  'unaitas-sacco': '#16a085',
  'kenya-police-sacco': '#c0392b',
  'imarika-sacco': '#2980b9',
}

const SACCO_INITIALS: Record<string, string> = {
  'stima-sacco': 'ST',
  'teachers-sacco': 'TS',
  'unaitas-sacco': 'UN',
  'kenya-police-sacco': 'KP',
  'imarika-sacco': 'IK',
}

interface SaccoSelectModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (slug: string) => void
  title: string
  subtitle: string
}

export default function SaccoSelectModal({
  visible,
  onClose,
  onSelect,
  title,
  subtitle,
}: SaccoSelectModalProps) {
  const insets = useSafeAreaInsets()
  const { data: memberships = [], isLoading } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const handleSelect = (saccoSlug: string) => {
    onSelect(saccoSlug)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(6,9,26,0.45)' }}>
        <View className="bg-surface rounded-t-3xl overflow-hidden">
          {/* Sheet Handle */}
          <View className="w-9 h-1 bg-border rounded-full mx-auto my-3" />
          
          {/* Title Header */}
          <View className="px-5 pb-4">
            <Text className="text-ink text-sm font-semibold">{title}</Text>
            <Text className="text-ink-faint text-xs mt-1">{subtitle}</Text>
          </View>

          {/* Sacco Picker List */}
          <View className="px-4" style={{ paddingBottom: insets.bottom + 24 }}>
            {isLoading ? (
              <View className="py-8 items-center">
                <Text className="text-ink-muted text-xs">Loading linked SACCOs...</Text>
              </View>
            ) : activeMemberships.length === 0 ? (
              <View className="py-8 items-center px-4">
                <Text className="text-ink-muted text-xs text-center mb-3">No active SACCOs available.</Text>
              </View>
            ) : (
              activeMemberships.map((membership) => (
                <TouchableOpacity
                  key={membership.id}
                  onPress={() => handleSelect(membership.sacco_slug)}
                  className="flex-row items-center gap-3 py-3.5 px-4 border-b border-border last:border-b-0"
                >
                  <View
                    className="w-10 h-10 rounded-lg justify-center items-center"
                    style={{ backgroundColor: SACCO_COLORS[membership.sacco_slug] || membership.sacco_color || '#6D28D9' }}
                  >
                    <Text className="text-white text-xs font-bold">
                      {SACCO_INITIALS[membership.sacco_slug] || membership.sacco_initials || 'SA'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-xs font-medium">{membership.sacco_name}</Text>
                    <Text className="text-ink-faint text-xs">Member No. {membership.member_number || 'Pending'}</Text>
                  </View>
                  <Text className="text-ink-faint text-lg">›</Text>
                </TouchableOpacity>
              ))
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-surface2 border border-border py-3 rounded-xl items-center mt-3"
            >
              <Text className="text-ink-soft text-xs font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

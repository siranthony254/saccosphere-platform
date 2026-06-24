
import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMemberships } from '../hooks/useMembership'
import { router } from 'expo-router'
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

interface SaccoSwitcherProps {
  visible: boolean
  onClose: () => void
  currentSacco?: string
}

export default function SaccoSwitcher({ visible, onClose, currentSacco }: SaccoSwitcherProps) {
  const insets = useSafeAreaInsets()
  const { data: memberships, isLoading } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships ?? [])

  const handleSaccoSelect = (saccoSlug: string) => {
    router.replace(`/(member)/sacco/${saccoSlug}`)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(6,9,26,0.4)' }}>
        <View className="bg-surface rounded-t-3xl overflow-hidden">
          {/* Handle */}
          <View className="w-9 h-1 bg-border rounded-full mx-auto my-3" />
          
          {/* Header */}
          <View className="px-5 pb-4">
            <Text className="text-ink text-sm font-semibold">Switch SACCO</Text>
            <Text className="text-ink-faint text-xs mt-1">Select a SACCO to view its dashboard</Text>
          </View>

          {/* SACCO List */}
          <View className="px-4" style={{ paddingBottom: insets.bottom + 24 }}>
            {isLoading ? (
              <View className="py-8 items-center">
                <Text className="text-ink-muted text-xs">Loading your SACCOs...</Text>
              </View>
            ) : (
              <>
                {activeMemberships.map((membership) => (
                  <TouchableOpacity
                    key={membership.sacco_slug}
                    onPress={() => handleSaccoSelect(membership.sacco_slug)}
                    className={`flex-row items-center gap-3 py-3 px-4 border-b border-border ${
                      membership.sacco_slug === currentSacco ? 'bg-mint-50' : ''
                    }`}
                  >
                    <View
                      className="w-10 h-10 rounded-lg justify-center items-center"
                      style={{ backgroundColor: SACCO_COLORS[membership.sacco_slug] || '#6D28D9' }}
                    >
                      <Text className="text-white text-xs font-bold">
                        {SACCO_INITIALS[membership.sacco_slug] || '?'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-ink text-xs font-medium">{membership.sacco_name}</Text>
                      <Text className="text-ink-faint text-xs">{membership.member_number}</Text>
                    </View>
                    {membership.sacco_slug === currentSacco && (
                      <View className="w-2 h-2 rounded-full bg-violet-500" />
                    )}
                  </TouchableOpacity>
                ))}
                {activeMemberships.length === 0 ? (
                  <View className="py-8 items-center px-4">
                    <Text className="text-ink-muted text-xs text-center">No active SACCOs available yet.</Text>
                  </View>
                ) : null}
                
                {/* Add SACCO option */}
                <TouchableOpacity
                  onPress={() => {
                    onClose()
                    router.push('/(member)/discover')
                  }}
                  className="flex-row items-center gap-3 py-3 px-4 mt-2"
                >
                  <View className="w-10 h-10 rounded-lg bg-violet-100 justify-center items-center">
                    <Text className="text-violet-500 text-lg font-bold">+</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-xs font-medium">Add another SACCO</Text>
                    <Text className="text-ink-faint text-xs">Browse and join new SACCOs</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

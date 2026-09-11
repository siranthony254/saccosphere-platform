import { ReactNode } from 'react'
import { View, Text, TouchableOpacity, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Membership } from '@saccosphere/schemas'
import { Icon } from './ui/Icon'
import { useTheme } from '../theme/ThemeProvider'

interface SaccoPickerSheetProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle: string
  memberships: Membership[]
  isLoading: boolean
  loadingLabel: string
  emptyLabel: string
  onSelectSacco: (slug: string) => void
  isSelected?: (membership: Membership) => boolean
  /** Extra content rendered on the right of a row, before the chevron/dot. */
  renderRowAccessory?: (membership: Membership) => ReactNode
  /** Rendered below the list — e.g. a Cancel button or an "Add SACCO" row. */
  footer?: ReactNode
}

/**
 * Shared bottom-sheet layout for SaccoSelectModal and SaccoSwitcher — same
 * handle bar / header / membership row / loading / empty markup, with the
 * selection behaviour, row accessory, and footer action left to the caller.
 */
export function SaccoPickerSheet({
  visible,
  onClose,
  title,
  subtitle,
  memberships,
  isLoading,
  loadingLabel,
  emptyLabel,
  onSelectSacco,
  isSelected,
  renderRowAccessory,
  footer,
}: SaccoPickerSheetProps) {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,9,26,0.45)' }}>
        <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
          {/* Sheet handle */}
          <View style={{ width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 }} />

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{title}</Text>
            <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
          </View>

          {/* List */}
          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
            {isLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{loadingLabel}</Text>
              </View>
            ) : (
              <>
                {memberships.map((membership) => (
                  <TouchableOpacity
                    key={membership.id}
                    onPress={() => onSelectSacco(membership.sacco_slug)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: c.border,
                      backgroundColor: isSelected?.(membership) ? c.accentSoft : 'transparent',
                      borderRadius: isSelected?.(membership) ? 12 : 0,
                    }}
                  >
                    <View
                      style={{ width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: membership.sacco_color || c.accent }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                        {membership.sacco_initials || 'SA'}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 12, fontWeight: '500' }}>{membership.sacco_name}</Text>
                      <Text style={{ color: c.textFaint, fontSize: 12 }}>Member No. {membership.member_number || 'Pending'}</Text>
                    </View>

                    {renderRowAccessory?.(membership)}
                    {!renderRowAccessory && <Icon name="arrow-right" size={16} color={c.textFaint} />}
                  </TouchableOpacity>
                ))}

                {memberships.length === 0 && (
                  <View style={{ paddingVertical: 32, alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center' }}>{emptyLabel}</Text>
                  </View>
                )}
              </>
            )}

            {footer}
          </View>
        </View>
      </View>
    </Modal>
  )
}

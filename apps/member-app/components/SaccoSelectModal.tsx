import { Text, TouchableOpacity } from 'react-native'
import { useMemberships } from '../hooks/useMembership'
import { getActiveMemberships } from '../lib/membership'
import { SaccoPickerSheet } from './SaccoPickerSheet'
import { useTheme } from '../theme/ThemeProvider'

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
  const { colors: c } = useTheme()
  const { data: memberships = [], isLoading } = useMemberships()
  const activeMemberships = getActiveMemberships(memberships)

  const handleSelect = (saccoSlug: string) => {
    onSelect(saccoSlug)
    onClose()
  }

  return (
    <SaccoPickerSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      memberships={activeMemberships}
      isLoading={isLoading}
      loadingLabel="Loading linked SACCOs..."
      emptyLabel="No active SACCOs available."
      onSelectSacco={handleSelect}
      footer={
        <TouchableOpacity
          onPress={onClose}
          style={{ backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      }
    />
  )
}

import { Pressable, StyleProp, ViewStyle } from 'react-native'
import { Icon } from './Icon'
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useTheme } from '../../theme/ThemeProvider'
import { hapticSelect } from '../../lib/haptics'

type Props = {
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

/**
 * Eye toggle that shows/hides the member's personal details (name, national
 * ID, phone number) app-wide — separate from BalanceToggle, which only
 * covers monetary amounts. Drop it next to a name/ID/phone value.
 */
export function PersonalDetailsToggle({ size = 18, color, style }: Props) {
  const hidden = usePreferencesStore((s) => s.personalDetailsHidden)
  const toggle = usePreferencesStore((s) => s.togglePersonalDetailsHidden)
  const { colors: c } = useTheme()
  const resolvedColor = color ?? c.textMuted

  return (
    <Pressable
      onPress={() => {
        hapticSelect()
        toggle()
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Show personal details' : 'Hide personal details'}
      style={style}
    >
      <Icon name={hidden ? 'eye-off' : 'eye'} size={size} color={resolvedColor} />
    </Pressable>
  )
}

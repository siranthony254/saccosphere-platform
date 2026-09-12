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
 * Eye toggle that shows/hides the member's balances app-wide.
 * Drop it next to a headline balance; it reads and writes usePreferencesStore.
 *
 * Defaults to a theme-aware muted color rather than a fixed
 * semi-transparent white — a hardcoded white icon disappears on light
 * themes (Daybreak, Paper). Pass `color` explicitly only when the toggle
 * sits on a guaranteed-dark surface (e.g. a colored hero card) regardless
 * of theme.
 */
export function BalanceToggle({ size = 18, color, style }: Props) {
  const hidden = usePreferencesStore((s) => s.balanceHidden)
  const toggle = usePreferencesStore((s) => s.toggleBalanceHidden)
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
      accessibilityLabel={hidden ? 'Show balances' : 'Hide balances'}
      style={style}
    >
      <Icon name={hidden ? 'eye-off' : 'eye'} size={size} color={resolvedColor} />
    </Pressable>
  )
}

import { Pressable, StyleProp, ViewStyle } from 'react-native'
import { Icon } from './Icon'
import { usePreferencesStore } from '../../store/usePreferencesStore'

type Props = {
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

/**
 * Eye toggle that shows/hides the member's balances app-wide.
 * Drop it next to a headline balance; it reads and writes usePreferencesStore.
 */
export function BalanceToggle({ size = 18, color = 'rgba(255,255,255,0.75)', style }: Props) {
  const hidden = usePreferencesStore((s) => s.balanceHidden)
  const toggle = usePreferencesStore((s) => s.toggleBalanceHidden)

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Show balances' : 'Hide balances'}
      style={style}
    >
      <Icon name={hidden ? 'eye-off' : 'eye'} size={size} color={color} />
    </Pressable>
  )
}

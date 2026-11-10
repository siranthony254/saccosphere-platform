import { Alert, Pressable } from 'react-native'
import { Icon } from './Icon'
import { useTheme } from '../../theme/ThemeProvider'

// Plain-language explanations for a member with no SACCO background —
// RN has no hover, so this is tap-to-reveal via a native Alert rather
// than a hover tooltip.
export function InfoTip({ title, text }: { title: string; text: string }) {
  const { colors: c } = useTheme()
  return (
    <Pressable
      onPress={() => Alert.alert(title, text)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`About ${title}`}
    >
      <Icon name="info" size={12} color={c.textFaint} />
    </Pressable>
  )
}

import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Icon, type IconName } from './Icon'
import { useTheme } from '../../theme/ThemeProvider'

type Props = {
  icon: IconName
  title: string
  description?: string
  /** Extra content below the description — typically a CTA button. */
  children?: ReactNode
}

/**
 * Shared empty/error-state treatment: an icon on a soft accent-tinted
 * badge, title, and optional description — the same icon-badge language
 * used elsewhere (e.g. the guarantor inbox's empty state), pulled out so
 * "nothing here yet" reads the same way across the whole app instead of
 * each screen inventing its own version.
 */
export function EmptyState({ icon, title, description, children }: Props) {
  const { colors: c } = useTheme()

  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: c.accentSoft,
          borderWidth: 1,
          borderColor: c.accent + '33',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Icon name={icon} size={30} color={c.accent} />
      </View>
      <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>{title}</Text>
      {description && (
        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>{description}</Text>
      )}
      {children && <View style={{ marginTop: 16, width: '100%' }}>{children}</View>}
    </View>
  )
}

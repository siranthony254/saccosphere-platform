import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Icon, type IconName } from '../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

export interface DiscoverCategory {
  id: string
  label: string
  icon: IconName
  /** Categories with no backend support yet render greyed-out with a "Soon" badge. */
  enabled: boolean
}

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  { id: 'saccos', label: 'SACCOs', icon: 'bank', enabled: true },
  { id: 'insurance', label: 'Insurance', icon: 'security', enabled: false },
  { id: 'merchandise', label: 'Merchandise', icon: 'card', enabled: false },
  { id: 'banks', label: 'Banks', icon: 'folder', enabled: false },
  { id: 'diaspora', label: 'Diaspora', icon: 'send', enabled: false },
  { id: 'budgeting', label: 'Budgeting', icon: 'chart', enabled: false },
  { id: 'knowledge', label: 'Financial Knowledge', icon: 'bulb', enabled: false },
]

type Props = {
  activeId: string
  onSelect: (id: string) => void
}

export function CategoryTabs({ activeId, onSelect }: Props) {
  const { colors: c } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}
    >
      {DISCOVER_CATEGORIES.map((category) => {
        const active = category.id === activeId
        return (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.8}
            onPress={() => {
              if (!category.enabled) {
                Alert.alert(`${category.label} — coming soon`, "We're working on bringing this to Saccosphere. Stay tuned!")
                return
              }
              onSelect(category.id)
            }}
            style={{
              alignItems: 'center',
              width: 76,
              opacity: category.enabled ? 1 : 0.5,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
                backgroundColor: active ? c.accent : c.surface,
                borderWidth: active ? 0 : 1,
                borderColor: c.border,
              }}
            >
              <Icon name={category.icon} size={20} color={active ? '#fff' : c.textMuted} />
            </View>
            <Text
              numberOfLines={1}
              style={{ fontSize: 10, fontWeight: '600', color: active ? c.accent : c.textMuted, textAlign: 'center' }}
            >
              {category.label}
            </Text>
            {!category.enabled && (
              <View style={{ marginTop: 3, backgroundColor: c.surfaceAlt, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 8, fontWeight: '700', color: c.textFaint, textTransform: 'uppercase' }}>Soon</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { useCurrentUser } from '../store/useAuthStore'

type MemberHeaderProps = {
  title?: string
  subtitle?: string
  greeting?: boolean
}

export default function MemberHeader({ title, subtitle, greeting = false }: MemberHeaderProps) {
  const user = useCurrentUser()
  const initials = user ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() : 'ME'

  return (
    <View className="flex-row justify-between items-center px-4 pt-13 pb-4 bg-surface border-b border-border">
      <View className="flex-1 pr-3">
        {greeting ? (
          <>
            <Text className="text-ink-faint text-xs">Good morning</Text>
            <Text className="text-ink text-base font-semibold">
              {user ? `${user.first_name} ${user.last_name}` : 'Member'}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-ink text-xl font-bold">{title}</Text>
            {subtitle ? <Text className="text-ink-faint text-xs mt-0.5">{subtitle}</Text> : null}
          </>
        )}
      </View>

      <View className="flex-row items-center gap-2.5">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-surface3 items-center justify-center relative"
          onPress={() => router.push('/(member)/notifications')}
        >
          <Text className="text-ink text-xs font-bold">N</Text>
          <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-surface" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-violet-500 items-center justify-center"
          onPress={() => router.push('/(member)/profile')}
        >
          <Text className="text-white text-xs font-bold">{initials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

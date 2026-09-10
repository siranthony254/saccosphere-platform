import { SafeAreaView } from 'react-native-safe-area-context'
import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'
import { Icon, type IconName } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { AppBackground } from '../../theme/AppBackground'


export default function MemberTabLayout() {
  const { colors: c } = useTheme()
  return (
    <AppBackground>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textFaint,
          tabBarStyle: {
            borderTopColor: c.border,
            borderTopWidth: 0.5,
            paddingBottom: 6,
            paddingTop: 6,
            height: 65,
            backgroundColor: c.bg,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -3 },
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 1 },
          tabBarItemStyle: { paddingVertical: 2, gap: 2 },
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="home" color={color} focused={focused} />
          }} 
        />
        <Tabs.Screen 
          name="services" 
          options={{ 
            title: 'Services', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="services" color={color} focused={focused} />
          }} 
        />
        <Tabs.Screen 
          name="discover" 
          options={{ 
            title: 'Discover', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="discover" color={color} focused={focused} />
          }} 
        />
        <Tabs.Screen 
          name="menu" 
          options={{ 
            title: 'Menu', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="menu" color={color} focused={focused} />
          }} 
        />
        <Tabs.Screen name="approved-dashboard" options={{ href: null }} />
        <Tabs.Screen name="empty-dashboard" options={{ href: null }} />
        <Tabs.Screen name="pending-dashboard" options={{ href: null }} />
        <Tabs.Screen name="unified-potfolio-dashbord" options={{ href: null }} />
        <Tabs.Screen name="discover-browse" options={{ href: null }} />
        <Tabs.Screen name="guarantor-request" options={{ href: null }} />
        <Tabs.Screen name="loan-repayment" options={{ href: null }} />
        <Tabs.Screen name="loan-detail" options={{ href: null }} />
        <Tabs.Screen name="transaction-detail" options={{ href: null }} />
        <Tabs.Screen name="withdraw" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="dividends" options={{ href: null }} />
        <Tabs.Screen name="guarantor-inbox" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]/apply" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
    </AppBackground>
  )
}

//{quick actions on the home tab}


function TabIcon({ icon, color, focused }: { icon: IconName; color: string; focused: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{
      width: 28,
      height: 30,
      borderRadius: 8,
      backgroundColor: focused ? '#EDE9FE' : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <Icon name={icon} size={18} color={color} />
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: -4,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: c.accent,
        }} />
      )}
    </View>
  )
}

import { SafeAreaView } from 'react-native-safe-area-context'
import { Tabs } from 'expo-router'
import { Text, View, Platform } from 'react-native'
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
          // Bottom-tabs gives each screen its own opaque scene container
          // (defaults to white) that sits between this shared AppBackground
          // and the screen's content. Home only looked right because it
          // separately re-wraps itself in DeepSpaceBackground/AppBackground,
          // painting over that white pane — every other tab (Discover, Menu,
          // Services) showed it as a wall of white with barely-visible text.
          // Make the pane itself transparent so the one AppBackground here is
          // the only background layer, for every tab.
          sceneStyle: { backgroundColor: 'transparent' },
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
            ...Platform.select({
              web: { boxShadow: '0px -3px 12px rgba(0,0,0,0.08)' },
              default: {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: -3 },
              },
            }),
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

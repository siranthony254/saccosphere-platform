import { SafeAreaView } from 'react-native-safe-area-context'
import { Tabs } from 'expo-router'
import { Text, View, Platform } from 'react-native'
import { Icon, type IconName } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'
import { AppLockGuard } from '../../components/AppLockGuard'


export default function MemberTabLayout() {
  const { colors: c } = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>
      <AppLockGuard />
      <Tabs
        screenOptions={{
          headerShown: false,
          // Bottom-tabs gives each screen its own opaque scene container
          // (defaults to white) that sits between the single app-wide
          // AppBackground (mounted once in the root layout) and this
          // screen's content. Keep it transparent so that one shared
          // backdrop is the only background layer, for every tab.
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
        {/* href: null is expo-router's own "don't treat this as tab-navigable"
            signal, but the actual bottom-tab-bar *button* is rendered by
            React Navigation underneath it - on this build that translation
            wasn't fully suppressing the button, so all ~19 of these screens
            below were still rendering as real, tappable (just visually
            collapsed to a sliver) tab items. tabBarButton: () => null is the
            React-Navigation-level override that unconditionally renders no
            button at all for a tab, regardless of how href: null gets
            translated - belt and suspenders alongside href: null, not a
            replacement for it (href: null still controls routing behavior). */}
        <Tabs.Screen name="approved-dashboard" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="empty-dashboard" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="pending-dashboard" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="unified-potfolio-dashbord" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="discover-browse" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="guarantor-request" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="loan-repayment" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="loan-detail" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="transaction-detail" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="withdraw" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="privacy" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="appearance" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="dividends" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="guarantor-inbox" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="notifications" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="profile" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="settings" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="discover/[slug]" options={{ href: null, tabBarButton: () => null }} />
        <Tabs.Screen name="discover/[slug]/apply" options={{ href: null, tabBarButton: () => null }} />
      </Tabs>
    </SafeAreaView>
  )
}

function TabIcon({ icon, color, focused }: { icon: IconName; color: string; focused: boolean }) {
  const { colors: c } = useTheme()
  return (
    <View style={{
      width: 28,
      height: 30,
      borderRadius: 8,
      backgroundColor: focused ? c.accentSoft : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Icon name={icon} size={18} color={color} />
    </View>
  )
}

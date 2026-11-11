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
            signal, and also what hides the bottom-tab-bar button for a
            screen. It cannot be paired with a tabBarButton override - current
            expo-router throws a fatal "Cannot use `href` and `tabBarButton`
            together" render error if both are set, which crashed the app on
            launch. href: null alone is the correct and only supported fix. */}
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
        <Tabs.Screen name="appearance" options={{ href: null }} />
        <Tabs.Screen name="dividends" options={{ href: null }} />
        <Tabs.Screen name="guarantor-inbox" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]/apply" options={{ href: null }} />
        {/* These 19 were never given a Tabs.Screen entry at all. Expo Router's
            Tabs navigator auto-registers every file in this directory as a
            tab unless told otherwise, so each one was rendering as a real,
            unlabeled, icon-less tab button - the row of "dots" below the
            4 real tabs. */}
        <Tabs.Screen name="how-to-pay" options={{ href: null }} />
        <Tabs.Screen name="share-transfer-respond" options={{ href: null }} />
        <Tabs.Screen name="deposit-protection" options={{ href: null }} />
        <Tabs.Screen name="assistant" options={{ href: null }} />
        <Tabs.Screen name="ussd-pin" options={{ href: null }} />
        <Tabs.Screen name="ufaa-guidance" options={{ href: null }} />
        <Tabs.Screen name="governance/recall" options={{ href: null }} />
        <Tabs.Screen name="transfer" options={{ href: null }} />
        <Tabs.Screen name="loan-offer" options={{ href: null }} />
        <Tabs.Screen name="governance/meeting-checkin" options={{ href: null }} />
        <Tabs.Screen name="governance/election" options={{ href: null }} />
        <Tabs.Screen name="listing-dispute" options={{ href: null }} />
        <Tabs.Screen name="credit-score" options={{ href: null }} />
        <Tabs.Screen name="repayment-passport" options={{ href: null }} />
        <Tabs.Screen name="guarantor-substitute" options={{ href: null }} />
        <Tabs.Screen name="guarantor-reconsent" options={{ href: null }} />
        <Tabs.Screen name="guarantor-respond" options={{ href: null }} />
        <Tabs.Screen name="activity" options={{ href: null }} />
        <Tabs.Screen name="standing-orders" options={{ href: null }} />
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

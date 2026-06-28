import { SafeAreaView } from 'react-native-safe-area-context'
import { Tabs } from 'expo-router'
import { Text, View } from 'react-native'

const VIOLET = '#6D28D9'

export default function MemberTabLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: VIOLET,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: { 
            borderTopColor: '#e5e7eb',
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 6,
            height: 65,
            backgroundColor: '#fff',
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
            tabBarIcon: ({ color, focused }) => <TabIcon icon="🏠" color={color} focused={focused} /> 
          }} 
        />
        <Tabs.Screen 
          name="services" 
          options={{ 
            title: 'Services', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="⚡" color={color} focused={focused} /> 
          }} 
        />
        <Tabs.Screen 
          name="discover" 
          options={{ 
            title: 'Discover', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="🔍" color={color} focused={focused} /> 
          }} 
        />
        <Tabs.Screen 
          name="menu" 
          options={{ 
            title: 'Menu', 
            tabBarIcon: ({ color, focused }) => <TabIcon icon="☰" color={color} focused={focused} /> 
          }} 
        />
        <Tabs.Screen name="approved-dashboard" options={{ href: null }} />
        <Tabs.Screen name="empty-dashboard" options={{ href: null }} />
        <Tabs.Screen name="pending-dashboard" options={{ href: null }} />
        <Tabs.Screen name="unified-potfolio-dashbord" options={{ href: null }} />
        <Tabs.Screen name="discover-browse" options={{ href: null }} />
        <Tabs.Screen name="guarantor-request" options={{ href: null }} />
        <Tabs.Screen name="loan-repayment" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]" options={{ href: null }} />
        <Tabs.Screen name="discover/[slug]/apply" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  )
}

//{quick actions on the home tab}


function TabIcon({ icon, color, focused }: { icon: string; color: string; focused: boolean }) {
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
      <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: -4,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: VIOLET,
        }} />
      )}
    </View>
  )
}

import { Tabs } from 'expo-router'
import { ClipboardList, MessageCircle, Store, UtensilsCrossed } from 'lucide-react-native'
import { fonts, useTheme } from '@/shared/ui'

export default function SellerTabsLayout() {
  const theme = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.divider },
        tabBarLabelStyle: { fontFamily: fonts.medium },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Đơn hàng', tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Thực đơn', tabBarIcon: ({ color }) => <UtensilsCrossed color={color} size={22} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Cửa hàng', tabBarIcon: ({ color }) => <Store color={color} size={22} /> }} />
    </Tabs>
  )
}

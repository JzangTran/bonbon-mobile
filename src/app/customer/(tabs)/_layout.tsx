import { Tabs } from 'expo-router'
import { ClipboardList, House, MessageCircle, UserRound } from 'lucide-react-native'
import { fonts, useTheme } from '@/shared/ui'

export default function CustomerTabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng', tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={22} /> }} />
    </Tabs>
  )
}

import { Tabs } from 'expo-router'
import { ClipboardList, House, MessageCircle, UserRound, WalletCards } from 'lucide-react-native'
import { FloatingTabBar } from '@/shared/ui'

export default function CustomerTabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="payments" options={{ title: 'Thanh toán', tabBarIcon: ({ color }) => <WalletCards color={color} size={22} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Hoạt động', tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={22} /> }} />
    </Tabs>
  )
}

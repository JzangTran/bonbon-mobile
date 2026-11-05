import { Tabs, useRouter, type Href } from 'expo-router'
import { ClipboardList, House, MessageCircle, UserRound, WalletCards } from 'lucide-react-native'
import { useSession } from '@/entities/session'
import { afterSignIn } from '@/features/after-sign-in'
import { FloatingTabBar } from '@/shared/ui'

export default function CustomerTabsLayout() {
  const { session } = useSession()
  const router = useRouter()
  // Tabs that belong to an account: a guest stays where they are, and the sign-in sheet rises over it; signing in then opens the tab.
  const needsAccount = (href: Href) => ({
    tabPress: (event: { preventDefault: () => void }) => {
      if (session) return
      event.preventDefault()
      afterSignIn(href)
      router.push('/login')
    },
  })
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="payments" listeners={needsAccount('/customer/payments')} options={{ title: 'Thanh toán', tabBarIcon: ({ color }) => <WalletCards color={color} size={22} /> }} />
      <Tabs.Screen name="orders" listeners={needsAccount('/customer/orders')} options={{ title: 'Hoạt động', tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }} />
      <Tabs.Screen name="messages" listeners={needsAccount('/customer/messages')} options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="account" listeners={needsAccount('/customer/account')} options={{ title: 'Tài khoản', tabBarIcon: ({ color }) => <UserRound color={color} size={22} /> }} />
    </Tabs>
  )
}

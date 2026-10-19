import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import { ClipboardList, MessageCircle, Store, UtensilsCrossed } from 'lucide-react-native'
import { OrderLiveProvider, useOrderLive } from '@/entities/order'
import { shopStatus, useShop } from '@/entities/shop'
import { registerForPush } from '@/features/push'
import ShopStatusScreen from '@/screens/seller/shop-status'
import { FloatingTabBar } from '@/shared/ui'

/** Until the shop is approved, the seller side shows its application status instead of the tabs (open-shop.md). */
export default function SellerTabsLayout() {
  const shop = useShop()
  if (shop.isPending) return null
  const status = shopStatus(shop.data)
  if (status !== 'APPROVED' && status !== 'CLOSING') return <ShopStatusScreen />
  return (
    <OrderLiveProvider>
      <SellerTabs closing={status === 'CLOSING'} />
    </OrderLiveProvider>
  )
}

/** A closing shop still works its orders, cases and earnings, but its menu can no longer be edited. */
function SellerTabs({ closing }: { closing: boolean }) {
  const { waiting } = useOrderLive()
  // The shop is approved: this is the moment with context to ask for notification permission.
  useEffect(() => {
    void registerForPush({ ask: true })
  }, [])
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Đơn hàng', tabBarBadge: waiting > 0 ? waiting : undefined, tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="menu"
        options={{ title: 'Thực đơn', href: closing ? null : undefined, tabBarIcon: ({ color }) => <UtensilsCrossed color={color} size={22} /> }}
      />
      {/* Screens on top of their tabs, not tabs of their own. */}
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="order-detail" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="reviews" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="order-cases" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="order-case" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="performance" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="earnings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="statistics" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dish-form" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="help" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="support" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="ticket" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notification-settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="messages" options={{ title: 'Tin nhắn', tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Cửa hàng', tabBarIcon: ({ color }) => <Store color={color} size={22} /> }} />
    </Tabs>
  )
}

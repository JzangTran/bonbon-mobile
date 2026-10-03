import { Tabs } from 'expo-router'
import { ClipboardList, MessageCircle, Store, UtensilsCrossed } from 'lucide-react-native'
import { shopStatus, useShop } from '@/entities/shop'
import ShopStatusScreen from '@/screens/seller/shop-status'
import { fonts, useTheme } from '@/shared/ui'

/** Until the shop is approved, the seller side shows its application status instead of the tabs (open-shop.md). */
export default function SellerTabsLayout() {
  const theme = useTheme()
  const shop = useShop()
  if (shop.isPending) return null
  if (shopStatus(shop.data) !== 'APPROVED') return <ShopStatusScreen />
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

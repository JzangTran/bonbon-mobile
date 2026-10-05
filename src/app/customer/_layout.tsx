import { Stack } from 'expo-router'
import { CartProvider } from '@/entities/cart'
import { CustomerLiveProvider } from '@/entities/order'
import { fonts, useTheme } from '@/shared/ui'

/** Customer tabs, plus screens that open on top of them (addresses). */
export default function CustomerLayout() {
  const theme = useTheme()
  return (
    <CartProvider>
    <CustomerLiveProvider>
    <Stack
      screenOptions={{
        headerTintColor: theme.text,
        headerStyle: { backgroundColor: theme.surface },
        headerTitleStyle: { fontFamily: fonts.semibold },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="addresses" options={{ title: 'Địa chỉ giao hàng' }} />
      <Stack.Screen name="address-form" options={{ title: 'Địa chỉ' }} />
      <Stack.Screen name="vendor" options={{ title: 'Quán' }} />
      <Stack.Screen name="cart" options={{ title: 'Giỏ hàng' }} />
      <Stack.Screen name="order" options={{ title: 'Đơn hàng' }} />
    </Stack>
    </CustomerLiveProvider>
    </CartProvider>
  )
}

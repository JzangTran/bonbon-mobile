import { Stack } from 'expo-router'
import { CartProvider } from '@/entities/cart'
import { CustomerLiveProvider } from '@/entities/order'
import { fonts, useTheme } from '@/shared/ui'

/** Customer tabs, plus screens that open on top of them (addresses). Guests browse here too, before signing in. */
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
      <Stack.Screen name="pick-location" options={{ title: 'Nhập địa chỉ' }} />
      <Stack.Screen name="favorites" options={{ title: 'Quán yêu thích' }} />
      <Stack.Screen name="become-seller" options={{ title: 'Đăng ký bán hàng' }} />
      <Stack.Screen name="deals" options={{ title: 'Deal HOT' }} />
      <Stack.Screen name="search" options={{ title: 'Tìm món', headerShown: false }} />
      {/* A page that slides up rather than a modal: a page pushed from a modal on iOS opens behind it. */}
      <Stack.Screen name="delivery-address" options={{ title: 'Địa chỉ giao hàng', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="place" options={{ title: 'Địa điểm', headerShown: false }} />
      <Stack.Screen name="save-place" options={{ title: 'Thêm vào Địa điểm đã lưu', headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Quét mã QR', headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
      {/* Cài đặt thanh toán and what opens from it slide up as full pages */}
      <Stack.Screen name="payment-settings" options={{ title: 'Cài đặt thanh toán', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payment-method" options={{ title: 'Chi tiết', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="link-payment-method" options={{ title: 'Thêm phương thức thanh toán', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payment-pin" options={{ title: 'Mã PIN', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payment-history" options={{ title: 'Tất cả giao dịch', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="payment-detail" options={{ title: 'Chi tiết giao dịch', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="vendor" options={{ title: 'Quán', headerShown: false }} />
      <Stack.Screen name="offers" options={{ title: 'Ưu đãi', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="offer" options={{ title: 'Chi tiết ưu đãi' }} />
      <Stack.Screen name="cart" options={{ title: 'Giỏ hàng' }} />
      <Stack.Screen name="order" options={{ title: 'Đơn hàng' }} />
      <Stack.Screen name="report-problem" options={{ title: 'Báo vấn đề' }} />
      <Stack.Screen name="notifications" options={{ title: 'Thông báo' }} />
      <Stack.Screen name="chat" options={{ title: 'Trò chuyện' }} />
      <Stack.Screen name="help" options={{ title: 'Trợ giúp' }} />
      <Stack.Screen name="support" options={{ title: 'Liên hệ hỗ trợ' }} />
      <Stack.Screen name="ticket" options={{ title: 'Phiếu hỗ trợ' }} />
      <Stack.Screen name="notification-settings" options={{ title: 'Cài đặt thông báo' }} />
    </Stack>
    </CustomerLiveProvider>
    </CartProvider>
  )
}

import { useSession } from '@/entities/session'
import OrdersScreen from '@/screens/customer/orders'
import { SignInPrompt } from '@/widgets/sign-in-prompt'

export default function OrdersTab() {
  const { session } = useSession()
  if (!session) return <SignInPrompt mascot="empty-orders" title="Đơn hàng của bạn" text="Đăng nhập để đặt món và theo dõi đơn từ lúc quán nhận tới lúc giao tới tay bạn." />
  return <OrdersScreen />
}

import { useSession } from '@/entities/session'
import PaymentsScreen from '@/screens/customer/payments'
import { SignInPrompt } from '@/widgets/sign-in-prompt'

export default function PaymentsTab() {
  const { session } = useSession()
  if (!session) return <SignInPrompt mascot="all-clear" title="Thanh toán" text="Đăng nhập để xem các khoản bạn đã trả cho đơn hàng và cách thanh toán trên bonbon." />
  return <PaymentsScreen />
}

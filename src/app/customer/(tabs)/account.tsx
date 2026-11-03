import { useSession } from '@/entities/session'
import AccountScreen from '@/screens/customer/account'
import { SignInPrompt } from '@/widgets/sign-in-prompt'

export default function AccountTab() {
  const { session } = useSession()
  if (!session) return <SignInPrompt mascot="all-clear" title="Tài khoản bonbon" text="Đăng nhập để lưu địa chỉ giao hàng, đặt món và nhận thông báo về đơn của bạn." />
  return <AccountScreen />
}

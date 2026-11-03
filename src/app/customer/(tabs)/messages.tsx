import { useSession } from '@/entities/session'
import MessagesScreen from '@/screens/customer/messages'
import { SignInPrompt } from '@/widgets/sign-in-prompt'

export default function MessagesTab() {
  const { session } = useSession()
  if (!session) return <SignInPrompt mascot="empty-chat" title="Nhắn tin với quán" text="Đăng nhập để hỏi quán về món, giờ mở cửa hay đơn của bạn." />
  return <MessagesScreen />
}

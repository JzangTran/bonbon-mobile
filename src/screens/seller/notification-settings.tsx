import { useRouter } from 'expo-router'
import { Screen } from '@/shared/ui'
import { NotificationSettings } from '@/widgets/notification-settings'

export default function SellerNotificationSettingsScreen() {
  const router = useRouter()
  return (
    <Screen title="Cài đặt thông báo" onBack={() => router.replace('/seller/shop')}>
      <NotificationSettings />
    </Screen>
  )
}

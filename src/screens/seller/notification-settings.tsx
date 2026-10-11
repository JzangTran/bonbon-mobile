import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button, Screen, Text } from '@/shared/ui'
import { NotificationSettings } from '@/widgets/notification-settings'

export default function SellerNotificationSettingsScreen() {
  const router = useRouter()
  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Cài đặt thông báo</Text>
      <NotificationSettings />
    </Screen>
  )
}

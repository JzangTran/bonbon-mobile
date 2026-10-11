import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button, Screen, Text } from '@/shared/ui'
import { TicketList } from '@/widgets/support-tickets'

export default function SellerSupportScreen() {
  const router = useRouter()
  return (
    <Screen>
      <View>
        <Button title="← Trợ giúp" variant="ghost" onPress={() => router.replace('/seller/help')} />
      </View>
      <Text variant="headline">Liên hệ hỗ trợ</Text>
      <TicketList onOpen={(id) => router.push({ pathname: '/seller/ticket', params: { id } })} />
    </Screen>
  )
}

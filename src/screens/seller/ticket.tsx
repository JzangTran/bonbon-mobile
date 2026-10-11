import { useLocalSearchParams, useRouter } from 'expo-router'
import { View } from 'react-native'
import { Button, Screen } from '@/shared/ui'
import { TicketThread } from '@/widgets/support-tickets'

export default function SellerTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  return (
    <Screen>
      <View>
        <Button title="← Phiếu hỗ trợ" variant="ghost" onPress={() => router.replace('/seller/support')} />
      </View>
      <TicketThread id={id} />
    </Screen>
  )
}

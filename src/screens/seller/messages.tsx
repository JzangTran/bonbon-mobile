import { useRouter } from 'expo-router'
import { useOrderLive } from '@/entities/order'
import { Screen, Text } from '@/shared/ui'
import { ConversationList } from '@/widgets/conversation-list'

/** The customers who wrote to this shop, newest first (view-conversation-list.md). */
export default function SellerMessagesScreen() {
  const router = useRouter()
  const live = useOrderLive().state === 'live'
  return (
    <Screen>
      <Text variant="headline">Tin nhắn</Text>
      <ConversationList side="shop" live={live} onOpen={(c) => router.push({ pathname: '/seller/chat', params: { c: c.id } })} />
    </Screen>
  )
}

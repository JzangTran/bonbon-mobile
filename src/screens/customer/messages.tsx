import { useRouter } from 'expo-router'
import { useCustomerLive } from '@/entities/order'
import { Screen, Text } from '@/shared/ui'
import { ConversationList } from '@/widgets/conversation-list'

/** The shops this customer has written to, newest first (view-conversation-list.md). */
export default function CustomerMessagesScreen() {
  const router = useRouter()
  const live = useCustomerLive() === 'live'
  return (
    <Screen>
      <Text variant="headline">Tin nhắn</Text>
      <ConversationList side="customer" live={live} onOpen={(c) => router.push({ pathname: '/customer/chat', params: { c: c.id } })} />
    </Screen>
  )
}

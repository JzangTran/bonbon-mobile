import { useLocalSearchParams, useRouter } from 'expo-router'
import { View } from 'react-native'
import { useOrderLive } from '@/entities/order'
import { Button, spacing } from '@/shared/ui'
import { ChatThread } from '@/widgets/chat-thread'

/** One conversation with a customer; the customer only ever sees "the shop". */
export default function SellerChatScreen() {
  const { c } = useLocalSearchParams<{ c: string }>()
  const router = useRouter()
  const live = useOrderLive().state === 'live'
  return (
    <ChatThread
      conversationId={c}
      live={live}
      topInset
      header={
        <View style={{ paddingHorizontal: spacing.sm, alignItems: 'flex-start' }}>
          <Button title="← Tin nhắn" variant="ghost" onPress={() => router.replace('/seller/messages')} />
        </View>
      }
    />
  )
}

import { useLocalSearchParams } from 'expo-router'
import { useCustomerLive } from '@/entities/order'
import { ChatThread } from '@/widgets/chat-thread'

/** One conversation with a shop. Opened from the list ({@code c}) or from a shop's page ({@code vendorId}), where it may not exist yet. */
export default function CustomerChatScreen() {
  const { c, vendorId } = useLocalSearchParams<{ c?: string; vendorId?: string }>()
  const live = useCustomerLive() === 'live'
  return <ChatThread conversationId={c} vendorId={vendorId} live={live} />
}

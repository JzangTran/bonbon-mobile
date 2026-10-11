import { Pressable, StyleSheet, View } from 'react-native'
import { useConversations, type Conversation } from '@/entities/chat'
import { problemMessage } from '@/shared/api'
import { formatAgo } from '@/shared/lib/format'
import { Card, Notice, Text, spacing, useTheme } from '@/shared/ui'

/**
 * The conversations of the person or shop in use, newest first, with the last message and an unread dot
 * (view-conversation-list.md). {@code side} says whose name to show: the shop's for a customer, the customer's for a shop.
 */
export function ConversationList({ side, live, onOpen }: { side: 'customer' | 'shop'; live: boolean; onOpen: (conversation: Conversation) => void }) {
  const theme = useTheme()
  const conversations = useConversations(live)
  const items = conversations.data?.items ?? []

  return (
    <View style={styles.list}>
      {conversations.isError ? <Notice tone="error" message={problemMessage(conversations.error, 'Không tải được tin nhắn lúc này.')} /> : null}
      {conversations.data && items.length === 0 ? (
        <Card>
          <Text muted>{side === 'customer' ? 'Bạn chưa nhắn tin với quán nào. Mở một quán và chọn Nhắn tin để hỏi trực tiếp.' : 'Chưa có khách nào nhắn tin.'}</Text>
        </Card>
      ) : null}
      {items.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Mở trò chuyện với ${side === 'customer' ? c.shopName : c.customerName}`} onPress={() => onOpen(c)}>
          <Card>
            <View style={styles.row}>
              <Text variant="titleSm" style={styles.flex} numberOfLines={1}>
                {side === 'customer' ? c.shopName : c.customerName}
              </Text>
              <Text variant="caption" muted>
                {formatAgo(c.lastMessage?.sentAt)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text variant="bodySm" muted={!c.unread} style={styles.flex} numberOfLines={1}>
                {c.lastMessage?.sender === (side === 'customer' ? 'CUSTOMER' : 'SHOP') ? 'Bạn: ' : ''}
                {c.lastMessage?.text || (c.lastMessage?.hasImage ? 'Đã gửi một ảnh' : '')}
              </Text>
              {c.unread ? <View accessibilityLabel="Chưa đọc" style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
})

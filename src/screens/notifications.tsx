import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAcknowledge, useNotifications, type NotificationItem } from '@/entities/notification'
import { problemMessage } from '@/shared/api'
import { formatAgo } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'

/**
 * The stored notification list (notifications.md): unread ones stand out, tapping one acknowledges it and opens its
 * order. The same list backs the push, so a push missed with the app closed is still here.
 */
export function NotificationsScreen({ audience }: { audience: 'customer' | 'seller' }) {
  const router = useRouter()
  const theme = useTheme()
  const list = useNotifications()
  const acknowledge = useAcknowledge()
  const items = list.data?.items ?? []

  const open = (item: NotificationItem) => {
    if (!item.acknowledgedAt) acknowledge.mutate(item.id!)
    if (!item.orderId) return
    if (audience === 'seller') router.push({ pathname: '/seller/order-detail', params: { id: item.orderId } })
    else router.push({ pathname: '/customer/order', params: { id: item.orderId } })
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="headline" style={styles.flex}>
          Thông báo
        </Text>
        {(list.data?.unread ?? 0) > 0 ? <Button title="Đọc hết" variant="ghost" loading={acknowledge.isPending} onPress={() => acknowledge.mutate('all')} /> : null}
      </View>
      {list.isError ? <Notice tone="error" message={problemMessage(list.error)} /> : null}
      {list.data && items.length === 0 ? (
        <Card>
          <Text variant="titleSm">Chưa có thông báo nào</Text>
          <Text muted>{audience === 'seller' ? 'Đơn mới và thay đổi của đơn hàng sẽ hiện ở đây.' : 'Cập nhật về đơn hàng của bạn sẽ hiện ở đây.'}</Text>
        </Card>
      ) : null}
      {items.map((item) => {
        const unread = !item.acknowledgedAt
        return (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${unread ? 'Chưa đọc. ' : ''}${item.title}`} onPress={() => open(item)}>
            <Card style={unread ? { borderLeftWidth: 4, borderLeftColor: theme.primary } : undefined}>
              <View style={styles.row}>
                <Text variant="titleSm" style={styles.flex}>
                  {item.title}
                </Text>
                <Text variant="caption" muted>
                  {formatAgo(item.createdAt)}
                </Text>
              </View>
              <Text variant="bodySm" muted={!unread}>
                {item.body}
              </Text>
            </Card>
          </Pressable>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
})

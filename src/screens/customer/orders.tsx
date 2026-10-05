import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ACTIVE_STATUSES, OrderStatusBadge, PAST_STATUSES, useCustomerLive, useMyOrders, type OrderStatus, type OrderSummary } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { formatAgo, formatVnd } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

type Tab = 'active' | 'past'

/** The customer's orders: what is on its way first, then history (view-order-history.md), updated live. */
export default function CustomerOrdersScreen() {
  const theme = useTheme()
  const live = useCustomerLive() === 'live'
  const [tab, setTab] = useState<Tab>('active')
  const [page, setPage] = useState(0)
  const active = useMyOrders(ACTIVE_STATUSES, live)
  const past = useMyOrders(PAST_STATUSES, live, page)
  const query = tab === 'active' ? active : past
  const total = past.data?.total ?? 0

  return (
    <Screen>
      <Text variant="headline">Đơn hàng</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        {(
          [
            { id: 'active', label: 'Đang diễn ra', count: active.data?.total ?? 0 },
            { id: 'past', label: 'Đã xong', count: 0 },
          ] as { id: Tab; label: string; count: number }[]
        ).map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={[styles.tab, { borderColor: tab === t.id ? theme.primary : theme.borderInput, backgroundColor: tab === t.id ? theme.primarySubtle : theme.surface }]}
          >
            <Text variant="bodySm" color={tab === t.id ? theme.onPrimarySubtle : theme.text}>
              {t.label}
              {t.count > 0 ? `  ${t.count}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      {query.isError ? <Notice tone="error" message={problemMessage(query.error)} /> : null}
      {query.data && (query.data.items ?? []).length === 0 ? (
        <Card>
          <Text variant="titleSm">{tab === 'active' ? 'Chưa có đơn nào đang diễn ra' : 'Chưa có đơn nào đã xong'}</Text>
          <Text muted>{tab === 'active' ? 'Chọn quán trong khu và đặt món đầu tiên của bạn.' : 'Các đơn đã giao, bị huỷ hoặc bị từ chối sẽ hiện ở đây.'}</Text>
        </Card>
      ) : null}
      {(query.data?.items ?? []).map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {tab === 'past' && total > 20 ? (
        <View style={styles.paging}>
          <Button title="Trang trước" variant="outline" disabled={page === 0} onPress={() => setPage((p) => p - 1)} />
          <Text variant="bodySm" muted>
            {page + 1}/{Math.ceil(total / 20)}
          </Text>
          <Button title="Trang sau" variant="outline" disabled={(page + 1) * 20 >= total} onPress={() => setPage((p) => p + 1)} />
        </View>
      ) : null}
    </Screen>
  )
}

function OrderCard({ order }: { order: OrderSummary }) {
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở đơn ${order.number} của ${order.shopName}`}
      onPress={() => router.push({ pathname: '/customer/order', params: { id: order.id } })}
    >
      <Card>
        <View style={styles.row}>
          <Text variant="titleSm" style={styles.flex} numberOfLines={1}>
            {order.shopName}
          </Text>
          <Text variant="titleSm" style={styles.money}>
            {formatVnd(order.grandTotal)}
          </Text>
        </View>
        <View style={styles.row}>
          <OrderStatusBadge status={order.status as OrderStatus} />
          <Text variant="caption" muted>
            #{order.number} · {formatAgo(order.placedAt)}
          </Text>
        </View>
        <Text variant="bodySm" muted numberOfLines={2}>
          {order.itemsPreview}
        </Text>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: touchTarget.min, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  money: { fontVariant: ['tabular-nums'] },
  paging: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})

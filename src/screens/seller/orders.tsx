import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
  OrderStatusBadge,
  useOrderLive,
  useShopOrders,
  type OrderStatus,
  type ShopOrderSummary,
} from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { countdown, useNow } from '@/shared/lib/countdown'
import { formatAgo, formatVnd } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'
import { OrderActions } from './order-actions'

type Tab = 'new' | 'progress' | 'history'

const IN_PROGRESS: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
const FINISHED: OrderStatus[] = ['DELIVERED', 'REJECTED', 'CANCELLED', 'NOT_DELIVERED']

/** The shop's orders on the phone: new orders first with the big "Nhận đơn" button, then what is in the kitchen, then history. */
export default function SellerOrdersScreen() {
  const theme = useTheme()
  const { state, waiting } = useOrderLive()
  const live = state === 'live'
  const [tab, setTab] = useState<Tab>('new')
  const [page, setPage] = useState(0)

  const fresh = useShopOrders(['PLACED'], true, live)
  const progress = useShopOrders(IN_PROGRESS, true, live)
  const history = useShopOrders(FINISHED, false, live, page)
  const query = tab === 'new' ? fresh : tab === 'progress' ? progress : history

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'new', label: 'Mới', count: waiting },
    { id: 'progress', label: 'Đang làm', count: progress.data?.total ?? 0 },
    { id: 'history', label: 'Lịch sử', count: 0 },
  ]
  const total = history.data?.total ?? 0

  return (
    <Screen>
      <Text variant="headline">Đơn hàng</Text>
      {state === 'offline' ? <Notice tone="error" message="Mất kết nối trực tiếp, đang tự tải lại mỗi 10 giây." /> : null}
      {waiting > 0 && tab !== 'new' ? (
        <Pressable accessibilityRole="button" onPress={() => setTab('new')} style={[styles.banner, { backgroundColor: theme.infoSubtle }]}>
          <Text variant="titleSm" color={theme.onInfoSubtle}>
            Có {waiting} đơn mới chờ bạn nhận
          </Text>
          <Text variant="bodySm" color={theme.onInfoSubtle}>
            Bấm để xem
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={[
              styles.tab,
              { borderColor: tab === t.id ? theme.primary : theme.borderInput, backgroundColor: tab === t.id ? theme.primarySubtle : theme.surface },
            ]}
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
          <Text muted>
            {tab === 'new'
              ? 'Chưa có đơn mới. Đơn mới sẽ hiện ở đây ngay khi khách đặt.'
              : tab === 'progress'
                ? 'Không có đơn nào đang làm.'
                : 'Chưa có đơn nào đã hoàn tất.'}
          </Text>
        </Card>
      ) : null}
      {(query.data?.items ?? []).map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
      {tab === 'history' && total > 20 ? (
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

function OrderCard({ order }: { order: ShopOrderSummary }) {
  const router = useRouter()
  const theme = useTheme()
  const now = useNow()
  const status = order.status as OrderStatus
  const response = countdown(order.responseDeadline, now)
  const handover = countdown(order.handoverDeadline, now)
  const deadline = response ?? handover
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở đơn ${order.number}`}
        onPress={() => router.push({ pathname: '/seller/order-detail', params: { id: order.id } })}
        style={styles.cardMain}
      >
        <View style={styles.row}>
          <Text variant="titleSm" style={styles.number}>
            #{order.number}
          </Text>
          <OrderStatusBadge status={status} />
          <Text variant="caption" muted style={styles.flex}>
            {formatAgo(order.placedAt, now)}
          </Text>
          <Text variant="titleSm" style={styles.number}>
            {formatVnd(order.grandTotal)}
          </Text>
        </View>
        <Text variant="body">{order.customerName}</Text>
        <Text variant="bodySm" muted numberOfLines={2}>
          {order.itemsPreview}
        </Text>
        {deadline ? (
          <Text variant="bodySm" color={deadline.urgent ? theme.danger : theme.textMuted} style={styles.number}>
            {response ? `Còn ${deadline.text} để trả lời` : `Hạn giao đi ${deadline.text}`}
          </Text>
        ) : null}
      </Pressable>
      <OrderActions id={order.id!} status={status} />
    </Card>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: touchTarget.min, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { padding: spacing.lg, borderRadius: radius.sm, gap: spacing.xs },
  cardMain: { gap: spacing.xs, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  number: { fontVariant: ['tabular-nums'] },
  paging: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})

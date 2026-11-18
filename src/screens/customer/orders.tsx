import { useRouter } from 'expo-router'
import { ReceiptText, UtensilsCrossed } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ACTIVE_STATUSES, OrderStatusBadge, PAST_STATUSES, useCustomerLive, useMyOrders, type OrderStatus, type OrderSummary } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { formatAgo, formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, CardListSkeleton, EmptyState, Notice, Screen, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const UNSUCCESSFUL: Record<string, string> = { CANCELLED: 'Đã huỷ', REJECTED: 'Quán từ chối', NOT_DELIVERED: 'Không giao được' }

/**
 * "Hoạt động" (view-order-history.md), updated live: what is on its way first, as cards with their status, then every past order
 * as a plain row (shop, what was in it, when, how much), the way the big delivery apps list activity. An order that did not go
 * through says so above the shop name.
 */
export default function CustomerOrdersScreen() {
  const theme = useTheme()
  const router = useRouter()
  const live = useCustomerLive() === 'live'
  const [page, setPage] = useState(0)
  const active = useMyOrders(ACTIVE_STATUSES, live)
  const past = useMyOrders(PAST_STATUSES, live, page)
  const total = past.data?.total ?? 0
  const activeItems = active.data?.items ?? []
  const pastItems = past.data?.items ?? []
  const nothing = active.data && past.data && activeItems.length === 0 && total === 0

  return (
    <Screen>
      <View style={styles.head}>
        <Text variant="headline" style={[styles.flex, styles.bold]} accessibilityRole="header">
          Hoạt động
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/customer/payment-history')}
          style={[styles.headPill, { backgroundColor: theme.primarySubtle }]}
        >
          <ReceiptText size={16} color={theme.onPrimarySubtle} />
          <Text variant="bodySm" color={theme.onPrimarySubtle} style={styles.semi}>
            Giao dịch
          </Text>
        </Pressable>
      </View>

      {active.isError || past.isError ? <Notice tone="error" message={problemMessage(active.error ?? past.error)} /> : null}
      {active.isLoading || past.isLoading ? <CardListSkeleton badge /> : null}
      {nothing ? <EmptyState mascot="empty-orders" title="Chưa có đơn nào" hint="Chọn quán trong khu và đặt món đầu tiên của bạn." /> : null}

      {activeItems.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title" style={styles.bold} accessibilityRole="header">
            Đang diễn ra
          </Text>
          {activeItems.map((order) => (
            <ActiveCard key={order.id} order={order} />
          ))}
        </View>
      ) : null}

      {pastItems.length > 0 ? (
        <View style={styles.section}>
          <Text variant="title" style={styles.bold} accessibilityRole="header">
            Gần đây
          </Text>
          <View>
            {pastItems.map((order) => (
              <PastRow key={order.id} order={order} />
            ))}
          </View>
          {total > 20 ? (
            <View style={styles.paging}>
              <Button title="Mới hơn" variant="outline" disabled={page === 0} onPress={() => setPage((p) => p - 1)} />
              <Text variant="bodySm" muted>
                {page + 1}/{Math.ceil(total / 20)}
              </Text>
              <Button title="Cũ hơn" variant="outline" disabled={(page + 1) * 20 >= total} onPress={() => setPage((p) => p + 1)} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Screen>
  )
}

function Thumb() {
  const theme = useTheme()
  return (
    <View style={[styles.thumb, { backgroundColor: theme.primarySubtle }]}>
      <UtensilsCrossed size={22} color={theme.onPrimarySubtle} strokeWidth={1.75} />
    </View>
  )
}

/** An order still under way: a card with its status, so it stands out from the history below. */
function ActiveCard({ order }: { order: OrderSummary }) {
  const theme = useTheme()
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở đơn ${order.number} của ${order.shopName}`}
      onPress={() => router.push({ pathname: '/customer/order', params: { id: order.id } })}
      style={({ pressed }) => [styles.active, { borderColor: theme.border, backgroundColor: pressed ? theme.surfaceMuted : theme.surface }]}
    >
      <Thumb />
      <View style={[styles.flex, styles.lines]}>
        <Text style={styles.bold} numberOfLines={1}>
          {order.shopName}
        </Text>
        <Text variant="bodySm" muted numberOfLines={1}>
          {order.itemsPreview}
        </Text>
        <View style={styles.badgeRow}>
          <OrderStatusBadge status={order.status as OrderStatus} />
          <Text variant="caption" muted>
            {formatAgo(order.placedAt)}
          </Text>
        </View>
      </View>
      <Text style={[styles.bold, styles.money]}>{formatVnd(order.grandTotal)}</Text>
    </Pressable>
  )
}

/** A finished order: shop, contents, date and amount; one that did not go through is marked in red. */
function PastRow({ order }: { order: OrderSummary }) {
  const theme = useTheme()
  const router = useRouter()
  const failed = UNSUCCESSFUL[order.status ?? '']
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${failed ? `${failed}. ` : ''}Đơn ${order.number} của ${order.shopName}, ${formatVnd(order.grandTotal)}`}
      onPress={() => router.push({ pathname: '/customer/order', params: { id: order.id } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
    >
      <Thumb />
      <View style={[styles.flex, styles.lines]}>
        {failed ? (
          <Text variant="bodySm" color={theme.danger} style={styles.semi}>
            {failed}
          </Text>
        ) : null}
        <Text style={styles.bold} numberOfLines={1}>
          {order.shopName}
        </Text>
        <Text variant="bodySm" muted numberOfLines={1}>
          {order.itemsPreview}
        </Text>
        <Text variant="bodySm" muted>
          {formatDateTime(order.placedAt)}
        </Text>
      </View>
      {failed ? null : <Text style={[styles.semi, styles.money]}>{formatVnd(order.grandTotal)}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  section: { gap: spacing.sm },
  active: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md, minHeight: touchTarget.large, borderRadius: radius.md },
  thumb: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  lines: { gap: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' },
  money: { fontVariant: ['tabular-nums'] },
  paging: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  semi: { fontFamily: fonts.semibold },
})

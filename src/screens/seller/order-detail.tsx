import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { OrderStatusBadge, useOrderLive, useShopOrder, type OrderStatus } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { countdown, useNow } from '@/shared/lib/countdown'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'
import { NoShowCard } from './no-show'
import { OrderActions } from './order-actions'

const ACTORS: Record<string, string> = { CUSTOMER: 'Khách', SHOP: 'Quán', SYSTEM: 'Hệ thống', ADMIN: 'Quản trị' }
const STEP_LABELS: Record<string, string> = {
  PLACED: 'Khách đặt đơn',
  CONFIRMED: 'Quán nhận đơn',
  PREPARING: 'Đang chuẩn bị',
  OUT_FOR_DELIVERY: 'Đang giao',
  DELIVERED: 'Đã giao',
  REJECTED: 'Quán từ chối',
  CANCELLED: 'Đã huỷ',
  NOT_DELIVERED: 'Giao không thành công',
}

/** One order in full (view-order-detail.md): contact, items with options and notes, totals, timeline and its actions. */
export default function SellerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const now = useNow()
  const { state } = useOrderLive()
  const order = useShopOrder(id, state === 'live')
  const data = order.data
  const status = data?.status as OrderStatus | undefined
  const response = countdown(data?.responseDeadline, now)
  const handover = countdown(data?.handoverDeadline, now)

  return (
    <Screen>
      <View style={styles.header}>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller')} />
      </View>
      {order.isError ? <Notice tone="error" message={problemMessage(order.error, 'Không tìm thấy đơn hàng này.')} /> : null}
      {data && status ? (
        <>
          <Text variant="headline">Đơn #{data.number}</Text>
          <Text variant="bodySm" muted>
            Đặt lúc {formatDateTime(data.placedAt)}
          </Text>
          <View style={styles.row}>
            <OrderStatusBadge status={status} />
            {response ? (
              <Text variant="bodySm" color={response.urgent ? theme.danger : theme.textMuted}>
                Còn {response.text} để trả lời
              </Text>
            ) : null}
            {handover ? (
              <Text variant="bodySm" color={handover.urgent ? theme.danger : theme.textMuted}>
                Hạn giao đi {handover.text}
              </Text>
            ) : null}
          </View>

          <OrderActions id={data.id!} status={status} />
          {status === 'OUT_FOR_DELIVERY' ? <NoShowCard orderId={data.id!} /> : null}

          <Card>
            <Text variant="titleSm">Khách</Text>
            <Text>{data.customerName}</Text>
            {data.contactMasked ? (
              <Text muted>{data.customerPhone}</Text>
            ) : (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(`tel:${data.customerPhone}`)}>
                <Text color={theme.primary}>{data.customerPhone}</Text>
              </Pressable>
            )}
            <Text variant="bodySm" muted>
              {data.deliveryAddress}
            </Text>
            {data.note ? (
              <View style={[styles.note, { backgroundColor: theme.highlightSubtle }]}>
                <Text variant="bodySm" color={theme.onHighlightSubtle}>
                  Ghi chú giao hàng: {data.note}
                </Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text variant="titleSm">Món</Text>
            {(data.items ?? []).map((line, index) => (
              <View key={index} style={[styles.line, { borderTopColor: theme.divider }]}>
                <Text style={styles.qty}>{line.quantity}×</Text>
                <View style={styles.flex}>
                  <Text>{line.name}</Text>
                  {(line.options ?? []).length > 0 ? (
                    <Text variant="bodySm" muted>
                      {(line.options ?? []).map((o) => o.name).join(', ')}
                    </Text>
                  ) : null}
                  {line.note ? (
                    <Text variant="bodySm" color={theme.onHighlightSubtle}>
                      Ghi chú: {line.note}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.qty}>{formatVnd(line.lineTotal)}</Text>
              </View>
            ))}
            <View style={styles.totals}>
              <Text variant="bodySm" muted>
                Tiền món {formatVnd(data.totals?.itemsTotal)} · Phí giao {formatVnd(data.totals?.deliveryFee)}
              </Text>
              <Text variant="titleSm" style={styles.qty}>
                Khách trả {formatVnd(data.totals?.grandTotal)}
              </Text>
              <Text variant="bodySm" muted>
                {data.paymentMethod === 'COD' ? 'Thu tiền mặt khi giao' : 'Thanh toán online'} · {data.paymentStatus === 'PAID' ? 'đã thu tiền' : 'chưa thu'}
              </Text>
            </View>
          </Card>

          <Card>
            <Text variant="titleSm">Lịch sử đơn</Text>
            {(data.timeline ?? []).map((step, index) => (
              <View key={index}>
                <Text variant="bodySm">
                  {STEP_LABELS[step.to ?? ''] ?? step.to}
                  <Text variant="bodySm" muted>
                    {' '}
                    · {ACTORS[step.by ?? ''] ?? step.by} · {formatDateTime(step.at)}
                  </Text>
                </Text>
                {step.reason ? (
                  <Text variant="caption" muted>
                    Lý do: {step.reason}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1 },
  line: { flexDirection: 'row', gap: spacing.md, borderTopWidth: 1, paddingTop: spacing.sm },
  qty: { fontVariant: ['tabular-nums'] },
  totals: { gap: spacing.xs, alignItems: 'flex-end' },
  note: { padding: spacing.md, borderRadius: 4 },
})

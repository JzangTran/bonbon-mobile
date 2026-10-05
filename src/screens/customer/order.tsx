import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useCart } from '@/entities/cart'
import { OrderStatusBadge, useCustomerLive, useCustomerOrderAction, useMyOrder, type OrderStatus } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, Card, Notice, Screen, Text, fonts, spacing, useTheme, useToast } from '@/shared/ui'
import { reorder } from './reorder'

const ACTORS: Record<string, string> = { CUSTOMER: 'Bạn', SHOP: 'Quán', SYSTEM: 'Hệ thống', ADMIN: 'Quản trị' }
/** The exact status names of the order state machine, in the timeline (design principle 2). */
const STEP_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PLACED: 'Chờ quán xác nhận',
  CONFIRMED: 'Quán đã nhận đơn',
  PREPARING: 'Đang chuẩn bị',
  OUT_FOR_DELIVERY: 'Đang giao',
  DELIVERED: 'Đã giao',
  REJECTED: 'Quán từ chối',
  CANCELLED: 'Đã huỷ',
  NOT_DELIVERED: 'Giao không thành công',
}
const CANCELLABLE: OrderStatus[] = ['PLACED', 'CONFIRMED']
const REORDERABLE: OrderStatus[] = ['DELIVERED', 'REJECTED', 'CANCELLED']

/** Follow one order (track-order.md): live status, timeline, cancel, confirm received, and reorder from a past one. */
export default function CustomerOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const toast = useToast()
  const cart = useCart()
  const live = useCustomerLive() === 'live'
  const order = useMyOrder(id, live)
  const action = useCustomerOrderAction(id)
  const [reordering, setReordering] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const data = order.data
  const status = data?.status as OrderStatus | undefined

  const askCancel = async () => {
    if (await confirm('Huỷ đơn này?', 'Bạn có thể huỷ miễn phí cho đến khi quán bắt đầu chuẩn bị.', 'Huỷ đơn')) {
      action.mutate('cancel', { onSuccess: () => toast.show('Đã huỷ đơn.') })
    }
  }

  const startReorder = async () => {
    if (!data) return
    setReordering(true)
    setNotice(null)
    try {
      const result = await reorder(data)
      if (!result) {
        setNotice('Không tải được thực đơn của quán lúc này. Hãy thử lại sau.')
        return
      }
      if (result.lines.length === 0) {
        setNotice(`Các món của đơn này hiện không còn bán${result.dropped.length ? `: ${result.dropped.join(', ')}` : ''}.`)
        return
      }
      if (cart.lines.length > 0 && cart.shop?.id !== result.shop.id) {
        const ok = await confirm('Bắt đầu giỏ hàng mới?', `Giỏ hàng đang có món của “${cart.shop?.name}”. Đặt lại sẽ xoá giỏ cũ.`, 'Xoá và đặt lại')
        if (!ok) return
      }
      cart.replaceAll(result.shop, result.lines)
      const warnings = [
        result.dropped.length ? `Đã bỏ vì không còn bán: ${result.dropped.join(', ')}.` : null,
        result.repriced.length ? `Giá đã đổi: ${result.repriced.join(', ')}.` : null,
        result.shopOpen ? null : 'Quán đang đóng cửa, bạn chưa đặt được lúc này.',
      ].filter(Boolean)
      if (warnings.length > 0) toast.show(warnings.join(' '), 'info')
      router.push('/customer/cart')
    } finally {
      setReordering(false)
    }
  }

  return (
    <Screen>
      {order.isError ? <Notice tone="error" message={problemMessage(order.error, 'Không tìm thấy đơn hàng này.')} /> : null}
      {data && status ? (
        <>
          <Text variant="headline">Đơn #{data.number}</Text>
          <Text muted>{data.shop?.name}</Text>
          <View style={styles.row}>
            <OrderStatusBadge status={status} />
            <Text variant="bodySm" muted>
              Đặt lúc {formatDateTime(data.placedAt)}
            </Text>
          </View>

          {CANCELLABLE.includes(status) ? (
            <Button title="Huỷ đơn" variant="outline" size="lg" fullWidth loading={action.isPending} onPress={() => void askCancel()} />
          ) : null}
          {status === 'OUT_FOR_DELIVERY' ? (
            <Button title="Đã nhận được món" size="lg" fullWidth loading={action.isPending} onPress={() => action.mutate('received', { onSuccess: () => toast.show('Cảm ơn bạn! Chúc bạn ngon miệng.') })} />
          ) : null}
          {REORDERABLE.includes(status) ? (
            <Button title="Đặt lại đơn này" size="lg" fullWidth loading={reordering} onPress={() => void startReorder()} />
          ) : null}
          <Notice tone="error" message={notice} />

          <Card>
            <Text variant="titleSm">Tiến trình</Text>
            {(data.timeline ?? []).map((step, index, all) => (
              <View key={index} style={styles.step}>
                <View style={[styles.dot, { backgroundColor: index === all.length - 1 ? theme.primary : theme.borderInput }]} />
                <View style={styles.flex}>
                  <Text variant="bodySm" style={index === all.length - 1 ? styles.current : undefined}>
                    {STEP_LABELS[step.to ?? ''] ?? step.to}
                  </Text>
                  <Text variant="caption" muted>
                    {ACTORS[step.by ?? ''] ?? step.by} · {formatDateTime(step.at)}
                  </Text>
                  {step.reason ? (
                    <Text variant="caption" muted>
                      Lý do: {step.reason}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Text variant="titleSm">Món đã đặt</Text>
            {(data.items ?? []).map((line, index) => (
              <View key={index} style={[styles.line, { borderTopColor: theme.divider }]}>
                <Text style={styles.money}>{line.quantity}×</Text>
                <View style={styles.flex}>
                  <Text>{line.name}</Text>
                  {(line.options ?? []).length > 0 ? (
                    <Text variant="bodySm" muted>
                      {(line.options ?? []).map((o) => o.name).join(', ')}
                    </Text>
                  ) : null}
                  {line.note ? (
                    <Text variant="bodySm" muted>
                      Ghi chú: {line.note}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.money}>{formatVnd(line.lineTotal)}</Text>
              </View>
            ))}
            <View style={styles.totals}>
              <Text variant="bodySm" muted>
                Tiền món {formatVnd(data.totals?.itemsTotal)} · Phí giao {formatVnd(data.totals?.deliveryFee)}
              </Text>
              <Text variant="titleSm" style={styles.money}>
                Tổng cộng {formatVnd(data.totals?.grandTotal)}
              </Text>
              <Text variant="bodySm" muted>
                {data.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng' : 'Thanh toán online'}
                {data.paymentStatus === 'PAID' ? ' · đã thanh toán' : ''}
              </Text>
            </View>
          </Card>

          <Card>
            <Text variant="titleSm">Giao đến</Text>
            <Text>{data.delivery?.name}</Text>
            <Text variant="bodySm" muted>
              {data.delivery?.phone}
            </Text>
            <Text variant="bodySm" muted>
              {data.delivery?.address}
            </Text>
            {data.delivery?.note ? (
              <Text variant="bodySm" muted>
                Ghi chú: {data.delivery.note}
              </Text>
            ) : null}
          </Card>
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1 },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  current: { fontFamily: fonts.semibold },
  line: { flexDirection: 'row', gap: spacing.md, borderTopWidth: 1, paddingTop: spacing.sm },
  money: { fontVariant: ['tabular-nums'] },
  totals: { gap: spacing.xs, alignItems: 'flex-end' },
})

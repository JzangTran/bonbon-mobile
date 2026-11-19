import { StyleSheet, View } from 'react-native'
import type { OrderStatus } from '@/entities/order'
import { formatDateTime } from '@/shared/lib/format'
import { Card, Text, radius, spacing, useTheme } from '@/shared/ui'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PLACED', label: 'Đặt đơn' },
  { key: 'CONFIRMED', label: 'Quán nhận' },
  { key: 'PREPARING', label: 'Chuẩn bị' },
  { key: 'OUT_FOR_DELIVERY', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
]

/** What is happening now and what comes next, per status (design v5: every state says what next). */
function copy(status: OrderStatus, address?: string, payBy?: string): { now: string; next: string; tone: 'accent' | 'success' | 'danger' } {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { now: 'Đơn đang chờ thanh toán', next: `Quán chỉ thấy đơn sau khi bạn thanh toán${payBy ? `; hạn chót ${payBy}` : ''}. Quá hạn, đơn tự huỷ và bạn không mất tiền.`, tone: 'accent' }
    case 'PLACED':
      return { now: 'Quán đang xem đơn của bạn', next: 'Quán xác nhận trong vài phút. Bạn có thể huỷ miễn phí cho tới khi quán bắt đầu chuẩn bị.', tone: 'accent' }
    case 'CONFIRMED':
      return { now: 'Quán đã nhận đơn', next: 'Quán sắp bắt đầu nấu. Bạn vẫn huỷ được cho tới khi quán bắt đầu chuẩn bị.', tone: 'accent' }
    case 'PREPARING':
      return { now: 'Quán đang chuẩn bị món', next: `Xong món, quán giao tới ${address ?? 'địa chỉ của bạn'}. Từ lúc này đơn không huỷ được nữa.`, tone: 'accent' }
    case 'OUT_FOR_DELIVERY':
      return { now: 'Món đang trên đường tới', next: 'Ra nhận món ở điểm giao, rồi bấm Đã nhận được món để quán biết.', tone: 'accent' }
    case 'DELIVERED':
      return { now: 'Đơn đã giao xong', next: 'Đánh giá quán để khách khác chọn món dễ hơn. Thiếu hay sai món thì báo vấn đề ngay bên dưới.', tone: 'success' }
    case 'CANCELLED':
      return { now: 'Đơn đã huỷ', next: 'Nếu bạn đã trả trước, bonbon hoàn tiền và báo bạn khi xong. Bạn có thể đặt lại đơn này.', tone: 'danger' }
    case 'REJECTED':
      return { now: 'Quán không nhận đơn này', next: 'Lý do nằm trong tiến trình bên dưới. Nếu bạn đã trả trước, bonbon hoàn tiền; bạn có thể đặt ở quán khác.', tone: 'danger' }
    case 'NOT_DELIVERED':
      return { now: 'Đơn chưa giao được', next: 'Xem trao đổi với quán bên dưới; cần giúp thì vào Tài khoản › Liên hệ hỗ trợ.', tone: 'danger' }
    default:
      return { now: '', next: '', tone: 'accent' }
  }
}

/**
 * The top of an order: where it is (five steps), what is happening now, and what comes next or what the customer can do. Ended
 * orders (cancelled, rejected, not delivered) show no steps, only what it means for them.
 */
export function OrderNow({ status, address, payExpiresAt }: { status: OrderStatus; address?: string; payExpiresAt?: string }) {
  const theme = useTheme()
  const { now, next, tone } = copy(status, address, payExpiresAt ? formatDateTime(payExpiresAt) : undefined)
  const reached = STEPS.findIndex((s) => s.key === status)
  const ended = ['CANCELLED', 'REJECTED', 'NOT_DELIVERED'].includes(status)
  const fill = tone === 'success' ? theme.success : tone === 'danger' ? theme.danger : theme.accent
  return (
    <Card>
      {!ended && status !== 'PENDING_PAYMENT' ? (
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`Bước ${reached + 1} trên ${STEPS.length}: ${STEPS[reached]?.label}`} style={styles.track}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={styles.segment}>
              <View style={[styles.bar, { backgroundColor: i <= reached ? fill : theme.surfaceStrong }]} />
              <Text variant="caption" tone={i === reached ? 'default' : 'tertiary'} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View accessibilityLiveRegion="polite" style={styles.copy}>
        <Text variant="title3" color={tone === 'danger' ? theme.onDangerSubtle : undefined}>
          {now}
        </Text>
        <Text tone="secondary">{next}</Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, gap: spacing.xs },
  bar: { height: 4, borderRadius: radius.full },
  copy: { gap: spacing.xs },
})

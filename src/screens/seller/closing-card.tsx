import { useRouter, type Href } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { CLOSE_REASON_LABEL, useShopClosure } from '@/entities/shop'
import { problemMessage } from '@/shared/api'
import { Button, Card, Notice, Text, spacing, useTheme } from '@/shared/ui'

const vnd = new Intl.NumberFormat('vi-VN')
const vnDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
const formatDate = (iso: string | undefined) => (iso ? vnDate.format(new Date(iso)) : '—')

/** A shop that asked to close: no new orders, what is under way finishes, and it becomes CLOSED once nothing is left (close-shop.md). */
export function ClosingCard() {
  const theme = useTheme()
  const closure = useShopClosure(true)
  const c = closure.data
  const b = c?.blockers
  return (
    <Card style={{ backgroundColor: theme.warningSubtle }}>
      <Text variant="titleSm" color={theme.onWarningSubtle}>
        Cửa hàng đang đóng
      </Text>
      <Text variant="bodySm" color={theme.onWarningSubtle}>
        Cửa hàng không còn hiện với khách và không nhận đơn mới. Đơn đang làm vẫn làm tiếp, và bạn vẫn xem được thu nhập. Cửa hàng tự đóng hẳn khi các việc dưới đây xong; đóng rồi không mở lại được.
      </Text>
      {closure.isError ? <Notice tone="error" message={problemMessage(closure.error)} /> : null}
      {c && b ? (
        <View style={styles.gap}>
          <Text variant="caption" color={theme.onWarningSubtle}>
            Lý do: {CLOSE_REASON_LABEL[c.reason ?? ''] ?? c.reason}
            {c.reasonText ? ` — ${c.reasonText}` : ''} · yêu cầu lúc {formatDate(c.requestedAt)}
          </Text>
          {b.ready ? <Text variant="bodySm" color={theme.onWarningSubtle}>Mọi việc đã xong. Cửa hàng sẽ được đóng hẳn trong ít phút.</Text> : null}
          <Item done={(b.ordersInProgress ?? 0) === 0} title="Đơn đang làm" detail={`${b.ordersInProgress} đơn chưa giao xong`} to="/seller" action="Xem đơn hàng" />
          <Item done={(b.openCases ?? 0) === 0} title="Khiếu nại" detail={`${b.openCases} khiếu nại chưa xong`} to="/seller/order-cases" action="Xem khiếu nại" />
          <Item done={(b.pendingAppeals ?? 0) === 0} title="Kháng nghị điểm phạt" detail={`${b.pendingAppeals} kháng nghị chờ quản trị viên`} to="/seller/performance" action="Xem hiệu suất" />
          <Item done={(b.heldForCases ?? 0) === 0} title="Tiền đang giữ cho khiếu nại" detail={`${vnd.format(b.heldForCases ?? 0)} ₫ được giải phóng khi khiếu nại xong`} to="/seller/earnings" action="Xem thu nhập" />
          <Item
            done={(b.balance ?? 0) === 0}
            title="Số dư sổ cái"
            detail={
              (b.balance ?? 0) > 0
                ? `Nền tảng nợ bạn ${vnd.format(b.balance ?? 0)} ₫: sẽ được chi trả vào tài khoản nhận tiền`
                : `Bạn nợ nền tảng ${vnd.format(Math.abs(b.balance ?? 0))} ₫ (hoa hồng đơn tiền mặt): hãy liên hệ hỗ trợ để thanh toán hoặc được xử lý`
            }
            to={(b.balance ?? 0) > 0 ? '/seller/earnings' : '/seller/support'}
            action={(b.balance ?? 0) > 0 ? 'Xem thu nhập' : 'Liên hệ hỗ trợ'}
          />
        </View>
      ) : null}
    </Card>
  )
}

function Item({ done, title, detail, to, action }: { done: boolean; title: string; detail: string; to: string; action: string }) {
  const theme = useTheme()
  const router = useRouter()
  return (
    <View style={styles.item}>
      <Text variant="bodySm" color={theme.onWarningSubtle}>
        {done ? '✓' : '○'} {title}: {done ? 'xong' : detail}
      </Text>
      {!done ? <Button title={action} variant="outline" onPress={() => router.push(to as Href)} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  item: { gap: spacing.xs },
})

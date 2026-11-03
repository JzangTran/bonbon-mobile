import { useRouter } from 'expo-router'
import { Banknote, Smartphone } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { PAST_STATUSES, ACTIVE_STATUSES, useMyOrders } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Card, EmptyState, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const ALL = [...ACTIVE_STATUSES, ...PAST_STATUSES]

/** How an order was paid, in the customer's words. Cash is settled at the door; MoMo shows whether the money went through. */
function paymentLabel(method?: string, status?: string, orderStatus?: string): { text: string; tone: 'ok' | 'wait' | 'muted' } {
  if (method === 'ONLINE') {
    if (status === 'PAID') return { text: 'Đã trả qua MoMo', tone: 'ok' }
    if (orderStatus === 'CANCELLED' || orderStatus === 'REJECTED') return { text: 'MoMo · không thu tiền', tone: 'muted' }
    return { text: 'Chờ thanh toán MoMo', tone: 'wait' }
  }
  if (orderStatus === 'DELIVERED') return { text: 'Đã trả tiền mặt', tone: 'ok' }
  if (orderStatus === 'CANCELLED' || orderStatus === 'REJECTED' || orderStatus === 'NOT_DELIVERED') return { text: 'Tiền mặt · không thu tiền', tone: 'muted' }
  return { text: 'Trả tiền mặt khi nhận', tone: 'wait' }
}

/**
 * "Thanh toán": the ways to pay on bonbon (cash at the door, MoMo, chosen at checkout) and what the customer paid, order by
 * order. Refunds of MoMo payments arrive as notifications and on the order itself.
 */
export default function PaymentsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const orders = useMyOrders(ALL, false)
  const list = orders.data?.items ?? []

  return (
    <Screen>
      <Text variant="headline" accessibilityRole="header">
        Thanh toán
      </Text>
      <Card>
        <Text variant="titleSm">Phương thức thanh toán</Text>
        <Method icon={<Banknote size={22} color={theme.success} />} title="Tiền mặt khi nhận hàng" text="Trả cho quán khi món được giao tới." />
        <Method icon={<Smartphone size={22} color="#A50064" />} title="Ví MoMo" text="Trả trước trong ứng dụng MoMo; đơn hủy được hoàn tiền về ví." />
        <Text variant="caption" muted>
          Bạn chọn cách trả ở bước đặt đơn.
        </Text>
      </Card>

      <Text variant="title">Lịch sử thanh toán</Text>
      {orders.isError ? <Notice tone="error" message={problemMessage(orders.error)} /> : null}
      {orders.data && list.length === 0 ? <EmptyState mascot="empty-orders" title="Chưa có giao dịch nào" hint="Các khoản bạn trả cho đơn hàng sẽ hiện ở đây." /> : null}
      {list.map((o) => {
        const label = paymentLabel(o.paymentMethod, o.paymentStatus, o.status)
        const color = label.tone === 'ok' ? theme.onSuccessSubtle : label.tone === 'wait' ? theme.onWarningSubtle : theme.textMuted
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/customer/order', params: { id: o.id } })}
            style={({ pressed }) => [styles.row, { borderColor: theme.divider }, pressed && { backgroundColor: theme.surfaceMuted }]}
          >
            <View style={styles.flex}>
              <Text variant="bodySm" numberOfLines={1} style={styles.shop}>
                {o.shopName} · #{o.number}
              </Text>
              <Text variant="caption" muted>
                {o.placedAt ? formatDateTime(o.placedAt) : ''}
              </Text>
            </View>
            <View style={styles.right}>
              <Text variant="bodySm" style={styles.shop}>
                {formatVnd(o.grandTotal ?? 0)}
              </Text>
              <Text variant="caption" color={color}>
                {label.text}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </Screen>
  )
}

function Method({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  const theme = useTheme()
  return (
    <View style={styles.method}>
      <View style={[styles.methodIcon, { backgroundColor: theme.surfaceMuted }]}>{icon}</View>
      <View style={styles.flex}>
        <Text variant="bodySm" style={styles.shop}>
          {title}
        </Text>
        <Text variant="caption" muted>
          {text}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  methodIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, minHeight: touchTarget.min },
  right: { alignItems: 'flex-end', gap: 2 },
  shop: { fontWeight: '600' },
})

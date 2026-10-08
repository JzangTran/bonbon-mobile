import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { CASE_STATUS_LABEL, CASE_TYPE_LABEL, useMyCase, useReportNotReceived } from '@/entities/order-case'
import { useMyOrder } from '@/entities/order'
import { confirm } from '@/shared/lib/confirm'
import { useNow } from '@/shared/lib/countdown'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { Button, Card, Text, spacing, useTheme } from '@/shared/ui'

const WINDOW_HOURS = 24

/**
 * After DELIVERED (report-order-not-received.md, report-order-incident.md): the case the customer filed with its status and
 * the decision, or the two ways to file one while the 24 hours last. The server decides what is allowed; this only hides
 * what cannot work (a window that has closed, "not received" after the customer confirmed receipt).
 */
export function OrderCaseCard({ orderId }: { orderId: string }) {
  const router = useRouter()
  const theme = useTheme()
  const now = useNow(60_000)
  const order = useMyOrder(orderId, false)
  const mine = useMyCase(orderId, true)
  const report = useReportNotReceived(orderId)
  const data = order.data
  const delivered = [...(data?.timeline ?? [])].reverse().find((step) => step.to === 'DELIVERED')
  if (mine.isPending || !data) return null
  const existing = mine.data

  if (existing) {
    const label = CASE_STATUS_LABEL[existing.status ?? '']?.customer ?? existing.status
    return (
      <Card>
        <Text variant="titleSm">Báo cáo của bạn</Text>
        <Text>{CASE_TYPE_LABEL[existing.type ?? ''] ?? existing.type}</Text>
        <Text variant="bodySm" color={existing.status === 'UPHELD' ? theme.success : existing.status === 'DISMISSED' ? theme.danger : undefined}>
          {label}
        </Text>
        <Text variant="bodySm" muted>
          Hoàn {formatVnd(existing.refundAmount)} nếu được chấp nhận · gửi lúc {formatDateTime(existing.openedAt)}
        </Text>
        {existing.shopResponse ? (
          <Text variant="bodySm" muted>
            Quán {existing.shopResponse === 'ACCEPTED' ? 'đã chấp nhận' : 'không đồng ý'}
            {existing.shopResponseNote ? `: ${existing.shopResponseNote}` : '.'}
          </Text>
        ) : null}
        {existing.reason ? (
          <Text variant="bodySm" muted>
            Lý do: {existing.reason}
          </Text>
        ) : null}
        {(existing.lines ?? []).map((line) => (
          <View key={line.orderItemId} style={styles.line}>
            <Text variant="bodySm">
              {line.quantity}× {line.name}
            </Text>
            <Text variant="bodySm" muted>
              {formatVnd(line.refundAmount)}
            </Text>
          </View>
        ))}
      </Card>
    )
  }

  const open = !!delivered?.at && now < new Date(delivered.at).getTime() + WINDOW_HOURS * 3_600_000
  if (!open) return null
  const confirmedByCustomer = delivered?.by === 'CUSTOMER'

  const askNotReceived = async () => {
    if (await confirm('Bạn chưa nhận được đơn này?', `Quán sẽ được hỏi. Nếu được chấp nhận, bạn được hoàn ${formatVnd(data.totals?.grandTotal)} (cả phí giao).`, 'Gửi báo cáo')) {
      report.mutate()
    }
  }

  return (
    <Card>
      <Text variant="titleSm">Có vấn đề với đơn này?</Text>
      <Text variant="bodySm" muted>
        Bạn báo được trong {WINDOW_HOURS} giờ sau khi đơn được giao. Quán trả lời trong 12 giờ; nếu hai bên không đồng ý, quản trị viên quyết định.
      </Text>
      {!confirmedByCustomer ? <Button title="Tôi chưa nhận được đơn" variant="outline" size="lg" fullWidth loading={report.isPending} onPress={() => void askNotReceived()} /> : null}
      <Button title="Thiếu món, sai món hoặc chất lượng" variant="outline" size="lg" fullWidth onPress={() => router.push({ pathname: '/customer/report-problem', params: { id: orderId } })} />
    </Card>
  )
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
})

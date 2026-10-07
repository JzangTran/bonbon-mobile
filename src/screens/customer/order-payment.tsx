import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { openMomo, useRefundDestination, useRetryPayment, type OrderPayment, type OrderRefund } from '@/entities/order'
import { countdown, useNow } from '@/shared/lib/countdown'
import { formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Text, spacing, useTheme, useToast } from '@/shared/ui'

/**
 * An online order that is still unpaid: the way into MoMo, the time left and a retry. The screen refreshes every
 * few seconds, so the moment MoMo's signed notification reaches the server the order moves on by itself. Coming back
 * from MoMo is never taken as proof of payment.
 */
export function PaymentCard({ orderId, payment }: { orderId: string; payment: OrderPayment | undefined }) {
  const theme = useTheme()
  const toast = useToast()
  const now = useNow()
  const retry = useRetryPayment(orderId)
  const [opening, setOpening] = useState(false)
  const left = countdown(payment?.expiresAt, now)
  const lapsed = left?.text === 'Quá hạn'
  const waiting = payment?.attemptStatus === 'PENDING' && !lapsed

  const open = async (target: OrderPayment | undefined) => {
    setOpening(true)
    try {
      if ((await openMomo(target)) === 'none') toast.show('Không mở được MoMo. Hãy thử thanh toán lại.', 'error')
    } finally {
      setOpening(false)
    }
  }

  const payAgain = () => retry.mutate(undefined, { onSuccess: (order) => void open(order.payment) })

  return (
    <Card>
      <Text variant="titleSm">Thanh toán MoMo</Text>
      {lapsed ? (
        <Notice tone="error" message="Đã hết thời hạn thanh toán, đơn sắp tự huỷ. Bạn có thể đặt lại từ đầu." />
      ) : waiting ? (
        <>
          <Text variant="bodySm">
            Hoàn tất thanh toán trong <Text variant="bodySm" color={left?.urgent ? theme.danger : theme.text} style={styles.bold}>{left?.text}</Text> nếu không đơn sẽ tự huỷ.
          </Text>
          <Button title="Mở MoMo để thanh toán" size="lg" fullWidth loading={opening} onPress={() => void open(payment)} />
          <View style={styles.row}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text variant="bodySm" muted style={styles.flex}>
              Đang chờ MoMo xác nhận. Thanh toán xong, quay lại đây: đơn tự cập nhật.
            </Text>
          </View>
          <Button title="Tạo lại liên kết thanh toán" variant="ghost" loading={retry.isPending} onPress={payAgain} />
        </>
      ) : (
        <>
          <Notice tone="error" message="Thanh toán chưa thành công. Bạn chưa bị trừ tiền." />
          <Button title="Thanh toán lại" size="lg" fullWidth loading={retry.isPending || opening} onPress={payAgain} />
        </>
      )}
    </Card>
  )
}

/** What happened to the money of a paid online order that did not go through (process-refund.md). */
export function RefundCard({ orderId, refund }: { orderId: string; refund: OrderRefund }) {
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const send = useRefundDestination(orderId)
  const amount = formatVnd(refund.amount)
  const valid = bankName.trim().length > 0 && /^[0-9]{6,20}$/.test(accountNumber) && accountName.trim().length > 0

  return (
    <Card>
      <Text variant="titleSm">Hoàn tiền</Text>
      {refund.status === 'COMPLETED' ? (
        <Text>
          Đã hoàn {amount} {refund.mode === 'MANUAL' ? 'bằng chuyển khoản' : 'về ví MoMo'}.
        </Text>
      ) : refund.needsDestination ? (
        <>
          <Text variant="bodySm">Chúng tôi cần số tài khoản ngân hàng để chuyển lại {amount} cho bạn. Tài khoản chỉ dùng cho khoản hoàn này.</Text>
          {refund.failureReason ? <Notice tone="error" message={`Lần chuyển trước không thành công: ${refund.failureReason}. Hãy nhập tài khoản khác.`} /> : null}
          <Input label="Ngân hàng" value={bankName} onChangeText={setBankName} maxLength={100} placeholder="Ví dụ: Vietcombank" />
          <Input label="Số tài khoản" value={accountNumber} onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={20} />
          <Input label="Tên chủ tài khoản" value={accountName} onChangeText={setAccountName} maxLength={100} autoCapitalize="characters" />
          <Button
            title="Gửi tài khoản"
            size="lg"
            fullWidth
            disabled={!valid}
            loading={send.isPending}
            onPress={() => send.mutate({ bankName: bankName.trim(), accountNumber, accountName: accountName.trim() })}
          />
        </>
      ) : refund.mode === 'MANUAL' ? (
        <Text variant="bodySm">
          Quản trị viên sẽ chuyển {amount} tới tài khoản ••••{refund.destinationLast4} trong vòng 24 giờ. Bạn sẽ nhận thông báo khi xong.
        </Text>
      ) : (
        <Text variant="bodySm">Đang hoàn {amount} về ví MoMo của bạn. Thường xong trong vài phút.</Text>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
})

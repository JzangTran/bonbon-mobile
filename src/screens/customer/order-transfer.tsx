import * as Clipboard from 'expo-clipboard'
import { CheckCircle2, Copy } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useBankTransfer } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Card, Notice, QrCode, Skeleton, Text, radius, spacing, useTheme, useToast } from '@/shared/ui'

/**
 * A bank transfer order (VietQR): the money goes straight to the shop's own account. Scanning the code in any banking
 * app fills in the account, the amount and the message; the shop marks the money received and the card says so.
 */
export function BankTransferCard({ orderId, active }: { orderId: string; active: boolean }) {
  const theme = useTheme()
  const toast = useToast()
  const transfer = useBankTransfer(orderId, true)
  const data = transfer.data

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value)
    toast.show(`Đã chép ${label}.`)
  }

  if (transfer.isPending) {
    return (
      <Card>
        <Text variant="titleSm">Chuyển khoản</Text>
        <Skeleton width={220} height={220} style={styles.center} />
      </Card>
    )
  }
  if (!data) {
    return (
      <Card>
        <Text variant="titleSm">Chuyển khoản</Text>
        <Notice tone="error" message={problemMessage(transfer.error)} />
      </Card>
    )
  }

  if (data.received) {
    return (
      <Card>
        <View style={styles.row}>
          <CheckCircle2 size={22} color={theme.primary} />
          <Text variant="titleSm">Quán đã nhận {formatVnd(data.amount)}</Text>
        </View>
        <Text variant="bodySm" muted>
          Chuyển khoản vào tài khoản {data.bankName} của quán đã được xác nhận.
        </Text>
      </Card>
    )
  }

  const rows: { label: string; value: string; copyLabel?: string }[] = [
    { label: 'Ngân hàng', value: data.bankName ?? '' },
    { label: 'Số tài khoản', value: data.accountNumber ?? '', copyLabel: 'số tài khoản' },
    { label: 'Chủ tài khoản', value: data.accountName ?? '' },
    { label: 'Số tiền', value: formatVnd(data.amount), copyLabel: 'số tiền' },
    { label: 'Nội dung', value: data.message ?? '', copyLabel: 'nội dung' },
  ]

  return (
    <Card>
      <Text variant="titleSm">Chuyển khoản cho quán</Text>
      {active ? (
        <Text variant="bodySm" muted>
          Mở ứng dụng ngân hàng, quét mã dưới đây. Tiền vào thẳng tài khoản của quán; quán xác nhận khi thấy tiền về.
        </Text>
      ) : (
        <Notice tone="error" message="Đơn đã kết thúc. Nếu bạn đã chuyển tiền, hãy nhắn quán để được hoàn lại." />
      )}
      {active && data.qrPayload ? (
        <View style={[styles.qr, { borderColor: theme.border }]}>
          <QrCode value={data.qrPayload} size={220} />
        </View>
      ) : null}
      {rows.map((row) => (
        <View key={row.label} style={styles.line}>
          <Text variant="bodySm" muted style={styles.label}>
            {row.label}
          </Text>
          <Text variant="bodySm" style={[styles.value, styles.bold]} selectable>
            {row.value}
          </Text>
          {row.copyLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Chép ${row.copyLabel}`}
              hitSlop={10}
              onPress={() => void copy(row.copyLabel!, row.label === 'Số tiền' ? String(data.amount) : row.value)}
            >
              <Copy size={16} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <Text variant="caption" muted>
        Giữ đúng nội dung chuyển khoản để quán nhận ra đơn của bạn.
      </Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qr: { alignSelf: 'center', padding: spacing.sm, borderWidth: 1, borderRadius: radius.sm, backgroundColor: '#FFFFFF' },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 28 },
  label: { width: 110 },
  value: { flex: 1 },
  bold: { fontWeight: '600' },
})

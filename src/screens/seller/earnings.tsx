import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useEarnings, useEarningsLedger } from '@/entities/earnings'
import { problemMessage } from '@/shared/api'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { LEDGER_TYPE_LABEL, formatSigned } from '@/shared/lib/ledger'
import { Button, Card, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'

/** What the shop earns and owes (view-earnings.md): the balance in plain words and the ledger behind it, newest first. */
export default function SellerEarningsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const summary = useEarnings()
  const ledger = useEarningsLedger()
  const s = summary.data
  const balance = s?.balance ?? 0
  const owing = balance < 0
  const items = (ledger.data?.pages ?? []).flatMap((page) => page.items ?? [])

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Thu nhập</Text>

      {summary.isError ? <Notice tone="error" message={problemMessage(summary.error, 'Không tải được thu nhập lúc này.')} /> : null}
      {s ? (
        <Card>
          <Text variant="bodySm" muted>
            {owing ? 'Quán đang nợ bonbon' : 'bonbon đang nợ quán'}
          </Text>
          <Text variant="display" color={owing ? theme.danger : theme.success}>
            {formatVnd(Math.abs(balance))}
          </Text>
          <Text variant="bodySm">
            {owing
              ? 'Hoa hồng của các đơn quán đã thu tiền mặt. Quán chuyển khoản lại cho bonbon; khi quản trị viên ghi nhận, số này giảm đi.'
              : balance === 0
                ? 'Hiện hai bên không nợ nhau.'
                : 'Tiền khách đã trả online cho đơn của quán (đã trừ hoa hồng). bonbon chuyển cho quán theo từng đợt.'}
          </Text>
          <Text variant="caption" muted>
            {s.lastPayoutAt ? `Lần chuyển gần nhất: ${formatVnd(s.lastPayoutAmount)} lúc ${formatDateTime(s.lastPayoutAt)}.` : 'bonbon chưa chuyển tiền cho quán lần nào.'}
            {(s.heldForCases ?? 0) > 0 ? ` Đang giữ ${formatVnd(s.heldForCases)} vì khiếu nại chưa có quyết định.` : ''}
          </Text>
        </Card>
      ) : null}

      <Text variant="titleSm">Sổ cái</Text>
      {ledger.isError ? <Notice tone="error" message={problemMessage(ledger.error, 'Không tải được sổ cái lúc này.')} /> : null}
      {ledger.data && items.length === 0 ? (
        <Card>
          <Text muted>Chưa có khoản nào.</Text>
        </Card>
      ) : null}
      {items.map((entry) => (
        <Card key={entry.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text variant="body">{LEDGER_TYPE_LABEL[entry.type ?? ''] ?? entry.type}</Text>
              <Text variant="caption" muted>
                {entry.orderNumber ? `Đơn #${entry.orderNumber} · ` : ''}
                {formatDateTime(entry.createdAt)}
              </Text>
              {entry.itemsTotal !== undefined ? (
                <Text variant="caption" muted>
                  Món {formatVnd(entry.itemsTotal)}
                  {entry.discount ? ` · giảm ${formatVnd(entry.discount)}` : ''} · phí giao {formatVnd(entry.deliveryFee)} · hoa hồng {formatVnd(entry.commission)}
                </Text>
              ) : null}
              {entry.reference || entry.note ? (
                <Text variant="caption" muted>
                  {[entry.reference ? `Mã giao dịch ${entry.reference}` : '', entry.note ?? ''].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <Text variant="titleSm" color={(entry.amount ?? 0) < 0 ? theme.danger : theme.success}>
              {formatSigned(entry.amount)}
            </Text>
          </View>
        </Card>
      ))}
      {ledger.hasNextPage ? <Button title="Xem thêm" variant="outline" loading={ledger.isFetchingNextPage} onPress={() => void ledger.fetchNextPage()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1 },
})

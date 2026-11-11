import { useLocalSearchParams, useRouter } from 'expo-router'
import { Banknote, ChevronRight } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useMyOrder } from '@/entities/order'
import { ProviderLogo } from '@/entities/payment-method'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Notice, Skeleton, SkeletonGroup, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'
import { PageHeader } from './payment-settings'

/** "10 tháng 11 năm 2026, 9:30 PM". */
function paidAt(iso: string | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const hours = d.getHours()
  const clock = `${hours % 12 === 0 ? 12 : hours % 12}:${String(d.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`
  return `${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}, ${clock}`
}

/** One payment: how much, how, when, its reference, and the way to the order or to report a problem with it. */
export default function PaymentDetailScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const order = useMyOrder(id, false)
  const data = order.data
  const online = data?.paymentMethod === 'ONLINE'
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Chi tiết giao dịch" />
      <ScrollView contentContainerStyle={styles.page}>
        {order.isError ? <Notice tone="error" message={problemMessage(order.error, 'Không tìm thấy giao dịch này.')} /> : null}
        {order.isLoading ? (
          <SkeletonGroup style={styles.lines}>
            <Skeleton width="80%" height={28} />
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} height={20} />
            ))}
          </SkeletonGroup>
        ) : null}
        {data ? (
          <>
            <View style={styles.paid}>
              <Text style={[styles.flex, styles.semi]}>Bạn đã thanh toán</Text>
              <Text variant="headline" style={styles.amount}>
                {formatVnd(data.totals?.grandTotal ?? 0)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <Line label="Phương thức thanh toán">
              <View style={styles.method}>
                {online ? (
                  <ProviderLogo provider="MOMO" size={24} />
                ) : (
                  <View style={[styles.cash, { backgroundColor: theme.successSubtle }]}>
                    <Banknote size={14} color={theme.success} />
                  </View>
                )}
                <Text style={styles.semi}>{online ? 'Ví MoMo' : 'Tiền mặt'}</Text>
              </View>
            </Line>
            <Line label="Ngày giờ">
              <Text style={styles.value}>{paidAt(data.placedAt)}</Text>
            </Line>
            <Line label="Mã chi tiết giao dịch">
              <Text selectable variant="bodySm" style={styles.value}>
                {data.id?.toUpperCase()}
              </Text>
            </Line>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <LinkRow title="Chi tiết đơn hàng" onPress={() => router.push({ pathname: '/customer/order', params: { id: data.id! } })} />
            <LinkRow
              title="Báo cáo sự cố"
              onPress={() =>
                // a delivered order has its own problem report (refund for missing or wrong dishes); anything else goes to support
                data.status === 'DELIVERED' ? router.push({ pathname: '/customer/report-problem', params: { id: data.id! } }) : router.push('/customer/support')
              }
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.line}>
      <Text muted style={styles.label}>
        {label}
      </Text>
      <View style={styles.valueCell}>{children}</View>
    </View>
  )
}

function LinkRow({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, pressed && { backgroundColor: theme.surfaceMuted }]}>
      <Text style={[styles.flex, styles.semi]}>{title}</Text>
      <ChevronRight size={22} color={theme.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  semi: { fontFamily: fonts.semibold },
  page: { padding: spacing.lg, gap: spacing.md },
  lines: { gap: spacing.md },
  paid: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amount: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  divider: { height: 1 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 28 },
  label: { flexShrink: 0 },
  valueCell: { flex: 1, alignItems: 'flex-end' },
  value: { textAlign: 'right' },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cash: { width: 24, height: 24, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min, borderRadius: radius.md },
})

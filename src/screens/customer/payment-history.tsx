import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'
import { PAST_STATUSES, ACTIVE_STATUSES, useMyOrders } from '@/entities/order'
import { isPaid } from '@/entities/payment-method'
import { problemMessage } from '@/shared/api'
import { formatDateTime } from '@/shared/lib/format'
import { EmptyState, Notice, Skeleton, SkeletonGroup, Text, spacing, useTheme } from '@/shared/ui'
import { PageHeader } from './payment-settings'
import { TransactionRow } from './payments'

const ALL = [...ACTIVE_STATUSES, ...PAST_STATUSES]

/** Every payment the customer made, newest first, under the date it was made. */
export default function PaymentHistoryScreen() {
  const theme = useTheme()
  const router = useRouter()
  const orders = useMyOrders(ALL, false)
  const paid = (orders.data?.items ?? []).filter(isPaid)
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <PageHeader title="Tất cả giao dịch" />
      <ScrollView contentContainerStyle={styles.page}>
        {orders.isError ? <Notice tone="error" message={problemMessage(orders.error)} /> : null}
        {orders.isLoading ? (
          <SkeletonGroup style={styles.lines}>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} height={44} />
            ))}
          </SkeletonGroup>
        ) : null}
        {orders.data && paid.length === 0 ? <EmptyState mascot="empty-orders" title="Chưa có giao dịch nào" hint="Các khoản bạn đã trả cho đơn hàng sẽ hiện ở đây." /> : null}
        {paid.map((o) => (
          <View key={o.id}>
            <Text variant="caption" muted>
              {formatDateTime(o.placedAt)}
            </Text>
            <TransactionRow amount={o.grandTotal ?? 0} onPress={() => router.push({ pathname: '/customer/payment-detail', params: { id: o.id! } })} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { padding: spacing.lg, gap: spacing.sm },
  lines: { gap: spacing.sm },
})

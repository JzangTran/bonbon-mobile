import { useRouter } from 'expo-router'
import { ChevronRight, Settings } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PAST_STATUSES, ACTIVE_STATUSES, useMyOrders } from '@/entities/order'
import { isPaid } from '@/entities/payment-method'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { MascotArt, SkeletonGroup, Skeleton, Notice, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const ALL = [...ACTIVE_STATUSES, ...PAST_STATUSES]
const BAND_SHARE = 0.25

/**
 * "Thanh toán": a green band over the top quarter with the title, the settings (linked wallets, PIN) and the bear, then today's
 * payments; the arrow opens every payment. Refunds of MoMo payments arrive as notifications and on the order itself.
 */
export default function PaymentsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [today] = useState(() => new Date().toDateString())
  const orders = useMyOrders(ALL, false)
  const paidToday = (orders.data?.items ?? []).filter((o) => isPaid(o) && o.placedAt && new Date(o.placedAt).toDateString() === today)
  const band = height * BAND_SHARE

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll}>
      <StatusBar style="light" />
      <View style={[styles.band, { height: band, backgroundColor: theme.payBand, paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.bandTop}>
          <Text variant="headline" color={theme.onPrimary} style={styles.flex} accessibilityRole="header">
            Thanh toán
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cài đặt thanh toán" onPress={() => router.push('/customer/payment-settings')} style={styles.settings}>
            <Settings size={22} color={theme.onPrimary} />
          </Pressable>
        </View>
        <View pointerEvents="none" style={styles.bear}>
          <MascotArt pose="all-clear" width={Math.max(80, Math.min(130, band - insets.top - 48))} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHead}>
          <Text variant="titleSm" style={[styles.flex, styles.bold]}>
            Giao dịch gần đây
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Xem tất cả giao dịch" hitSlop={8} onPress={() => router.push('/customer/payment-history')} style={styles.more}>
            <ChevronRight size={24} color={theme.text} />
          </Pressable>
        </View>
        {orders.isError ? <Notice tone="error" message={problemMessage(orders.error)} /> : null}
        {orders.isLoading ? (
          <SkeletonGroup>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.row}>
                <View style={[styles.flex, styles.lines]}>
                  <Skeleton width="35%" height={16} />
                  <Skeleton width="25%" height={12} />
                </View>
                <Skeleton width={72} height={16} />
              </View>
            ))}
          </SkeletonGroup>
        ) : null}
        {orders.data && paidToday.length === 0 ? <Text muted>Hôm nay bạn chưa có giao dịch nào.</Text> : null}
        {paidToday.map((o) => (
          <TransactionRow key={o.id} amount={o.grandTotal ?? 0} onPress={() => router.push({ pathname: '/customer/payment-detail', params: { id: o.id! } })} />
        ))}
      </View>
    </ScrollView>
  )
}

/** One payment: what it was and where the money went, the amount at the end. */
export function TransactionRow({ amount, onPress }: { amount: number; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Thanh toán ${formatVnd(amount)} đến BonBon`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}
    >
      <View style={styles.flex}>
        <Text style={styles.semi}>Thanh toán</Text>
        <Text variant="bodySm" muted>
          Đến BonBon
        </Text>
      </View>
      <Text style={styles.amount}>{formatVnd(amount)}</Text>
      <ChevronRight size={20} color={theme.textMuted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxxl },
  band: { paddingHorizontal: spacing.lg, overflow: 'hidden' },
  bandTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  settings: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  bear: { position: 'absolute', right: spacing.md, bottom: 0 },
  content: { padding: spacing.lg, gap: spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  more: { width: touchTarget.min, height: touchTarget.min, alignItems: 'flex-end', justifyContent: 'center' },
  flex: { flex: 1 },
  bold: { fontFamily: fonts.bold },
  semi: { fontFamily: fonts.semibold },
  lines: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, minHeight: touchTarget.min, borderRadius: radius.md },
  amount: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
})

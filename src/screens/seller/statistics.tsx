import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useBestSellingDishes, useRevenueStats } from '@/entities/statistics'
import { problemMessage } from '@/shared/api'
import { useNow } from '@/shared/lib/countdown'
import { formatVnd } from '@/shared/lib/format'
import { addDays, shortDay, vietnamToday } from '@/shared/lib/ledger'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

const PRESETS = [
  { id: 'today', label: 'Hôm nay', days: 0 },
  { id: '7d', label: '7 ngày', days: 6 },
  { id: '30d', label: '30 ngày', days: 29 },
] as const
const CHART_HEIGHT = 140

/** How the shop is selling (view-revenue-statistics.md, view-best-selling-dishes.md): delivered orders only, Vietnam-time days. */
export default function SellerStatisticsScreen() {
  const theme = useTheme()
  const router = useRouter()
  const today = vietnamToday(useNow(60_000))
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('7d')
  const days = PRESETS.find((p) => p.id === preset)?.days ?? 6
  const range = { from: addDays(today, -days), to: today }
  const revenue = useRevenueStats(range)
  const dishes = useBestSellingDishes(range)
  const totals = revenue.data?.totals
  const buckets = revenue.data?.buckets ?? []
  const max = Math.max(1, ...buckets.map((b) => b.revenue ?? 0))
  const topDishes = dishes.data?.items ?? []
  const maxQuantity = Math.max(1, ...topDishes.map((d) => d.quantity ?? 0))
  // About six labels under the bars, however many bars there are.
  const every = Math.max(1, Math.ceil(buckets.length / 6))

  return (
    <Screen>
      <View>
        <Button title="← Quay lại" variant="ghost" onPress={() => router.replace('/seller/shop')} />
      </View>
      <Text variant="headline">Thống kê</Text>
      <Text variant="bodySm" muted>
        Chỉ tính đơn đã giao. Đây là tiền khách đã trả, gồm phí giao và chưa trừ hoa hồng.
      </Text>
      <View style={styles.chips} accessibilityRole="tablist">
        {PRESETS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: preset === p.id }}
            onPress={() => setPreset(p.id)}
            style={[styles.chip, { borderColor: preset === p.id ? theme.primary : theme.borderInput, backgroundColor: preset === p.id ? theme.primarySubtle : theme.surface }]}
          >
            <Text variant="bodySm" color={preset === p.id ? theme.onPrimarySubtle : theme.text}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {revenue.isError ? <Notice tone="error" message={problemMessage(revenue.error, 'Không tải được thống kê lúc này.')} /> : null}
      {totals ? (
        <Card>
          <View style={styles.totals}>
            <Stat label="Đơn đã giao" value={String(totals.orders ?? 0)} />
            <Stat label="Doanh thu" value={formatVnd(totals.revenue)} />
          </View>
          <Text variant="caption" muted>
            Giá trị đơn trung bình {formatVnd(totals.averageOrderValue)}
          </Text>
        </Card>
      ) : null}

      {revenue.data && (totals?.orders ?? 0) === 0 ? (
        <Card>
          <Text muted>Chưa có đơn nào được giao trong khoảng này.</Text>
        </Card>
      ) : null}
      {buckets.length > 1 && (totals?.orders ?? 0) > 0 ? (
        <Card>
          <Text variant="titleSm">Doanh thu theo ngày</Text>
          <View style={[styles.bars, { height: CHART_HEIGHT }]} accessibilityLabel="Biểu đồ doanh thu theo ngày">
            {buckets.map((b) => (
              <View key={b.start} style={styles.barSlot}>
                <View
                  style={{
                    height: Math.max(2, Math.round(((b.revenue ?? 0) / max) * CHART_HEIGHT)),
                    backgroundColor: (b.revenue ?? 0) > 0 ? theme.primary : theme.surfaceMuted,
                    borderTopLeftRadius: radius.sm,
                    borderTopRightRadius: radius.sm,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={styles.axis}>
            {buckets.map((b, i) => (
              <Text key={b.start} variant="caption" muted style={styles.axisLabel} numberOfLines={1}>
                {i % every === 0 ? shortDay(b.start ?? '') : ''}
              </Text>
            ))}
          </View>
          <Text variant="caption" muted>
            Ngày cao nhất: {formatVnd(max)}
          </Text>
        </Card>
      ) : null}

      <Text variant="titleSm">Món bán chạy</Text>
      {dishes.isError ? <Notice tone="error" message={problemMessage(dishes.error, 'Không tải được món bán chạy lúc này.')} /> : null}
      {dishes.data && topDishes.length === 0 ? (
        <Card>
          <Text muted>Chưa có món nào được bán trong khoảng này.</Text>
        </Card>
      ) : null}
      {topDishes.map((d, i) => (
        <Card key={d.menuItemId}>
          <View style={styles.dish}>
            <Text variant="titleSm" muted style={styles.rank}>
              {i + 1}
            </Text>
            <View style={styles.flex}>
              <Text variant="body" numberOfLines={2}>
                {d.name}
              </Text>
              <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
                <View style={[styles.fill, { backgroundColor: theme.primary, width: `${Math.round(((d.quantity ?? 0) / maxQuantity) * 100)}%` }]} />
              </View>
            </View>
            <View style={styles.dishNumbers}>
              <Text variant="body">{d.quantity} phần</Text>
              <Text variant="caption" muted>
                {formatVnd(d.revenue)}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <Text variant="bodySm" muted>
        {label}
      </Text>
      <Text variant="title">{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: { minHeight: touchTarget.min, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  totals: { flexDirection: 'row', gap: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  axis: { flexDirection: 'row', gap: 2 },
  axisLabel: { flex: 1, textAlign: 'center', fontSize: 10, overflow: 'visible' },
  dish: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: { width: 24, textAlign: 'center' },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.xs },
  fill: { height: 6, borderRadius: radius.pill },
  dishNumbers: { alignItems: 'flex-end' },
})

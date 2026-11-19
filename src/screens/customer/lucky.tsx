import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Store } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDeliveryPoint } from '@/entities/address'
import { useHomeFeed, type FeedDish, type FeedShop } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { formatVnd } from '@/shared/lib/format'
import { Button, ErrorState, Skeleton, Text, radius, spacing, useTheme } from '@/shared/ui'

type Item = { dish: FeedDish; shop: FeedShop }

const CARD = 128
const GAP = 12
const STEP = CARD + GAP
/** The strip holds this many cards; the winner sits near its end so the reel runs past many dishes before it stops. */
const STRIP = 56
const WIN_AT = 48
const SPIN_MS = 5600

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/**
 * "Vòng quay": can't decide what to eat? A reel of dishes from the open shops around the delivery point runs sideways, fast then
 * slower and slower, like opening a case in a game, and stops on one dish under the marker. The dish is then one tap from its shop.
 */
export default function CustomerLuckyScreen() {
  const theme = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { session } = useSession()
  const point = useDeliveryPoint(!!session)
  const feed = useHomeFeed({ position: point.position })
  const outOfArea = feed.data?.pages[0]?.outOfArea === true

  const pool = useMemo<Item[]>(
    () =>
      (feed.data?.pages ?? [])
        .flatMap((p) => p.items)
        .filter((c) => c.shop.open !== false)
        .flatMap((c) => c.dishes.map((dish) => ({ dish, shop: c.shop }))),
    [feed.data],
  )
  const shops = useMemo(() => new Set(pool.map((i) => i.shop.id)).size, [pool])

  const [strip, setStrip] = useState<Item[]>([])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Item | null>(null)
  const x = useSharedValue(0)
  const reel = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const shown = strip.length > 0 ? strip : pool.slice(0, 8)

  const finish = (item: Item) => {
    setSpinning(false)
    setResult(item)
  }

  const spin = () => {
    if (pool.length === 0 || spinning) return
    const next = Array.from({ length: STRIP }, () => pick(pool))
    const winner = next[WIN_AT]
    setStrip(next)
    setResult(null)
    setSpinning(true)
    // land somewhere on the winning card, not always dead centre, so it feels like a real reel
    const jitter = (Math.random() - 0.5) * (CARD * 0.6)
    const target = -(WIN_AT * STEP + CARD / 2 - width / 2 + spacing.lg) + jitter
    x.set(0)
    x.set(
      withTiming(target, { duration: SPIN_MS, easing: Easing.bezier(0.1, 0.75, 0.12, 1) }, (done) => {
        if (done) runOnJS(finish)(winner)
      }),
    )
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.head}>
        <Text variant="title1" accessibilityRole="header">
          Hôm nay ăn gì?
        </Text>
        <Text variant="bodySm" color={theme.textSecondary}>
          {pool.length > 0 ? `Quay để bonbon chọn giúp một món trong ${pool.length} món của ${shops} quán đang mở gần bạn.` : 'Quay để bonbon chọn giúp một món từ các quán đang mở gần bạn.'}
        </Text>
      </View>

      {feed.isError ? (
        <ErrorState error={feed.error} retrying={feed.isRefetching} onRetry={() => void feed.refetch()} />
      ) : feed.isPending ? (
        <View style={[styles.window, styles.loading]}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={CARD} height={CARD + 72} radius={radius.card} />
          ))}
        </View>
      ) : pool.length === 0 || outOfArea ? (
        <View style={[styles.empty, { borderColor: theme.border }]}>
          <Store size={28} color={theme.textTertiary} strokeWidth={1.5} />
          <Text variant="title3">Chưa có món nào để quay</Text>
          <Text variant="bodySm" color={theme.textSecondary} style={styles.center}>
            {outOfArea ? 'Chưa có quán giao tới địa chỉ của bạn. Đổi địa chỉ giao ở trang Khám phá rồi quay lại nhé.' : 'Các quán gần bạn đang đóng cửa. Quay lại vào giờ mở bán nhé.'}
          </Text>
        </View>
      ) : (
        <View style={styles.window}>
          <Animated.View style={[styles.strip, reel]}>
            {shown.map((item, i) => (
              <DishCard key={`${i}-${item.dish.id}`} item={item} win={!spinning && result !== null && i === WIN_AT} />
            ))}
          </Animated.View>
          {/* the marker the reel stops under */}
          <View pointerEvents="none" style={[styles.marker, { left: width / 2 - 1, backgroundColor: theme.accent }]} />
          <View pointerEvents="none" style={[styles.notch, styles.notchTop, { left: width / 2 - 7, borderTopColor: theme.accent }]} />
          <View pointerEvents="none" style={[styles.notch, styles.notchBottom, { left: width / 2 - 7, borderBottomColor: theme.accent }]} />
        </View>
      )}

      <View style={styles.result}>
        {result ? (
          <View style={[styles.win, { borderColor: theme.border }]} accessibilityLiveRegion="polite">
            <Text variant="caption" color={theme.textTertiary}>
              bonbon chọn cho bạn
            </Text>
            <Text variant="title2">{result.dish.name}</Text>
            <Text variant="bodySm" color={theme.textSecondary}>
              {result.shop.name}
              {result.shop.distanceKm != null ? ` · ${result.shop.distanceKm.toFixed(1)} km` : ''} · {formatVnd(result.dish.price)}
            </Text>
            <View style={styles.actions}>
              <Button title="Xem quán và đặt món" fullWidth onPress={() => router.push({ pathname: '/customer/vendor', params: { id: result.shop.id } })} />
              <Button title="Quay lại lần nữa" variant="outline" fullWidth onPress={spin} />
            </View>
          </View>
        ) : pool.length > 0 && !outOfArea ? (
          <Button title={spinning ? 'Đang quay…' : 'Quay'} disabled={spinning} fullWidth onPress={spin} />
        ) : null}
      </View>
    </View>
  )
}

function DishCard({ item, win }: { item: Item; win: boolean }) {
  const theme = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: win ? theme.accent : theme.border }, win && styles.cardWin]}>
      <View style={[styles.photo, { backgroundColor: theme.imageSlot }]}>
        {item.dish.photoUrl ? <Image source={{ uri: item.dish.photoUrl }} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
      </View>
      <View style={styles.cardText}>
        <Text variant="label" numberOfLines={2}>
          {item.dish.name}
        </Text>
        <Text variant="caption" color={theme.textTertiary} numberOfLines={1}>
          {item.shop.name}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.xxl },
  window: { height: CARD + 96, overflow: 'hidden', justifyContent: 'center' },
  loading: { flexDirection: 'row', gap: GAP, paddingHorizontal: spacing.lg },
  strip: { flexDirection: 'row', gap: GAP, paddingHorizontal: spacing.lg },
  card: { width: CARD, borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  cardWin: { borderWidth: 2 },
  photo: { width: '100%', height: CARD - 24 },
  cardText: { padding: spacing.sm, gap: 2, minHeight: 68 },
  marker: { position: 'absolute', top: 8, bottom: 8, width: 2, borderRadius: 1 },
  notch: { position: 'absolute', width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  notchTop: { top: 0, borderTopWidth: 9 },
  notchBottom: { bottom: 0, borderBottomWidth: 9 },
  empty: { marginHorizontal: spacing.lg, padding: spacing.xl, borderWidth: 1, borderRadius: radius.card, alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  result: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl },
  win: { borderWidth: 1, borderRadius: radius.card, padding: spacing.lg, gap: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
})

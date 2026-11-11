import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import { ArrowUp } from 'lucide-react-native'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDeliveryPoint, useLocateOnAppOpen } from '@/entities/address'
import { NO_FILTERS, sameFilters, streetOf, useDisplayCategories, useFavoriteShops, useGuestHiddenShops, useHomeFeed, type FeedCard, type HomeFilters } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { afterSignIn } from '@/features/after-sign-in'
import { SkeletonGroup, Skeleton, Button, Card, ErrorState, Text, fonts, radius, showTabBar, spacing, tabBarFollowScroll, tabBarMotion, touchTarget, useTheme } from '@/shared/ui'
import { useCart } from '@/entities/cart'
import { CartBar } from '@/widgets/cart-bar'
import { HomeHeader, HomeHeaderCompact } from '@/widgets/home-header'
import { ShopFeedCard, ShopFeedSkeleton } from '@/widgets/shop-feed-card'
import { DeliverySheet, deliveryTimeText, type DeliveryTime } from './home-delivery'
import { FilterBar, FilterSheets, type FilterPanel } from './home-filters'

/** How far down (px) the page must be before the way back to the top is offered. */
const BACK_TO_TOP_AFTER = 400

/**
 * The first screen of the app, signed in or not (owner design 2026-11-03): the orange header (address, favourites, orders, scan,
 * search, Deal HOT), the display categories, then shops ten at a time, each with a row of its dishes. With a delivery point
 * (the default address, or the place a guest typed) the shops deliver there, nearest first; without, the best rated shops.
 * Scrolling down, a white copy of the header with the row of filters fades in over the top, fully there by the time the row of
 * filters in the page reaches it (owner design 2026-11-05).
 */
export default function CustomerHomeScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { session } = useSession()
  const guest = !session
  const point = useDeliveryPoint(!guest)
  useLocateOnAppOpen()
  const insets = useSafeAreaInsets()
  const [filters, setFilters] = useState<HomeFilters>(NO_FILTERS)
  const [panel, setPanel] = useState<FilterPanel | null>(null)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTime>(null)
  const [deliverySetAt, setDeliverySetAt] = useState(0)
  const timeText = deliveryTimeText(deliveryTime, new Date(deliverySetAt))
  const filtering = !sameFilters(filters, NO_FILTERS)
  const guestHidden = useGuestHiddenShops()
  const feed = useHomeFeed({ position: point.position, filters, guestHidden: guest ? (guestHidden.data ?? []) : [] })
  const favorites = useFavoriteShops(null, !guest)
  const favoriteIds = useMemo(() => new Set((favorites.data ?? []).map((c) => c.shop.id)), [favorites.data])
  const cards = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data])
  const dealMax = feed.data?.pages[0]?.dealMaxPercent ?? 0

  const list = useRef<FlatList<FeedCard>>(null)
  const scrollY = useSharedValue(0)
  const barTop = useSharedValue(0)
  const compactHeight = useSharedValue(0)
  const [compact, setCompact] = useState(false)
  const [listTop, setListTop] = useState(0)
  const { height: screenHeight } = useWindowDimensions()
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
      tabBarFollowScroll(event.contentOffset.y, event.contentSize.height - event.layoutMeasurement.height)
    },
  })
  const clearAt = useDerivedValue(() => Math.max(barTop.value - compactHeight.value, 120))
  useAnimatedReaction(
    () => scrollY.value > clearAt.value * 0.6,
    (on, before) => {
      if (on !== before) runOnJS(setCompact)(on)
    },
  )
  useFocusEffect(useCallback(() => showTabBar, []))
  // The cart bar rides just above the tab bar and drops with it.
  const cartStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -(1 - tabBarMotion.hidden.value) * tabBarMotion.height.value }] }))
  // "Back to the top": once the page is well down and the finger comes back up, a little above the tab bar (and the cart bar, when there is one).
  const { totals } = useCart()
  const aboveTabBar = spacing.lg + (totals.count > 0 ? touchTarget.large + spacing.lg : 0)
  const [backToTop, setBackToTop] = useState(false)
  useAnimatedReaction(
    () => scrollY.value > BACK_TO_TOP_AFTER && tabBarMotion.wanted.value === 0,
    (on, before) => {
      if (on !== before) runOnJS(setBackToTop)(on)
    },
  )
  // On the UI thread and always mounted, so it answers the finger at once.
  const backToTopStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollY.value > BACK_TO_TOP_AFTER && tabBarMotion.wanted.value === 0 ? 1 : 0, { duration: 90 }),
    transform: [{ translateY: -tabBarMotion.height.value - aboveTabBar }],
  }))
  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [clearAt.value * 0.45, clearAt.value], [0, 1], Extrapolation.CLAMP),
  }))

  /** New results start at the row of filters, not somewhere down a list that is no longer there. */
  const applyFilters = (next: HomeFilters) => {
    setFilters(next)
    const top = clearAt.get()
    if (scrollY.get() > top) list.current?.scrollToOffset({ offset: top, animated: false })
  }

  const headerActions = {
    guest,
    onSignIn: () => {
      afterSignIn(null)
      router.push('/login')
    },
    street: streetOf(point.text),
    onAddress: () => setDeliveryOpen(true),
    deliveryLabel: deliveryTime ? timeText : 'Giao ngay',
    onFavorites: () => router.push('/customer/favorites'),
    onOrders: () => router.push('/customer/orders'),
    onScan: () => router.push('/customer/scan'),
    onSearch: () => router.push('/customer/search'),
  }

  const header = (
    <View>
      {/* orange above the header, so the bounce at the top of the list shows orange, never a white gap */}
      <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: theme.primary }]} />
      <HomeHeader {...headerActions} dealMaxPercent={dealMax} onDeals={() => router.push('/customer/deals')} />
      <CategoryStrip
        selected={filters.cuisines}
        onSelect={(id) => applyFilters({ ...filters, cuisines: filters.cuisines.includes(id) ? filters.cuisines.filter((c) => c !== id) : [...filters.cuisines, id] })}
      />
      {/* Where the list starts: the filters appear only once the page has scrolled to here (owner 2026-11-09). */}
      <View
        onLayout={(e) => {
          barTop.set(e.nativeEvent.layout.y)
          setListTop(e.nativeEvent.layout.y)
        }}
      />
      {point.missing && !guest ? (
        <Card style={styles.inset}>
          <Text variant="titleSm">Bạn muốn nhận món ở đâu?</Text>
          <Text muted>Thêm địa chỉ giao hàng để xem các quán giao tới nơi bạn ở.</Text>
          <Button title="+ Thêm địa chỉ" fullWidth onPress={() => router.push('/customer/address-form')} />
        </Card>
      ) : null}
    </View>
  )

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style={compact ? 'auto' : 'light'} />
      <Animated.FlatList
        ref={list as never}
        onScroll={onScroll}
        scrollEventThrottle={16}
        // Tall enough to scroll to the filters even with a few shops, or the filters could not be reached to undo them.
        contentContainerStyle={{ minHeight: screenHeight + listTop }}
        data={cards}
        keyExtractor={(c) => c.shop.id}
        renderItem={({ item }: { item: FeedCard }) => <ShopFeedCard card={item} favorite={favoriteIds.has(item.shop.id)} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          feed.isError || feed.isPaused ? (
            // paused: the query waits for the phone to be back online, so say that rather than spin
            <ErrorState error={feed.error ?? new Error('offline')} retrying={feed.isRefetching} onRetry={() => void feed.refetch()} />
          ) : feed.isPending ? (
            <ShopFeedSkeleton />
          ) : feed.data ? (
            <Card style={styles.inset}>
              <Text variant="titleSm">{filtering ? 'Không có quán phù hợp' : 'Chưa có quán nào giao tới đây'}</Text>
              <Text muted>{filtering ? 'Thử bỏ bớt bộ lọc.' : 'Quán trong khu của bạn sẽ hiện ở đây khi họ mở bán trên bonbon.'}</Text>
              {filtering ? <Button title="Đặt lại bộ lọc" variant="outline" fullWidth onPress={() => applyFilters(NO_FILTERS)} /> : null}
            </Card>
          ) : undefined
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ShopFeedSkeleton count={1} /> : <View style={styles.bottom} />}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
        }}
        onEndReachedThreshold={0.6}
      />
      <Animated.View
        pointerEvents={compact ? 'auto' : 'none'}
        aria-hidden={!compact}
        onLayout={(e) => {
          compactHeight.set(e.nativeEvent.layout.height)
        }}
        style={[styles.compact, { backgroundColor: theme.surface, borderBottomColor: theme.divider, paddingTop: insets.top + spacing.sm }, compactStyle]}
      >
        <View style={styles.compactHeader}>
          <HomeHeaderCompact {...headerActions} />
        </View>
        <FilterBar filters={filters} onChange={applyFilters} onOpen={setPanel} />
      </Animated.View>
      <DeliverySheet
        visible={deliveryOpen}
        address={point.text}
        time={deliveryTime}
        timeText={timeText}
        onChangeTime={(time) => {
          setDeliveryTime(time)
          setDeliverySetAt(Date.now())
        }}
        onChooseAddress={() => {
          setDeliveryOpen(false)
          router.push('/customer/delivery-address')
        }}
        onClose={() => setDeliveryOpen(false)}
      />
      <FilterSheets panel={panel} filters={filters} canUseNearby={Boolean(point.position)} onApply={applyFilters} onClose={() => setPanel(null)} />
      <Animated.View pointerEvents={backToTop ? 'box-none' : 'none'} aria-hidden={!backToTop} style={[styles.backToTop, backToTopStyle]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => list.current?.scrollToOffset({ offset: 0, animated: true })}
          style={[styles.backToTopButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ArrowUp size={18} color={theme.text} />
          <Text variant="bodySm" style={styles.backToTopText}>
            Trở về trang đầu
          </Text>
        </Pressable>
      </Animated.View>
      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, cartStyle]}>
        <CartBar />
      </Animated.View>
    </View>
  )
}

/** The display categories: a picture with its name under it, swiped sideways (no bar, no buttons). Pressing one again clears it. */
function CategoryStrip({ selected, onSelect }: { selected: string[]; onSelect: (id: string) => void }) {
  const theme = useTheme()
  const categories = useDisplayCategories()
  const list = categories.data ?? []
  if (categories.isLoading) {
    return (
      <SkeletonGroup style={[styles.categories, styles.categoriesLoading]}>
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <View key={c} style={styles.category}>
            <Skeleton width={64} height={64} radius={radius.lg} />
            <Skeleton width={48} height={12} />
          </View>
        ))}
      </SkeletonGroup>
    )
  }
  if (list.length === 0) return null
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      {list.map((c) => {
        const on = selected.includes(c.id)
        return (
          <Pressable key={c.id} accessibilityRole="button" aria-pressed={on} accessibilityLabel={c.name} onPress={() => onSelect(c.id)} style={styles.category}>
            <View style={[styles.categoryPicture, { backgroundColor: theme.surfaceMuted, borderColor: on ? theme.primary : 'transparent' }]}>
              {c.imageUrl ? <Image source={{ uri: c.imageUrl }} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
            </View>
            <Text variant="caption" numberOfLines={1} color={on ? theme.primary : theme.text} style={on ? styles.categoryOn : undefined}>
              {c.name}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backToTop: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  backToTopButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget.min, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1 },
  backToTopText: { fontFamily: fonts.semibold },
  compact: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  compactHeader: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  overscroll: { position: 'absolute', left: 0, right: 0, top: -1000, height: 1000 },
  inset: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  separator: { height: 8 },
  bottom: { height: 120 },
  categories: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
  categoriesLoading: { flexDirection: 'row', overflow: 'hidden' },
  category: { width: 72, alignItems: 'center', gap: spacing.xs },
  categoryPicture: { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 2 },
  categoryOn: { fontFamily: fonts.semibold },
})

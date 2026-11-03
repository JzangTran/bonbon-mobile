import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useDeliveryPoint } from '@/entities/address'
import { streetOf, useDisplayCategories, useFavoriteShops, useGuestHiddenShops, useHomeFeed, type FeedCard } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { Button, Card, ErrorState, Text, fonts, radius, spacing, useTheme } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { HomeHeader } from '@/widgets/home-header'
import { ShopFeedCard } from '@/widgets/shop-feed-card'

/**
 * The first screen of the app, signed in or not (owner design 2026-11-03): the orange header (address, favourites, orders, scan,
 * search, Deal HOT), the display categories, then shops ten at a time, each with a row of its dishes. With a delivery point
 * (the default address, or the place a guest typed) the shops deliver there, nearest first; without, the best rated shops.
 */
export default function CustomerHomeScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { session } = useSession()
  const guest = !session
  const point = useDeliveryPoint(!guest)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const guestHidden = useGuestHiddenShops()
  const feed = useHomeFeed({ position: point.position, displayCategoryId: categoryId, guestHidden: guest ? (guestHidden.data ?? []) : [] })
  const favorites = useFavoriteShops(null, !guest)
  const favoriteIds = useMemo(() => new Set((favorites.data ?? []).map((c) => c.shop.id)), [favorites.data])
  const cards = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data])
  const dealMax = feed.data?.pages[0]?.dealMaxPercent ?? 0
  const signInFirst = (path: '/customer/favorites') => router.push(guest ? '/login' : path)

  const header = (
    <View>
      {/* orange above the header, so the bounce at the top of the list shows orange, never a white gap */}
      <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: theme.primary }]} />
      <HomeHeader
        street={streetOf(point.text)}
        onAddress={() => router.push(guest ? '/customer/pick-location' : '/customer/addresses')}
        onFavorites={() => signInFirst('/customer/favorites')}
        onOrders={() => router.push('/customer/orders')}
        onScan={() => router.push('/customer/scan')}
        onSearch={() => router.push('/customer/search')}
        dealMaxPercent={dealMax}
        onDeals={() => router.push('/customer/deals')}
      />
      <CategoryStrip selected={categoryId} onSelect={(id) => setCategoryId((current) => (current === id ? null : id))} />
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
      <StatusBar style="light" />
      <FlatList<FeedCard>
        data={cards}
        keyExtractor={(c) => c.shop.id}
        renderItem={({ item }) => <ShopFeedCard card={item} favorite={favoriteIds.has(item.shop.id)} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          feed.isError || feed.isPaused ? (
            // paused: the query waits for the phone to be back online, so say that rather than spin
            <ErrorState error={feed.error ?? new Error('offline')} retrying={feed.isRefetching} onRetry={() => void feed.refetch()} />
          ) : feed.isPending ? (
            <ActivityIndicator style={styles.loading} color={theme.primary} />
          ) : feed.data ? (
            <Card style={styles.inset}>
              <Text variant="titleSm">{categoryId ? 'Chưa có quán trong danh mục này' : 'Chưa có quán nào giao tới đây'}</Text>
              <Text muted>{categoryId ? 'Thử danh mục khác.' : 'Quán trong khu của bạn sẽ hiện ở đây khi họ mở bán trên bonbon.'}</Text>
            </Card>
          ) : undefined
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator style={styles.loading} color={theme.primary} /> : <View style={styles.bottom} />}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
        }}
        onEndReachedThreshold={0.6}
      />
      <CartBar />
    </View>
  )
}

/** The display categories: a picture with its name under it, swiped sideways (no bar, no buttons). Pressing one again clears it. */
function CategoryStrip({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const theme = useTheme()
  const categories = useDisplayCategories()
  const list = categories.data ?? []
  if (list.length === 0) return null
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      {list.map((c) => {
        const on = c.id === selected
        return (
          <Pressable key={c.id} accessibilityRole="button" aria-selected={on} accessibilityLabel={c.name} onPress={() => onSelect(c.id)} style={styles.category}>
            <View style={[styles.categoryPicture, { backgroundColor: theme.surfaceMuted, borderColor: on ? theme.primary : 'transparent' }]}>
              {c.imageUrl ? <Image source={{ uri: c.imageUrl }} alt="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
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
  overscroll: { position: 'absolute', left: 0, right: 0, top: -1000, height: 1000 },
  inset: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  separator: { height: 8 },
  loading: { marginVertical: spacing.xl },
  bottom: { height: 120 },
  categories: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  category: { width: 72, alignItems: 'center', gap: spacing.xs },
  categoryPicture: { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 2 },
  categoryOn: { fontFamily: fonts.semibold },
})

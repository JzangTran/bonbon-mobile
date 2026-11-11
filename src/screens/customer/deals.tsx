import { useMemo } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useDeliveryPoint } from '@/entities/address'
import { useFavoriteShops, useGuestHiddenShops, useHomeFeed, type FeedCard } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { problemMessage } from '@/shared/api'
import { EmptyState, Notice, Text, spacing, useTheme } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { ShopFeedCard, ShopFeedSkeleton } from '@/widgets/shop-feed-card'

/** "Deal HOT": shops near the delivery point with discounted dishes, biggest discount first, ten at a time. */
export default function DealsScreen() {
  const theme = useTheme()
  const { session } = useSession()
  const point = useDeliveryPoint(!!session)
  const guestHidden = useGuestHiddenShops()
  const feed = useHomeFeed({ position: point.position, deals: true, guestHidden: session ? [] : (guestHidden.data ?? []) })
  const favorites = useFavoriteShops(null, !!session)
  const favoriteIds = useMemo(() => new Set((favorites.data ?? []).map((c) => c.shop.id)), [favorites.data])
  const cards = useMemo(() => feed.data?.pages.flatMap((p) => p.items) ?? [], [feed.data])
  const max = feed.data?.pages[0]?.dealMaxPercent ?? 0

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <FlatList<FeedCard>
        data={cards}
        keyExtractor={(c) => c.shop.id}
        renderItem={({ item }) => <ShopFeedCard card={item} favorite={favoriteIds.has(item.shop.id)} />}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
        ListHeaderComponent={
          <View style={styles.intro}>
            {max > 0 ? <Text variant="headline">Giảm đến {max}%</Text> : null}
            <Text muted>Các quán có món đang giảm giá{point.position ? ' giao tới địa chỉ của bạn' : ''}, giảm nhiều trước.</Text>
            {feed.isError ? <Notice tone="error" message={problemMessage(feed.error)} /> : null}
          </View>
        }
        ListEmptyComponent={
          feed.isPending ? <ShopFeedSkeleton /> : <EmptyState mascot="search" title="Chưa có quán nào đang giảm giá" />
        }
        ListFooterComponent={feed.isFetchingNextPage ? <ShopFeedSkeleton count={1} /> : <View style={styles.bottom} />}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage()
        }}
        onEndReachedThreshold={0.6}
      />
      <CartBar />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { padding: spacing.lg, gap: spacing.xs },
  separator: { height: 8 },
  bottom: { height: 120 },
})

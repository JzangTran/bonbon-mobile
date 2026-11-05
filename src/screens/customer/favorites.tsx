import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { useDeliveryPoint } from '@/entities/address'
import { useFavoriteShops, type FeedCard } from '@/entities/feed'
import { problemMessage } from '@/shared/api'
import { Button, EmptyState, Notice, useTheme } from '@/shared/ui'
import { ShopFeedCard } from '@/widgets/shop-feed-card'

/** "Quán yêu thích": the shops the customer hearted, newest first, each with its dishes like on the home page. */
export default function FavoritesScreen() {
  const theme = useTheme()
  const router = useRouter()
  const point = useDeliveryPoint(true)
  const favorites = useFavoriteShops(point.position, true)
  return (
    <FlatList<FeedCard>
      style={{ backgroundColor: theme.background }}
      data={favorites.data ?? []}
      keyExtractor={(c) => c.shop.id}
      renderItem={({ item }) => <ShopFeedCard card={item} favorite />}
      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.divider }]} />}
      ListHeaderComponent={favorites.isError ? <Notice tone="error" message={problemMessage(favorites.error)} /> : undefined}
      ListEmptyComponent={
        favorites.isPending ? (
          <ActivityIndicator style={styles.loading} color={theme.primary} />
        ) : (
          <View>
            <EmptyState mascot="all-clear" title="Chưa có quán yêu thích" hint="Bấm ⋮ cạnh tên quán ở trang chủ rồi chọn Thêm vào mục yêu thích." />
            <Button title="Xem các quán" variant="outline" onPress={() => router.dismissTo('/customer')} />
          </View>
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  separator: { height: 8 },
  loading: { marginVertical: 24 },
})

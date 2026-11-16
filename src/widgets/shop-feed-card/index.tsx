import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { EllipsisVertical, EyeOff, Heart, Star, Store } from 'lucide-react-native'
import { memo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { ratingCountLabel, useFavoriteToggle, useHideShop, type FeedCard, type FeedDish } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { mockPhoto } from '@/shared/lib/mock-photos'
import { SkeletonGroup, Skeleton, Sheet, Text, fonts, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'

const TILE = 116

/**
 * A shop on the home page: its logo, name and rating, a "more" button (favourite, hide), then a row of up to 10 of its dishes that
 * scrolls sideways. Pressing the shop or a dish opens its menu.
 */
export const ShopFeedCard = memo(function ShopFeedCard({ card, favorite = false }: { card: FeedCard; favorite?: boolean }) {
  const theme = useTheme()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const { shop, dishes } = card
  const open = () => router.push({ pathname: '/customer/vendor', params: { id: shop.id } })

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${shop.name}${shop.open === false ? ', đang đóng' : ''}`} onPress={open} style={styles.identity}>
          <View style={[styles.logo, { backgroundColor: theme.surfaceMuted }]}>
            {shop.logoUrl ? (
              <Image source={{ uri: shop.logoUrl }} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <Store size={24} color={theme.textMuted} strokeWidth={1.5} />
            )}
          </View>
          <View style={styles.flex}>
            <Text variant="titleSm" numberOfLines={1}>
              {shop.name}
            </Text>
            <View style={styles.rating}>
              <Star size={14} color="#F5A524" fill="#F5A524" />
              {shop.ratingAverage != null ? (
                <Text variant="bodySm">
                  {shop.ratingAverage.toFixed(1)}{' '}
                  <Text variant="bodySm" muted>
                    ({ratingCountLabel(shop.ratingCount ?? 0)})
                  </Text>
                </Text>
              ) : (
                <Text variant="bodySm" muted>
                  Chưa có đánh giá
                </Text>
              )}
              {shop.open === false ? (
                <Text variant="caption" muted>
                  · Đang đóng
                </Text>
              ) : null}
              {shop.distanceKm != null && shop.deliveryRadiusKm != null && shop.distanceKm > Number(shop.deliveryRadiusKm) ? (
                <Text variant="caption" color={theme.onWarningSubtle}>
                  · Ngoài vùng giao
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Tuỳ chọn cho ${shop.name}`} onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.more}>
          <EllipsisVertical size={20} color={theme.textMuted} />
        </Pressable>
      </View>

      {dishes.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dishes}>
          {dishes.map((dish) => (
            <DishTile key={dish.id} dish={dish} onPress={open} />
          ))}
        </ScrollView>
      ) : null}

      <ShopActions shopId={shop.id} name={shop.name} favorite={favorite} visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  )
})

function DishTile({ dish, onPress }: { dish: FeedDish; onPress: () => void }) {
  const theme = useTheme()
  const discounted = dish.discountPercent > 0 && dish.originalPrice != null
  // demo builds fill a missing photo with a stock picture, as the menu does
  const photo = dish.photoUrl ? { uri: dish.photoUrl } : mockPhoto(dish.id, dish.name)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${dish.name}, ${formatVnd(dish.price)}${discounted ? `, giảm ${dish.discountPercent}%` : ''}`} onPress={onPress} style={styles.tile}>
      <View style={[styles.photo, { backgroundColor: theme.surfaceMuted }]}>
        {photo ? <Image source={photo} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        {discounted ? (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text variant="caption" color="#FFFFFF" style={styles.badgeText}>
              Giảm {dish.discountPercent}%
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.prices}>
        <Text variant="bodySm" color={discounted ? theme.primary : theme.text} style={styles.price}>
          {formatVnd(dish.price)}
        </Text>
        {discounted ? (
          <Text variant="caption" muted style={styles.original}>
            {formatVnd(dish.originalPrice!)}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" numberOfLines={2}>
        {dish.name}
      </Text>
    </Pressable>
  )
}

/** The small sheet behind the "more" button: add to (or remove from) favourites, hide the shop for 30 days. */
function ShopActions({ shopId, name, favorite, visible, onClose }: { shopId: string; name: string; favorite: boolean; visible: boolean; onClose: () => void }) {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const { session } = useSession()
  const toggle = useFavoriteToggle()
  const hide = useHideShop(!!session)

  const onFavorite = () => {
    onClose()
    if (!session) {
      router.push('/login')
      return
    }
    toggle.mutate(
      { shopId, favorite: !favorite },
      {
        onSuccess: () => toast.show(favorite ? 'Đã bỏ khỏi mục yêu thích.' : 'Đã thêm vào mục yêu thích.'),
        onError: (e) => toast.show(problemMessage(e)),
      },
    )
  }
  const onHide = () => {
    onClose()
    hide.mutate(shopId, {
      onSuccess: () => toast.show(`Đã ẩn ${name} trong 30 ngày.`),
      onError: (e) => toast.show(problemMessage(e)),
    })
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Pressable accessibilityRole="button" onPress={onFavorite} style={styles.action}>
        <Heart size={22} color={theme.primary} fill={favorite ? theme.primary : 'transparent'} />
        <Text variant="body">{favorite ? 'Bỏ khỏi mục yêu thích' : 'Thêm vào mục yêu thích'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onHide} style={styles.action}>
        <EyeOff size={22} color={theme.text} />
        <View style={styles.flex}>
          <Text variant="body">Ẩn quán này</Text>
          <Text variant="caption" muted>
            Bạn sẽ không thấy quán này trong 30 ngày
          </Text>
        </View>
      </Pressable>
    </Sheet>
  )
}

/** Shops on their way, in the shape of the cards above: logo, name and rating, then a row of dishes. */
export function ShopFeedSkeleton({ count = 3 }: { count?: number }) {
  const theme = useTheme()
  return (
    <SkeletonGroup>
      {Array.from({ length: count }, (_, card) => (
        <View key={card}>
          {card > 0 ? <View style={[styles.skeletonGap, { backgroundColor: theme.divider }]} /> : null}
          <View style={styles.card}>
            <View style={[styles.head, styles.skeletonHead]}>
              <Skeleton width={52} height={52} radius={radius.lg} />
              <View style={styles.flex}>
                <Skeleton width="60%" height={20} />
                <Skeleton width={72} height={14} style={styles.skeletonRating} />
              </View>
            </View>
            <View style={[styles.dishes, styles.skeletonDishes]}>
              {[0, 1, 2].map((dish) => (
                <View key={dish} style={styles.tile}>
                  <Skeleton width={TILE} height={TILE} radius={radius.lg} />
                  <Skeleton width={72} height={16} style={styles.skeletonPrice} />
                  <Skeleton width={96} height={12} style={styles.skeletonName} />
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  )
}

const styles = StyleSheet.create({
  skeletonGap: { height: 8 },
  skeletonHead: { minHeight: touchTarget.min },
  skeletonRating: { marginTop: spacing.sm },
  skeletonDishes: { flexDirection: 'row', overflow: 'hidden' },
  skeletonPrice: { marginTop: spacing.sm },
  skeletonName: { marginTop: spacing.xs },
  card: { paddingVertical: spacing.md, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  logo: { width: 52, height: 52, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  more: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  dishes: { paddingHorizontal: spacing.lg, gap: spacing.md },
  tile: { width: TILE, gap: 2 },
  photo: { width: TILE, height: TILE, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  badge: { paddingVertical: 3, alignItems: 'center' },
  badgeText: { fontFamily: fonts.semibold },
  prices: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  price: { fontFamily: fonts.bold },
  original: { textDecorationLine: 'line-through' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min + 8 },
})

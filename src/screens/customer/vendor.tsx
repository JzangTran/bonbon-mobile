import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ArrowLeft, ArrowRight, BadgePercent, Heart, Motorbike, Plus, Star, Store } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDeliveryPoint } from '@/entities/address'
import { useCart, type CartShop } from '@/entities/cart'
import { ratingCountLabel, useFavoriteShops, useFavoriteToggle } from '@/entities/feed'
import { useSession } from '@/entities/session'
import { deliveryText, formatDistance, useShopMenu, useShopVouchers, voucherCondition, voucherTitle, type ShopDish, type ShopVoucher } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { formatVnd } from '@/shared/lib/format'
import { mockPhoto } from '@/shared/lib/mock-photos'
import { SkeletonGroup, Skeleton, Button, Notice, Sheet, Text, fonts, radius, spacing, useTheme, useToast } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { DishSheet } from './dish-sheet'
import { ShopReviewsCard } from './shop-reviews'

const COVER_HEIGHT = 210
const VOUCHERS_SHOWN = 4
const GLASS = 'rgba(0,0,0,0.42)'
const WHITE = '#FFFFFF'

/**
 * A shop's page (view-vendor-menu.md): its picture, darkened, with the way back, the heart and the delivery details on it; the shop's
 * name in a block floating over the picture's lower edge; its vouchers; then its dishes by section.
 */
export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const { position } = useDeliveryPoint(!!session)
  const menu = useShopMenu(id, position)
  const vouchers = useShopVouchers(id)
  const favorites = useFavoriteShops(null, !!session)
  const toggleFavorite = useFavoriteToggle()
  const [dish, setDish] = useState<ShopDish | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const shop = menu.data?.shop
  // a shop seen from outside its delivery radius can be looked at, not ordered from
  const outOfRange = shop?.distanceKm != null && shop.deliveryRadiusKm != null && shop.distanceKm > Number(shop.deliveryRadiusKm)
  const orderable = Boolean(shop?.open) && !outOfRange
  const cart = useCart()
  const toast = useToast()
  const favorite = (favorites.data ?? []).some((c) => c.shop.id === id)
  const cartShop: CartShop | null = shop
    ? {
        id: shop.id!,
        name: shop.name ?? '',
        deliveryFee: shop.deliveryFee ?? 0,
        freeDeliveryThreshold: shop.freeDeliveryThreshold,
        minOrderValue: shop.minOrderValue,
      }
    : null

  const addToCart = async (line: Parameters<typeof cart.add>[1]) => {
    if (!cartShop) return
    if (cart.add(cartShop, line) === 'other-shop') {
      // One shop per cart: starting a new one throws the old one away, so the customer has to agree.
      const ok = await confirm('Bắt đầu giỏ hàng mới?', `Giỏ hàng đang có món của “${cart.shop?.name}”. Thêm món từ quán này sẽ xoá giỏ cũ.`, 'Xoá và thêm')
      if (!ok) return
      cart.replaceWith(cartShop, line)
    }
    toast.show('Đã thêm vào giỏ.')
    setDish(null)
  }

  // A dish without choices goes straight in; one with choices opens them first.
  const quickAdd = (item: ShopDish) => {
    if ((item.optionGroups ?? []).length > 0) {
      setDish(item)
      return
    }
    void addToCart({ menuItemId: item.id!, name: item.name ?? '', basePrice: item.price ?? 0, options: [], quantity: 1 })
  }

  const onHeart = () => {
    if (!session) {
      router.push('/login')
      return
    }
    toggleFavorite.mutate(
      { shopId: id, favorite: !favorite },
      { onSuccess: () => toast.show(favorite ? 'Đã bỏ khỏi mục yêu thích.' : 'Đã thêm vào mục yêu thích.'), onError: (e) => toast.show(problemMessage(e)) },
    )
  }

  const cover = shop?.coverUrl ? { uri: shop.coverUrl } : mockPhoto(id, shop?.name ?? '')
  const logo = shop?.logoUrl ? { uri: shop.logoUrl } : undefined
  const offers = vouchers.data ?? []

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.cover, { backgroundColor: theme.ink }]}>
          {cover ? <Image source={cover} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Glass label="Quay lại" onPress={() => router.back()}>
              <ArrowLeft size={22} color={WHITE} />
            </Glass>
            <View style={styles.flex} />
            <Glass label={favorite ? 'Bỏ khỏi mục yêu thích' : 'Thêm vào mục yêu thích'} onPress={onHeart}>
              <Heart size={20} color={WHITE} fill={favorite ? WHITE : 'transparent'} />
            </Glass>
            <Pressable accessibilityRole="button" accessibilityLabel="Thông tin giao hàng" onPress={() => setInfoOpen(true)} style={styles.delivery}>
              <Motorbike size={18} color={WHITE} />
              <Text variant="bodySm" color={WHITE} style={styles.deliveryText}>
                Giao hàng
              </Text>
            </Pressable>
          </View>
        </View>

        {menu.isError ? <Notice tone="error" message={problemMessage(menu.error, 'Không tìm thấy quán này.')} /> : null}

        {!shop && menu.isLoading ? <VendorSkeleton /> : null}
        {outOfRange ? (
          <View style={styles.rangeNotice}>
            <Notice tone="warning" message={`Quán chỉ giao trong ${shop?.deliveryRadiusKm} km, địa chỉ của bạn cách ${formatDistance(shop?.distanceKm)}. Bạn xem được thực đơn nhưng chưa đặt được.`} />
          </View>
        ) : null}

        {shop ? (
          <View style={[styles.info, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.logo, { backgroundColor: theme.surfaceMuted }]}>
              {logo ? <Image source={logo} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} /> : <Store size={26} color={theme.textMuted} strokeWidth={1.5} />}
            </View>
            <View style={styles.flex}>
              <Text variant="titleSm" numberOfLines={2} accessibilityRole="header">
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
                {!shop.open ? (
                  <Text variant="caption" color={theme.onWarningSubtle}>
                    · Đang đóng cửa
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {offers.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vouchers}>
            {offers.slice(0, VOUCHERS_SHOWN).map((v) => (
              <VoucherCard key={v.id} voucher={v} onPress={() => router.push({ pathname: '/customer/offer', params: { vendorId: id, id: v.id } })} />
            ))}
            {offers.length > VOUCHERS_SHOWN ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xem tất cả ${offers.length} ưu đãi`}
                onPress={() => router.push({ pathname: '/customer/offers', params: { vendorId: id } })}
                style={[styles.more, { backgroundColor: theme.primarySubtle }]}
              >
                <ArrowRight size={22} color={theme.primary} />
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}

        {menu.data && (menu.data.sections ?? []).length === 0 ? (
          <Text muted style={styles.empty}>
            Quán chưa có món nào.
          </Text>
        ) : null}
        {(menu.data?.sections ?? []).map((section) => (
          <View key={section.id} style={styles.section}>
            <Text variant="titleSm">{section.name}</Text>
            {(section.items ?? []).map((item) => (
              <DishRow key={item.id} item={item} canAdd={orderable} onOpen={() => setDish(item)} onAdd={() => quickAdd(item)} />
            ))}
          </View>
        ))}
        {shop?.id ? (
          <View style={styles.reviews}>
            <ShopReviewsCard vendorId={shop.id} />
          </View>
        ) : null}
      </ScrollView>

      <DishSheet dish={dish} shop={cartShop} canOrder={orderable && !dish?.soldOut} onAdd={addToCart} onClose={() => setDish(null)} />
      <Sheet visible={infoOpen} onClose={() => setInfoOpen(false)} title="Giao hàng">
        {shop ? (
          <>
            <Text variant="bodySm" muted>
              {shop.address}
            </Text>
            <Text variant="bodySm">{[formatDistance(shop.distanceKm), deliveryText(shop)].filter(Boolean).join(' · ')}</Text>
            {shop.minOrderValue ? <Text variant="bodySm">Đơn tối thiểu {formatVnd(shop.minOrderValue)}</Text> : null}
            <Button
              title="Nhắn tin cho quán"
              variant="outline"
              onPress={() => {
                setInfoOpen(false)
                router.push(session ? { pathname: '/customer/chat', params: { vendorId: shop.id } } : '/login')
              }}
            />
          </>
        ) : null}
      </Sheet>
      <CartBar />
    </View>
  )
}

function Glass({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={styles.glass}>
      {children}
    </Pressable>
  )
}

function VoucherCard({ voucher, onPress }: { voucher: ShopVoucher; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.voucher, { borderColor: theme.primary, backgroundColor: theme.primarySubtle }]}>
      <Text variant="bodySm" color={theme.primary} numberOfLines={1} style={styles.voucherTitle}>
        {voucherTitle(voucher)}
      </Text>
      <Text variant="caption" muted numberOfLines={1}>
        {voucherCondition(voucher)}
      </Text>
    </Pressable>
  )
}

function DishRow({ item, canAdd, onOpen, onAdd }: { item: ShopDish; canAdd: boolean; onOpen: () => void; onAdd: () => void }) {
  const theme = useTheme()
  const soldOut = Boolean(item.soldOut)
  const photo = item.photoUrl ? { uri: item.photoUrl } : mockPhoto(item.id ?? '', item.name ?? '')
  const discounted = (item.discountPercent ?? 0) > 0 && item.originalPrice != null
  return (
    <View style={styles.dish}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${formatVnd(item.price ?? 0)}${soldOut ? ', hết món' : ''}`} onPress={onOpen} style={styles.dishMain}>
        <View style={[styles.photo, { backgroundColor: theme.imageSlot }, soldOut && styles.soldOut]}>
          {photo ? <Image source={photo} accessibilityLabel="" contentFit="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors /> : null}
        </View>
        <View style={[styles.flex, soldOut && styles.soldOut]}>
          <Text variant="bodySm" muted numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.prices}>
            <Text variant="body" style={styles.price}>
              {formatVnd(item.price ?? 0)}
            </Text>
            {discounted ? (
              <>
                <Text style={[styles.original, { color: theme.textMuted }]}>{formatVnd(item.originalPrice!)}</Text>
                <BadgePercent size={12} color={theme.primary} />
              </>
            ) : null}
          </View>
          {soldOut ? (
            <Text variant="caption" color={theme.onWarningSubtle}>
              Hết món
            </Text>
          ) : null}
        </View>
      </Pressable>
      {canAdd && !soldOut ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Thêm ${item.name} vào giỏ`} hitSlop={8} onPress={onAdd} style={[styles.plus, { backgroundColor: theme.primary }]}>
          <Plus size={18} color={WHITE} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  )
}

/** The shop on its way, under its cover: the name card, then dishes with their pictures. */
function VendorSkeleton() {
  const theme = useTheme()
  return (
    <SkeletonGroup>
      <View style={[styles.info, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Skeleton width={76} height={76} radius={radius.md} />
        <View style={styles.flex}>
          <Skeleton width="70%" height={20} />
          <Skeleton width={110} height={14} style={styles.skeletonGap} />
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width={130} height={20} />
        {[0, 1, 2, 3].map((dish) => (
          <View key={dish} style={[styles.dish, styles.dishMain]}>
            <Skeleton width={92} height={92} radius={radius.md} />
            <View style={styles.flex}>
              <Skeleton width="75%" height={16} />
              <Skeleton width="50%" height={12} style={styles.skeletonGap} />
              <Skeleton width={80} height={16} style={styles.skeletonGap} />
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  )
}

const styles = StyleSheet.create({
  rangeNotice: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  skeletonGap: { marginTop: spacing.sm },
  flex: { flex: 1 },
  page: { paddingBottom: 120 },
  cover: { height: COVER_HEIGHT, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.38)' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  glass: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: GLASS },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: GLASS },
  deliveryText: { fontFamily: fonts.semibold },
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: -64, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  logo: { width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  rating: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  vouchers: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm, alignItems: 'stretch' },
  voucher: { width: 168, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center' },
  voucherTitle: { fontFamily: fonts.semibold },
  more: { width: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing.lg },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  dish: { minHeight: 92 },
  dishMain: { flexDirection: 'row', gap: spacing.md },
  soldOut: { opacity: 0.5 },
  photo: { width: 92, height: 92, borderRadius: radius.md, overflow: 'hidden' },
  prices: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs, paddingRight: 36 },
  price: { fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  original: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular, textDecorationLine: 'line-through', opacity: 0.7 },
  plus: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  reviews: { padding: spacing.lg },
})

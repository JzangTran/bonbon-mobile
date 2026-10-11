import { Image } from 'expo-image'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useLayoutEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAddresses } from '@/entities/address'
import { useCart, type CartShop } from '@/entities/cart'
import { RatingSummary } from '@/entities/review'
import { deliveryText, formatDistance, useShopMenu, type ShopDish } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { confirm } from '@/shared/lib/confirm'
import { Button, Card, Notice, Screen, Text, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { DishSheet } from './dish-sheet'
import { ShopReviewsCard } from './shop-reviews'

/** A shop's menu (view-vendor-menu.md): sections and dishes, sold-out dishes greyed out, options shown read-only. */
export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const router = useRouter()
  const theme = useTheme()
  const addresses = useAddresses()
  const address = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0]
  const position = address?.lat !== undefined && address?.lng !== undefined ? { lat: address.lat, lng: address.lng } : null
  const menu = useShopMenu(id, position)
  const [dish, setDish] = useState<ShopDish | null>(null)
  const shop = menu.data?.shop
  const cart = useCart()
  const toast = useToast()
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

  useLayoutEffect(() => {
    navigation.setOptions({ title: shop?.name ?? 'Quán' })
  }, [navigation, shop?.name])

  return (
    <View style={styles.flex}>
    <Screen>
      {menu.isError ? <Notice tone="error" message={problemMessage(menu.error, 'Không tìm thấy quán này.')} /> : null}
      {shop ? (
        <Card>
          <View style={styles.row}>
            <Text variant="headline" style={styles.flex}>
              {shop.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: shop.open ? theme.successSubtle : theme.surfaceMuted }]}>
              <Text variant="caption" color={shop.open ? theme.onSuccessSubtle : theme.textMuted}>
                {shop.open ? 'Đang mở' : 'Đã đóng'}
              </Text>
            </View>
          </View>
          <RatingSummary average={shop.ratingAverage} count={shop.ratingCount} />
          <Text variant="bodySm" muted>
            {shop.address}
          </Text>
          <Text variant="bodySm" muted>
            {[formatDistance(shop.distanceKm), deliveryText(shop)].filter(Boolean).join(' · ')}
          </Text>
          {shop.minOrderValue ? (
            <Text variant="caption" muted>
              Đơn tối thiểu {formatVnd(shop.minOrderValue)}
            </Text>
          ) : null}
          {!shop.open ? (
            <Text variant="bodySm" color={theme.onWarningSubtle}>
              Quán đang đóng cửa, bạn vẫn xem được thực đơn.
            </Text>
          ) : null}
          <Button title="Nhắn tin cho quán" variant="outline" onPress={() => router.push({ pathname: '/customer/chat', params: { vendorId: shop.id } })} />
        </Card>
      ) : null}
      {menu.data && (menu.data.sections ?? []).length === 0 ? (
        <Card>
          <Text muted>Quán chưa có món nào.</Text>
        </Card>
      ) : null}
      {(menu.data?.sections ?? []).map((section) => (
        <Card key={section.id}>
          <Text variant="titleSm">{section.name}</Text>
          {(section.items ?? []).map((item) => (
            <DishRow key={item.id} item={item} onPress={() => setDish(item)} />
          ))}
        </Card>
      ))}
      {shop?.id ? <ShopReviewsCard vendorId={shop.id} /> : null}
      <DishSheet dish={dish} shop={cartShop} canOrder={Boolean(shop?.open) && !dish?.soldOut} onAdd={addToCart} onClose={() => setDish(null)} />
    </Screen>
    <CartBar />
    </View>
  )
}

function DishRow({ item, onPress }: { item: ShopDish; onPress: () => void }) {
  const theme = useTheme()
  const soldOut = Boolean(item.soldOut)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${soldOut ? ', hết món' : ''}`}
      onPress={onPress}
      style={[styles.dish, { borderTopColor: theme.divider }]}
    >
      <View style={[styles.flex, soldOut && styles.soldOut]}>
        <Text variant="body">{item.name}</Text>
        {item.description ? (
          <Text variant="bodySm" muted numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <Text variant="bodySm" style={styles.money}>
          {formatVnd(item.price)}
        </Text>
        {soldOut ? (
          <Text variant="caption" color={theme.onWarningSubtle}>
            Hết món
          </Text>
        ) : null}
      </View>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={[styles.photo, soldOut && styles.soldOut]} contentFit="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.photo, { backgroundColor: theme.imageSlot }, soldOut && styles.soldOut]} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dish: { flexDirection: 'row', gap: spacing.md, borderTopWidth: 1, paddingVertical: spacing.md, minHeight: touchTarget.min },
  soldOut: { opacity: 0.5 },
  photo: { width: 72, height: 72 },
  money: { fontVariant: ['tabular-nums'] },
})

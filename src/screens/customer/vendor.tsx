import { Image } from 'expo-image'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useLayoutEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAddresses } from '@/entities/address'
import { deliveryText, formatDistance, useShopMenu, type ShopDish } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Card, Notice, Screen, Sheet, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

/** A shop's menu (view-vendor-menu.md): sections and dishes, sold-out dishes greyed out, options shown read-only. */
export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const theme = useTheme()
  const addresses = useAddresses()
  const address = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0]
  const position = address?.lat !== undefined && address?.lng !== undefined ? { lat: address.lat, lng: address.lng } : null
  const menu = useShopMenu(id, position)
  const [dish, setDish] = useState<ShopDish | null>(null)
  const shop = menu.data?.shop

  useLayoutEffect(() => {
    navigation.setOptions({ title: shop?.name ?? 'Quán' })
  }, [navigation, shop?.name])

  return (
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
      <DishSheet dish={dish} onClose={() => setDish(null)} />
    </Screen>
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

/** The dish and the choices it offers; ordering arrives in Sprint 4, so the options are only shown. */
function DishSheet({ dish, onClose }: { dish: ShopDish | null; onClose: () => void }) {
  const theme = useTheme()
  return (
    <Sheet visible={dish !== null} onClose={onClose} title={dish?.name ?? ''}>
      {dish?.description ? <Text muted>{dish.description}</Text> : null}
      <Text variant="titleSm" style={styles.money}>
        {formatVnd(dish?.price)}
      </Text>
      {(dish?.optionGroups ?? []).map((group) => (
        <View key={group.id} style={styles.group}>
          <Text variant="bodySm" style={styles.groupName}>
            {group.name}{' '}
            <Text variant="caption" muted>
              {group.min === 0 ? 'Tuỳ chọn' : 'Bắt buộc'}, chọn {group.min === group.max ? group.max : `${group.min}–${group.max}`}
            </Text>
          </Text>
          {(group.options ?? []).map((option) => (
            <View key={option.id} style={[styles.option, { borderTopColor: theme.divider }]}>
              <Text variant="body" muted={!option.available} style={styles.flex}>
                {option.name}
                {option.available ? '' : ' · hết'}
              </Text>
              <Text variant="bodySm" muted style={styles.money}>
                {option.priceDelta ? `+${formatVnd(option.priceDelta)}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ))}
      <Text variant="caption" muted>
        {dish?.soldOut ? 'Món này đang hết.' : 'Đặt món sẽ có trong bản cập nhật tới.'}
      </Text>
    </Sheet>
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
  group: { gap: spacing.xs },
  groupName: { fontFamily: fonts.semibold },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, minHeight: touchTarget.min },
})

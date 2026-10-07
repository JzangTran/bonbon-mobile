import { useRouter } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useAddresses } from '@/entities/address'
import { useCategoryLeaves } from '@/entities/category'
import { RatingSummary } from '@/entities/review'
import { deliveryText, formatDistance, useShopsInArea, type Shop } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Text, radius, spacing, touchTarget, useTheme } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { NotificationBell } from '@/widgets/notification-bell'

/** Shops that deliver to the default address: search, category filter, open shops first (browse-vendors-in-area.md). */
export default function CustomerHomeScreen() {
  const router = useRouter()
  const addresses = useAddresses()
  const leaves = useCategoryLeaves()
  const address = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0]
  const position = address?.lat !== undefined && address?.lng !== undefined ? { lat: address.lat, lng: address.lng } : null

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])
  const shops = useShopsInArea(position, debounced, categoryId)
  const list = shops.data?.items ?? []

  return (
    <View style={styles.flex}>
    <Screen>
      <View style={styles.top}>
        <View style={styles.flex}>
          <AddressBar loading={addresses.isPending} label={address?.label} text={address?.formattedAddress} onPress={() => router.push('/customer/addresses')} />
        </View>
        <NotificationBell href="/customer/notifications" />
      </View>
      {addresses.data && !address ? (
        <Card>
          <Text variant="titleSm">Bạn muốn nhận món ở đâu?</Text>
          <Text muted>Thêm địa chỉ giao hàng để xem các quán giao tới nơi bạn ở.</Text>
          <Button title="+ Thêm địa chỉ" fullWidth onPress={() => router.push('/customer/address-form')} />
        </Card>
      ) : null}
      {address ? (
        <>
          <Input label="Tìm quán hoặc món" placeholder="Ví dụ: phở, cơm tấm" value={query} onChangeText={setQuery} autoCorrect={false} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Tất cả" selected={categoryId === null} onPress={() => setCategoryId(null)} />
            {(leaves.data ?? []).map((leaf) => (
              <Chip key={leaf.id} label={leaf.name} selected={categoryId === leaf.id} onPress={() => setCategoryId(leaf.id)} />
            ))}
          </ScrollView>
          {shops.isError ? <Notice tone="error" message={problemMessage(shops.error)} /> : null}
          {shops.isPending ? <Text muted>Đang tìm quán…</Text> : null}
          {shops.data && list.length === 0 ? (
            <Card>
              <Text variant="titleSm">{debounced || categoryId ? 'Không có quán phù hợp' : 'Chưa có quán nào giao tới đây'}</Text>
              <Text muted>
                {debounced || categoryId
                  ? 'Thử từ khoá khác hoặc bỏ bộ lọc ngành hàng.'
                  : 'Quán trong khu của bạn sẽ hiện ở đây khi họ mở bán trên bonbon.'}
              </Text>
            </Card>
          ) : null}
          {list.map((shop) => (
            <ShopCard key={shop.id} shop={shop} onPress={() => router.push({ pathname: '/customer/vendor', params: { id: shop.id } })} />
          ))}
        </>
      ) : null}
    </Screen>
    <CartBar />
    </View>
  )
}

function AddressBar({ loading, label, text, onPress }: { loading: boolean; label?: string; text?: string; onPress: () => void }) {
  const theme = useTheme()
  if (loading) return null
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Đổi địa chỉ giao hàng" onPress={onPress} style={styles.address}>
      <MapPin size={20} color={theme.primary} />
      <View style={styles.flex}>
        <Text variant="caption" muted>
          Giao đến
        </Text>
        <Text variant="bodySm" numberOfLines={1}>
          {text ? `${label}: ${text}` : 'Chưa chọn địa chỉ'}
        </Text>
      </View>
      <Text variant="bodySm" color={theme.primary}>
        Đổi
      </Text>
    </Pressable>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? theme.primary : theme.borderInput, backgroundColor: selected ? theme.primarySubtle : theme.surface },
      ]}
    >
      <Text variant="bodySm" color={selected ? theme.onPrimarySubtle : theme.text}>
        {label}
      </Text>
    </Pressable>
  )
}

function ShopCard({ shop, onPress }: { shop: Shop; onPress: () => void }) {
  const theme = useTheme()
  const distance = formatDistance(shop.distanceKm)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${shop.name}, ${shop.open ? 'đang mở' : 'đang đóng'}`} onPress={onPress}>
      <Card style={[styles.shop, !shop.open && styles.closed]}>
        <View style={[styles.cover, { backgroundColor: theme.imageSlot }]} />
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text variant="titleSm" style={styles.flex} numberOfLines={1}>
              {shop.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: shop.open ? theme.successSubtle : theme.surfaceMuted }]}>
              <Text variant="caption" color={shop.open ? theme.onSuccessSubtle : theme.textMuted}>
                {shop.open ? 'Đang mở' : 'Đã đóng'}
              </Text>
            </View>
          </View>
          <RatingSummary average={shop.ratingAverage} count={shop.ratingCount} />
          <Text variant="bodySm" muted numberOfLines={1}>
            {[distance, deliveryText(shop)].filter(Boolean).join(' · ')}
          </Text>
          {shop.minOrderValue ? (
            <Text variant="caption" muted>
              Đơn tối thiểu {formatVnd(shop.minOrderValue)}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  address: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget.min },
  chips: { gap: spacing.sm },
  chip: { minHeight: touchTarget.min, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  shop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  closed: { opacity: 0.7 },
  cover: { width: 72, height: 72 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
})

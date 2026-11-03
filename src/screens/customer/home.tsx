import { useRouter } from 'expo-router'
import { ArrowRight, MapPin, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated'
import { useDeliveryPoint } from '@/entities/address'
import { useCategoryLeaves } from '@/entities/category'
import { RatingSummary } from '@/entities/review'
import { useSession } from '@/entities/session'
import { deliveryText, formatDistance, useShopsInArea, type Shop } from '@/entities/vendor'
import { problemMessage } from '@/shared/api'
import { formatVnd } from '@/shared/lib/format'
import { mockPhoto } from '@/shared/lib/mock-photos'
import { Button, Card, Notice, Screen, Text, fonts, radius, spacing, touchTarget, typography, useTheme } from '@/shared/ui'
import { CartBar } from '@/widgets/cart-bar'
import { NotificationBell } from '@/widgets/notification-bell'

/**
 * The first screen of the app, signed in or not: shops that deliver to the default address (or, for a guest, to the place they
 * typed), search, category filter, open shops first (browse-vendors-in-area.md).
 */
export default function CustomerHomeScreen() {
  const router = useRouter()
  const theme = useTheme()
  const { session } = useSession()
  const guest = !session
  const point = useDeliveryPoint(!guest)
  const leaves = useCategoryLeaves()
  const position = point.position
  const pickAddress = () => router.push(guest ? '/customer/pick-location' : '/customer/addresses')

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
          <AddressBar loading={point.loading} label={point.label} text={point.text} onPress={pickAddress} />
        </View>
        {guest ? (
          <Button title="Đăng nhập" variant="outline" onPress={() => router.push('/login')} />
        ) : (
          <NotificationBell href="/customer/notifications" />
        )}
      </View>
      {point.missing ? (
        <Card>
          <Text variant="titleSm">Bạn muốn nhận món ở đâu?</Text>
          <Text muted>
            {guest ? 'Nhập địa chỉ của bạn để xem các quán giao tới. Chưa cần tài khoản.' : 'Thêm địa chỉ giao hàng để xem các quán giao tới nơi bạn ở.'}
          </Text>
          <Button
            title={guest ? 'Nhập địa chỉ' : '+ Thêm địa chỉ'}
            fullWidth
            onPress={() => router.push(guest ? '/customer/pick-location' : '/customer/address-form')}
          />
        </Card>
      ) : null}
      {position ? (
        <>
          <Text variant="display" style={styles.headline} accessibilityRole="header">
            Hôm nay bạn <Text variant="display" color={theme.headlineSoft} style={styles.headline}>muốn ăn gì?</Text>
          </Text>
          <View style={[styles.search, { backgroundColor: theme.surfaceMuted }]}>
            <Search size={18} color={theme.textMuted} />
            <TextInput
              accessibilityLabel="Tìm quán hoặc món"
              placeholder="Tìm món hoặc quán"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={[styles.searchInput, typography.bodySm, { color: theme.text }]}
            />
          </View>
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
          {list.map((shop, index) => (
            <ShopCard key={shop.id} shop={shop} index={index} onPress={() => router.push({ pathname: '/customer/vendor', params: { id: shop.id } })} />
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
      <View style={[styles.round, { backgroundColor: theme.surfaceMuted }]}>
        <MapPin size={20} color={theme.primary} strokeWidth={1.75} />
      </View>
      <View style={styles.flex}>
        <Text variant="caption" muted>
          Giao tới
        </Text>
        <Text variant="bodySm" style={styles.addressText} numberOfLines={1}>
          {text ? `${label ? `${label}: ` : ''}${text} ▾` : 'Chưa chọn địa chỉ ▾'}
        </Text>
      </View>
    </Pressable>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? theme.surface : theme.surfaceMuted, borderColor: selected ? theme.primary : 'transparent' }]}
    >
      <Text variant="bodySm" color={selected ? theme.primary : theme.textMuted} style={styles.chipLabel}>
        {label}
      </Text>
    </Pressable>
  )
}

function ShopCard({ shop, index, onPress }: { shop: Shop; index: number; onPress: () => void }) {
  const theme = useTheme()
  const distance = formatDistance(shop.distanceKm)
  const photo = mockPhoto(shop.id ?? '', shop.name ?? '')
  return (
    // The first cards fade up once as the list appears; the system's reduce-motion setting turns it off.
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60).duration(320).reduceMotion(ReduceMotion.System)}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${shop.name}, ${shop.open ? 'đang mở' : 'đang đóng'}`} onPress={onPress}>
      <Card style={[styles.shop, !shop.open && styles.closed]}>
        <View style={[styles.cover, { backgroundColor: theme.imageSlot }]}>
          {/* the cover photo is decoration; the button's label names the shop */}
          <View aria-hidden style={StyleSheet.absoluteFill}>
            {photo ? <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" alt="" accessibilityIgnoresInvertColors /> : null}
          </View>
          {distance ? (
            <View style={[styles.pill, styles.pillLeft, { backgroundColor: theme.ink }]}>
              <Text variant="caption" color="#FFFFFF" style={styles.pillText}>
                {distance}
              </Text>
            </View>
          ) : null}
          <View style={[styles.pill, styles.pillRight, { backgroundColor: theme.surface }]}>
            <Text variant="caption" color={shop.open ? theme.onSuccessSubtle : theme.textMuted} style={styles.pillText}>
              {shop.open ? 'Đang mở' : 'Đã đóng'}
            </Text>
          </View>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text variant="titleSm" numberOfLines={1}>
              {shop.name}
            </Text>
            <RatingSummary average={shop.ratingAverage} count={shop.ratingCount} />
            <Text variant="bodySm" muted numberOfLines={1}>
              {deliveryText(shop)}
              {shop.minOrderValue ? ` · tối thiểu ${formatVnd(shop.minOrderValue)}` : ''}
            </Text>
          </View>
          <View style={[styles.go, { backgroundColor: theme.text }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <ArrowRight size={18} color={theme.background} strokeWidth={2} />
          </View>
        </View>
      </Card>
    </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  address: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min },
  addressText: { fontFamily: fonts.semibold },
  round: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  headline: { fontFamily: fonts.semibold, letterSpacing: -0.6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touchTarget.min, borderRadius: radius.pill, paddingHorizontal: spacing.lg },
  searchInput: { flex: 1, minHeight: touchTarget.min, paddingVertical: 0 },
  chips: { gap: spacing.sm },
  chip: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  chipLabel: { fontFamily: fonts.semibold },
  shop: { padding: 10, gap: 10, borderRadius: radius.card },
  closed: { opacity: 0.7 },
  cover: { height: 150, borderRadius: radius.media, overflow: 'hidden' },
  pill: { position: 'absolute', top: 10, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pillLeft: { left: 10 },
  pillRight: { right: 10 },
  pillText: { fontFamily: fonts.semibold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 6, paddingBottom: 4 },
  go: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
})

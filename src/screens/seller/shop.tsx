import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Linking, StyleSheet, Switch, View } from 'react-native'
import { SHOP_QUERY_KEY, useShop } from '@/entities/shop'
import { api, problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { Button, Card, Text, Screen, radius, spacing, useTheme, useToast } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const vnd = new Intl.NumberFormat('vi-VN')

function todayHours(hours: { weekday?: number; opensAt?: string; closesAt?: string }[] | undefined) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
  const weekday = ((now.getDay() + 6) % 7) + 1
  const today = (hours ?? []).filter((h) => h.weekday === weekday)
  return `${WEEKDAYS[weekday - 1]}: ${
    today.length ? today.map((h) => `${h.opensAt?.slice(0, 5)}–${h.closesAt?.slice(0, 5)}`).join(', ') : 'nghỉ'
  }`
}

/** The approved shop at a glance (pause-orders.md): open state, the intake switch, and the main settings. */
export default function SellerShopScreen() {
  const theme = useTheme()
  const toast = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const shop = useShop()
  const data = shop.data
  const accepting = data?.acceptingOrders ?? false
  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { data: view, error } = await api.PUT('/api/merchant/shop/accepting-orders', { body: { accepting: next } })
      if (error || !view) throw error
      return view
    },
    onSuccess: (view) => {
      queryClient.setQueryData(SHOP_QUERY_KEY, view)
      toast.show(view.acceptingOrders ? 'Đã nhận đơn trở lại.' : 'Đã tạm ngưng nhận đơn.')
    },
    onError: (e) => toast.show(problemMessage(e), 'error'),
  })
  const s = data?.shipping

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: theme.surfaceMuted }]} />
        <View style={styles.flex}>
          <Text variant="title">{data?.shop?.name}</Text>
          <View style={[styles.badge, { backgroundColor: theme.successSubtle }]}>
            <Text variant="caption" color={theme.onSuccessSubtle}>
              ✓ Đã xác minh
            </Text>
          </View>
        </View>
      </View>

      <Card style={{ borderWidth: 2, borderColor: data?.openNow ? theme.success : theme.divider }}>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text variant="titleSm">{accepting ? 'Đang nhận đơn' : 'Đang tạm ngưng'}</Text>
            <Text variant="bodySm" muted>
              {data?.openNow ? 'Đang trong giờ mở cửa' : accepting ? 'Ngoài giờ mở cửa' : 'Không nhận đơn mới, kể cả trong giờ mở cửa'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Nhận đơn"
            value={accepting}
            disabled={toggle.isPending}
            onValueChange={(next) => toggle.mutate(next)}
            trackColor={{ true: theme.success, false: theme.borderInput }}
          />
        </View>
        <Text variant="caption" muted>
          Tạm ngưng dừng đơn mới ngay; đơn đã nhận không bị huỷ.
        </Text>
      </Card>

      <Card>
        <Row title="Địa chỉ" value={[data?.shop?.address?.detail, data?.shop?.address?.formattedAddress].filter(Boolean).join(' · ')} />
        <Row title="Giờ mở cửa hôm nay" value={todayHours(s?.openingHours)} />
        <Row
          title="Giao hàng"
          value={`Bán kính ${s?.deliveryRadiusKm ?? '—'} km · phí ${s?.deliveryFee != null ? `${vnd.format(s.deliveryFee)} ₫` : '—'}${
            s?.freeDeliveryThreshold != null ? ` · miễn phí từ ${vnd.format(s.freeDeliveryThreshold)} ₫` : ''
          }`}
        />
        <Button title="Sửa thông tin trên web" variant="outline" onPress={() => Linking.openURL(`${env.webUrl}/seller/shop`)} />
      </Card>

      <Card>
        <Text variant="titleSm">Đánh giá của khách</Text>
        <Text variant="bodySm" muted>
          Xem khách nói gì về quán và phản hồi công khai.
        </Text>
        <Button title="Xem đánh giá" variant="outline" onPress={() => router.push('/seller/reviews')} />
      </Card>

      <AccountPanel />
    </Screen>
  )
}

function Row({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodySm" muted>
        {title}
      </Text>
      <Text variant="body">{value || '—'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: { width: 56, height: 56, borderRadius: radius.sm },
  badge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  row: { gap: 2, paddingVertical: spacing.xs },
  flex: { flex: 1 },
})

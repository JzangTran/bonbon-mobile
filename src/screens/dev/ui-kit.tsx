import { Bell, Heart, MapPin, Search, X } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ORDER_STATUSES, OrderStatusBadge } from '@/entities/order'
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  IconButton,
  InlineMessage,
  ListItem,
  Price,
  QuantityStepper,
  Rating,
  ResultPage,
  Screen,
  Sheet,
  Spinner,
  Switch,
  Text,
  TextField,
  spacing,
  useSnackbar,
  useTheme,
  type TextTone,
} from '@/shared/ui'

const TYPE = ['title1', 'title2', 'title3', 'body', 'bodySm', 'label', 'caption'] as const
const TONES: TextTone[] = ['default', 'secondary', 'tertiary', 'link', 'success', 'warning', 'danger', 'info']

/** Development-only catalogue of the design v5 kit, tier by tier, with the bonbon tokens applied (the web's Resources › Components). */
export default function UiKitScreen() {
  const theme = useTheme()
  const { snackbar } = useSnackbar()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [chips, setChips] = useState<string[]>(['Gần nhất'])
  const [accepting, setAccepting] = useState(true)
  const [qty, setQty] = useState(1)
  const [phone, setPhone] = useState('0912')

  if (!__DEV__) return null

  return (
    <Screen title="UI kit v5">
      <Card>
        <Text variant="title3">Text · tám kiểu</Text>
        {TYPE.map((v) => (
          <Text key={v} variant={v}>
            {v} · Đặt món ngay trong khu
          </Text>
        ))}
        <View style={styles.wrap}>
          {TONES.map((t) => (
            <Text key={t} variant="bodySm" tone={t}>
              {t}
            </Text>
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="title3">Button, IconButton</Text>
        <Button title="Nhận đơn" />
        <Button title="Đặt món · 95.000 ₫" size="lg" fullWidth />
        <Button title="Từ chối" variant="outline" />
        <Button title="Bỏ qua" variant="ghost" />
        <Button title="Xoá món" variant="destructive" />
        <Button title="Đang lưu" loading />
        <View style={styles.wrap}>
          <IconButton label="Tìm" icon={<Search size={22} color={theme.text} />} />
          <IconButton label="Thông báo" variant="secondary" icon={<Bell size={22} color={theme.text} />} />
          <IconButton label="Đóng" variant="outline" icon={<X size={22} color={theme.text} />} />
        </View>
      </Card>

      <Card>
        <Text variant="title3">Chip, Switch, Badge</Text>
        <View style={styles.wrap}>
          {['Gần nhất', 'Cơm', 'Bún, phở', 'Đồ uống'].map((c) => (
            <Chip key={c} label={c} selected={chips.includes(c)} onPress={() => setChips((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))} />
          ))}
        </View>
        <Switch label={accepting ? 'Đang nhận đơn' : 'Tạm ngưng nhận đơn'} description="Khách đặt được món khi bật." value={accepting} onValueChange={setAccepting} />
        <View style={styles.wrap}>
          <Badge label="Mới" tone="accent" />
          <Badge label="Đã thanh toán" tone="success" />
          <Badge label="Sắp hết giờ" tone="warning" />
          <Badge label="Bị từ chối" tone="danger" />
          <Badge label="Đang giao" tone="info" />
          <Badge label="Giảm 15k" tone="promo" />
          <Badge label="Nháp" />
        </View>
        <View style={styles.wrap}>
          {ORDER_STATUSES.map((s) => (
            <OrderStatusBadge key={s} status={s} />
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="title3">TextField</Text>
        <TextField label="Địa chỉ giao hàng" placeholder="Toà S2.05, căn 1203" help="Ghi số toà và căn để quán giao tận cửa." />
        <TextField label="Số điện thoại" required keyboardType="phone-pad" value={phone} onChangeText={setPhone} error="Số điện thoại cần 10 chữ số, ví dụ 0912345678." />
      </Card>

      <Card>
        <Text variant="title3">Avatar, ListItem, commerce</Text>
        <View style={styles.wrap}>
          <Avatar name="Bếp Sen" size="sm" />
          <Avatar name="Hoàng Minh Anh" />
          <Avatar name="Quán Cơm Demo" size="lg" />
        </View>
        <ListItem leading={<MapPin size={20} color={theme.textSecondary} />} title="Địa chỉ giao hàng" description="Toà S2.05, Vinhomes Smart City" onPress={() => {}} />
        <ListItem leading={<Heart size={20} color={theme.textSecondary} />} title="Quán yêu thích" trailing="12" onPress={() => {}} />
        <ListItem title="Phí giao" trailing={<Price amount={10000} size="sm" />} />
        <View style={styles.wrap}>
          <Price amount={38000} original={45000} />
          <Rating score={4.8} count={126} />
          <Rating score={null} count={0} />
        </View>
        <QuantityStepper value={qty} onChange={setQty} min={0} max={20} label="Cơm gà xối mỡ" />
        <Spinner />
      </Card>

      <Card>
        <Text variant="title3">Phản hồi</Text>
        <InlineMessage tone="danger" title="Chưa lưu được món" action={<Button title="Thử lại" variant="outline" />}>
          Máy chủ không phản hồi. Nội dung vẫn còn trên trang; thử lại sau ít phút.
        </InlineMessage>
        <InlineMessage tone="success" title="Đã lưu nháp lúc 14:02">
          Khách chưa thấy món này cho tới khi bạn bấm Đăng bán.
        </InlineMessage>
        <Banner tone="warning" title="Quán đang tạm ngưng nhận đơn đến 12:30" action={<Button title="Nhận đơn lại" variant="outline" />}>
          Khách vẫn thấy quán nhưng không đặt được.
        </Banner>
        <Button title="Snackbar có hoàn tác" variant="outline" onPress={() => snackbar({ message: 'Đã xoá món Trà đá', onUndo: () => {} })} />
        <Button title="Mở sheet" variant="outline" onPress={() => setSheetOpen(true)} />
      </Card>

      <Card>
        <ResultPage
          title="Đã gửi đơn #1025 tới Bếp Sen"
          description="Bạn có thể huỷ miễn phí trước khi quán nhận."
          next={['Quán nhận đơn, thường trong 3 phút', 'Bạn thấy giờ giao dự kiến', 'Món tới sảnh toà S2.05']}
          primary={<Button title="Theo dõi đơn" fullWidth />}
        />
      </Card>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Tuỳ chọn món">
        <Text tone="secondary">Size, topping và ghi chú.</Text>
        <Button title="Thêm vào giỏ · 45.000 ₫" fullWidth onPress={() => setSheetOpen(false)} />
      </Sheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
})

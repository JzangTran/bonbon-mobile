import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ORDER_STATUSES, OrderStatusBadge } from '@/entities/order'
import { Button, Card, Input, Screen, Sheet, Text, spacing, useToast } from '@/shared/ui'

/** Development-only catalogue of the base components with bonbon tokens applied. */
export default function UiKitScreen() {
  const toast = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!__DEV__) return null

  return (
    <Screen>
      <Text variant="headline">bonbon UI kit</Text>

      <Card>
        <Text variant="title">Buttons</Text>
        <Button title="Xác nhận đơn" />
        <Button title="Chuyển sang Đang giao" size="lg" fullWidth />
        <Button title="Xem chi tiết" variant="outline" />
        <Button title="Bỏ qua" variant="ghost" />
        <Button title="Từ chối đơn" variant="destructive" />
        <Button title="Đang xử lý" loading />
      </Card>

      <Card>
        <Text variant="title">Order status</Text>
        <View style={styles.wrap}>
          {ORDER_STATUSES.map((s) => (
            <OrderStatusBadge key={s} status={s} />
          ))}
        </View>
      </Card>

      <Card>
        <Text variant="title">Form</Text>
        <Input label="Địa chỉ giao hàng" placeholder="Toà A, căn 12.05" />
        <Input label="Số điện thoại" defaultValue="09xx" error="Số điện thoại chưa đúng định dạng." />
      </Card>

      <Card>
        <Text variant="title">Overlays</Text>
        <Button title="Mở sheet" variant="outline" onPress={() => setSheetOpen(true)} />
        <Button title="Hiện toast" variant="outline" onPress={() => toast.show('Đã thêm vào giỏ')} />
      </Card>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Tuỳ chọn món">
        <Text muted>Size, topping và ghi chú.</Text>
        <Button title="Thêm vào giỏ" fullWidth onPress={() => setSheetOpen(false)} />
      </Sheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
})

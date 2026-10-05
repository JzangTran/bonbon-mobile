import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useAddresses } from '@/entities/address'
import { lineTotal, unitPrice, useCart } from '@/entities/cart'
import { newIdempotencyKey, usePlaceOrder } from '@/entities/order'
import { problemMessage } from '@/shared/api'
import { confirm } from '@/shared/lib/confirm'
import { formatVnd } from '@/shared/lib/format'
import { Button, Card, Input, Notice, Screen, Text, fonts, radius, spacing, touchTarget, useTheme, useToast } from '@/shared/ui'

/**
 * The cart and checkout (place-order.md): the customer reviews the lines, picks one of their addresses, adds a
 * delivery note and places a cash-on-delivery order. Prices shown here are a preview; the server prices the order.
 */
export default function CartScreen() {
  const router = useRouter()
  const theme = useTheme()
  const toast = useToast()
  const cart = useCart()
  const addresses = useAddresses()
  const place = usePlaceOrder()
  const [note, setNote] = useState('')
  const [chosenAddress, setChosenAddress] = useState<string | null>(null)
  // One key per checkout attempt: a retry after a timeout returns the same order instead of a second one.
  const [key, setKey] = useState(newIdempotencyKey)

  const list = addresses.data ?? []
  const address = list.find((a) => a.id === chosenAddress) ?? list.find((a) => a.isDefault) ?? list[0]
  const { totals, shop } = cart
  const canOrder = Boolean(address) && totals.count > 0 && !totals.belowMinimum

  if (!cart.ready) return <Screen>{null}</Screen>
  if (cart.lines.length === 0) {
    return (
      <Screen>
        <Card>
          <Text variant="titleSm">Giỏ hàng trống</Text>
          <Text muted>Chọn quán và thêm món bạn muốn đặt.</Text>
          <Button title="Xem các quán" fullWidth onPress={() => router.replace('/customer')} />
        </Card>
      </Screen>
    )
  }

  const submit = () => {
    if (!shop || !address?.id) return
    place.mutate(
      {
        idempotencyKey: key,
        body: {
          vendorId: shop.id,
          addressId: address.id,
          paymentMethod: 'COD',
          ...(note.trim() ? { note: note.trim() } : {}),
          items: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            optionIds: l.options.map((o) => o.id),
            ...(l.note ? { note: l.note } : {}),
          })),
        },
      },
      {
        onSuccess: () => {
          cart.clear()
          toast.show('Đã đặt đơn. Quán sẽ xác nhận trong ít phút.')
          router.replace('/customer/orders')
        },
        // The cart or the shop may change before the next try, and then it is a different order.
        onError: () => setKey(newIdempotencyKey()),
      },
    )
  }

  return (
    <Screen>
      <Card>
        <Text variant="titleSm">{shop?.name}</Text>
        {cart.lines.map((line) => (
          <View key={line.key} style={[styles.line, { borderTopColor: theme.divider }]}>
            <View style={styles.flex}>
              <Text>{line.name}</Text>
              {line.options.length > 0 ? (
                <Text variant="bodySm" muted>
                  {line.options.map((o) => o.name).join(', ')}
                </Text>
              ) : null}
              {line.note ? (
                <Text variant="bodySm" muted>
                  Ghi chú: {line.note}
                </Text>
              ) : null}
              <Text variant="bodySm" style={styles.money}>
                {formatVnd(unitPrice(line))} × {line.quantity} = {formatVnd(lineTotal(line))}
              </Text>
            </View>
            <View style={styles.stepper}>
              <Button title="−" variant="outline" accessibilityLabel={`Giảm ${line.name}`} onPress={() => cart.setQuantity(line.key, line.quantity - 1)} />
              <Text style={styles.qty}>{line.quantity}</Text>
              <Button title="+" variant="outline" accessibilityLabel={`Tăng ${line.name}`} onPress={() => cart.setQuantity(line.key, line.quantity + 1)} />
            </View>
          </View>
        ))}
        <Button
          title="Xoá giỏ hàng"
          variant="ghost"
          onPress={async () => {
            if (await confirm('Xoá giỏ hàng?', 'Tất cả món trong giỏ sẽ bị xoá.', 'Xoá')) cart.clear()
          }}
        />
      </Card>

      <Card>
        <Text variant="titleSm">Giao đến</Text>
        {list.length === 0 && !addresses.isPending ? (
          <>
            <Text muted>Bạn chưa có địa chỉ giao hàng.</Text>
            <Button title="+ Thêm địa chỉ" fullWidth onPress={() => router.push('/customer/address-form')} />
          </>
        ) : null}
        {list.map((a) => {
          const selected = a.id === address?.id
          return (
            <Pressable
              key={a.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setChosenAddress(a.id ?? null)}
              style={[styles.address, { borderColor: selected ? theme.primary : theme.borderInput, backgroundColor: selected ? theme.primarySubtle : theme.surface }]}
            >
              <Text variant="bodySm" style={styles.bold}>
                {a.label}
              </Text>
              <Text variant="bodySm" numberOfLines={2}>
                {a.detail ? `${a.detail} · ` : ''}
                {a.formattedAddress}
              </Text>
              <Text variant="caption" muted>
                {a.recipientName} · {a.recipientPhone}
              </Text>
            </Pressable>
          )
        })}
        <Input label="Ghi chú giao hàng (không bắt buộc)" value={note} onChangeText={setNote} maxLength={300} placeholder="Ví dụ: gọi trước khi tới" />
      </Card>

      <Card>
        <Text variant="titleSm">Thanh toán</Text>
        <Text>Tiền mặt khi nhận hàng</Text>
        <View style={styles.sum}>
          <Text muted>Tiền món</Text>
          <Text style={styles.money}>{formatVnd(totals.itemsTotal)}</Text>
        </View>
        <View style={styles.sum}>
          <Text muted>Phí giao</Text>
          <Text style={styles.money}>{totals.deliveryFee === 0 ? 'Miễn phí' : formatVnd(totals.deliveryFee)}</Text>
        </View>
        <View style={styles.sum}>
          <Text variant="titleSm">Tổng cộng</Text>
          <Text variant="titleSm" style={styles.money}>
            {formatVnd(totals.grandTotal)}
          </Text>
        </View>
        {totals.belowMinimum && typeof shop?.minOrderValue === 'number' ? (
          <Notice tone="error" message={`Đơn tối thiểu của quán là ${formatVnd(shop.minOrderValue)}. Hãy thêm món.`} />
        ) : null}
        {place.isError ? <Notice tone="error" message={problemMessage(place.error)} /> : null}
        <Button title={`Đặt đơn · ${formatVnd(totals.grandTotal)}`} size="lg" fullWidth disabled={!canOrder} loading={place.isPending} onPress={submit} />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, paddingTop: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qty: { minWidth: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
  money: { fontVariant: ['tabular-nums'] },
  sum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  address: { minHeight: touchTarget.min, padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, gap: 2 },
  bold: { fontFamily: fonts.semibold },
})

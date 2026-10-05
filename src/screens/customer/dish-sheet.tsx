import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { MAX_LINE_QUANTITY, type CartLine, type CartShop } from '@/entities/cart'
import type { ShopDish } from '@/entities/vendor'
import { formatVnd } from '@/shared/lib/format'
import { Button, Input, Sheet, Text, fonts, radius, spacing, touchTarget, useTheme } from '@/shared/ui'

type Group = NonNullable<ShopDish['optionGroups']>[number]

/** The options a customer starts with: the shop's defaults, as far as each group's maximum allows. */
function initialSelection(dish: ShopDish): string[] {
  const picked: string[] = []
  for (const group of dish.optionGroups ?? []) {
    const defaults = (group.options ?? []).filter((o) => o.defaultChoice && o.available).slice(0, group.max ?? 1)
    picked.push(...defaults.map((o) => o.id!))
  }
  return picked
}

function rule(group: Group) {
  const range = group.min === group.max ? `${group.max}` : `${group.min}–${group.max}`
  return `${group.min === 0 ? 'Tuỳ chọn' : 'Bắt buộc'}, chọn ${range}`
}

/**
 * A dish with its option groups: the customer picks within each group's min and max, sets a quantity and a note,
 * and adds it to the cart. The server checks everything again when the order is placed.
 */
export function DishSheet({
  dish,
  shop,
  canOrder,
  onAdd,
  onClose,
}: {
  dish: ShopDish | null
  shop: CartShop | null
  /** False when the shop is closed or the dish is sold out: the customer may look, not add. */
  canOrder: boolean
  onAdd: (line: Omit<CartLine, 'key'>) => void
  onClose: () => void
}) {
  // The body is keyed by dish, so choices start over for every dish that is opened.
  return (
    <Sheet visible={dish !== null} onClose={onClose} title={dish?.name ?? ''}>
      {dish && shop ? <DishForm key={dish.id} dish={dish} canOrder={canOrder} onAdd={onAdd} /> : null}
    </Sheet>
  )
}

function DishForm({ dish, canOrder, onAdd }: { dish: ShopDish; canOrder: boolean; onAdd: (line: Omit<CartLine, 'key'>) => void }) {
  const theme = useTheme()
  const { height } = useWindowDimensions()
  const [selected, setSelected] = useState<string[]>(() => initialSelection(dish))
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const groups = dish.optionGroups ?? []

  const chosen = groups.flatMap((g) => (g.options ?? []).filter((o) => selected.includes(o.id!)).map((o) => ({ group: g, option: o })))
  const unit = (dish.price ?? 0) + chosen.reduce((sum, c) => sum + (c.option.priceDelta ?? 0), 0)
  const problem = groups.find((g) => {
    const count = (g.options ?? []).filter((o) => selected.includes(o.id!)).length
    return count < (g.min ?? 0) || count > (g.max ?? 1)
  })

  const toggle = (group: Group, optionId: string) => {
    setSelected((current) => {
      if (current.includes(optionId)) return current.filter((id) => id !== optionId)
      const inGroup = (group.options ?? []).map((o) => o.id!)
      if ((group.max ?? 1) === 1) return [...current.filter((id) => !inGroup.includes(id)), optionId]
      const count = current.filter((id) => inGroup.includes(id)).length
      return count >= (group.max ?? 1) ? current : [...current, optionId]
    })
  }

  return (
    <View style={styles.body}>
      <ScrollView style={{ maxHeight: height * 0.55 }} contentContainerStyle={styles.scroll}>
        {dish.description ? <Text muted>{dish.description}</Text> : null}
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text variant="bodySm" style={styles.groupName}>
              {group.name}{' '}
              <Text variant="caption" muted>
                {rule(group)}
              </Text>
            </Text>
            {(group.options ?? []).map((option) => {
              const on = selected.includes(option.id!)
              const single = group.max === 1
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole={single ? 'radio' : 'checkbox'}
                  accessibilityState={{ checked: on, disabled: !option.available }}
                  disabled={!option.available || !canOrder}
                  onPress={() => toggle(group, option.id!)}
                  style={[styles.option, { borderTopColor: theme.divider }]}
                >
                  <View
                    style={[
                      styles.mark,
                      single ? styles.round : styles.square,
                      { borderColor: on ? theme.primary : theme.borderInput, backgroundColor: on ? theme.primary : theme.surface },
                    ]}
                  />
                  <Text variant="body" muted={!option.available} style={styles.flex}>
                    {option.name}
                    {option.available ? '' : ' · hết'}
                  </Text>
                  <Text variant="bodySm" muted style={styles.money}>
                    {option.priceDelta ? `+${formatVnd(option.priceDelta)}` : ''}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ))}
        {canOrder ? <Input label="Ghi chú cho quán (không bắt buộc)" value={note} onChangeText={setNote} maxLength={200} placeholder="Ví dụ: ít cay" /> : null}
      </ScrollView>

      {canOrder ? (
        <>
          <View style={styles.stepper}>
            <Button title="−" variant="outline" disabled={quantity <= 1} onPress={() => setQuantity((q) => q - 1)} accessibilityLabel="Giảm số lượng" />
            <Text variant="titleSm" style={styles.qty}>
              {quantity}
            </Text>
            <Button title="+" variant="outline" disabled={quantity >= MAX_LINE_QUANTITY} onPress={() => setQuantity((q) => q + 1)} accessibilityLabel="Tăng số lượng" />
          </View>
          {problem ? (
            <Text variant="bodySm" color={theme.danger}>
              Nhóm “{problem.name}”: {rule(problem).toLowerCase()}.
            </Text>
          ) : null}
          <Button
            title={`Thêm vào giỏ · ${formatVnd(unit * quantity)}`}
            size="lg"
            fullWidth
            disabled={Boolean(problem)}
            onPress={() =>
              onAdd({
                menuItemId: dish.id!,
                name: dish.name ?? '',
                basePrice: dish.price ?? 0,
                quantity,
                note: note.trim() || undefined,
                options: chosen.map((c) => ({ id: c.option.id!, group: c.group.name ?? '', name: c.option.name ?? '', priceDelta: c.option.priceDelta ?? 0 })),
              })
            }
          />
        </>
      ) : (
        <Text variant="bodySm" muted>
          {dish.soldOut ? 'Món này đang hết.' : 'Quán đang đóng cửa nên chưa đặt được.'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  scroll: { gap: spacing.md },
  flex: { flex: 1 },
  group: { gap: spacing.xs },
  groupName: { fontFamily: fonts.semibold },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1, minHeight: touchTarget.min },
  mark: { width: 22, height: 22, borderWidth: 2 },
  round: { borderRadius: radius.pill },
  square: { borderRadius: radius.sm },
  money: { fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  qty: { minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
})

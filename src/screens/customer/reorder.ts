import type { CartLine, CartShop } from '@/entities/cart'
import type { OrderDetail } from '@/entities/order'
import { api } from '@/shared/api'

export type Reordered = {
  shop: CartShop
  lines: Omit<CartLine, 'key'>[]
  /** Dishes and choices that are no longer offered, named for the notice. */
  dropped: string[]
  shopOpen: boolean
  /** Dishes whose price differs from what the customer paid before. */
  repriced: string[]
}

/**
 * Builds a cart from a past order against the shop's CURRENT menu (view-order-history.md): gone or sold-out dishes are
 * dropped and named, changed prices show at the new price, a gone option drops the whole line. It never rebuilds an
 * order from the old snapshot.
 */
export async function reorder(order: OrderDetail): Promise<Reordered | null> {
  const shopId = order.shop?.id
  if (!shopId) return null
  const { data, error } = await api.GET('/api/vendors/{id}/menu', { params: { path: { id: shopId } } })
  if (error || !data?.shop) return null

  const dishes = new Map((data.sections ?? []).flatMap((s) => s.items ?? []).map((d) => [d.id, d]))
  const lines: Omit<CartLine, 'key'>[] = []
  const dropped: string[] = []
  const repriced: string[] = []
  for (const old of order.items ?? []) {
    const dish = dishes.get(old.menuItemId)
    if (!dish || dish.soldOut) {
      dropped.push(old.name ?? 'Một món')
      continue
    }
    const options: CartLine['options'] = []
    let missing: string | null = null
    for (const wanted of old.options ?? []) {
      const group = (dish.optionGroups ?? []).find((g) => g.name === wanted.group)
      const option = (group?.options ?? []).find((o) => o.name === wanted.name)
      if (!group || !option || !option.available) {
        missing = wanted.name ?? 'một lựa chọn'
        break
      }
      options.push({ id: option.id!, group: group.name ?? '', name: option.name ?? '', priceDelta: option.priceDelta ?? 0 })
    }
    if (missing) {
      dropped.push(`${old.name} (${missing})`)
      continue
    }
    const unit = (dish.price ?? 0) + options.reduce((sum, o) => sum + o.priceDelta, 0)
    if (unit !== old.unitPrice) repriced.push(old.name ?? 'Một món')
    lines.push({ menuItemId: dish.id!, name: dish.name ?? '', basePrice: dish.price ?? 0, options, quantity: old.quantity ?? 1, note: old.note })
  }
  const shop = data.shop
  return {
    shop: {
      id: shop.id!,
      name: shop.name ?? '',
      deliveryFee: shop.deliveryFee ?? 0,
      freeDeliveryThreshold: shop.freeDeliveryThreshold,
      minOrderValue: shop.minOrderValue,
    },
    lines,
    dropped,
    repriced,
    shopOpen: Boolean(shop.open),
  }
}

import { useQuery } from '@tanstack/react-query'
import { formatDateTime, formatVnd } from '@/shared/lib/format'
import { api, type components } from '@/shared/api'

export type Shop = components['schemas']['Shop']
export type ShopMenu = components['schemas']['ShopMenu']
export type ShopDish = components['schemas']['Item']

export type Position = { lat: number; lng: number }

/** Shops whose own delivery radius covers the point, open ones first then nearest (browse-vendors-in-area.md). */
export function useShopsInArea(position: Position | null, query: string, categoryId: string | null) {
  return useQuery({
    queryKey: ['vendors', position?.lat, position?.lng, query, categoryId],
    enabled: position !== null,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/vendors', {
        params: {
          query: {
            lat: position!.lat,
            lng: position!.lng,
            size: 50,
            ...(query ? { q: query } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
        },
      })
      if (error || !data) throw error
      return data
    },
  })
}

/** One shop with its sections and dishes; the position adds the distance. */
export function useShopMenu(id: string, position: Position | null) {
  return useQuery({
    queryKey: ['vendors', id, 'menu', position?.lat, position?.lng],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/vendors/{id}/menu', {
        params: { path: { id }, query: position ? { lat: position.lat, lng: position.lng } : {} },
      })
      if (error || !data) throw error
      return data
    },
  })
}

/** "0,5 km" */
export function formatDistance(km: number | undefined): string | null {
  return km === undefined || km === null ? null : `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`
}

/** Delivery fee line: free, or the fee, with the free-delivery threshold when the shop has one. */
export function deliveryText(shop: Shop): string {
  const fee = shop.deliveryFee ? `Phí giao ${formatVnd(shop.deliveryFee)}` : 'Miễn phí giao'
  return shop.deliveryFee && shop.freeDeliveryThreshold ? `${fee} · miễn phí từ ${formatVnd(shop.freeDeliveryThreshold)}` : fee
}

export type ShopVoucher = components['schemas']['Offer']

/** The shop's vouchers a customer can use now, soonest ending first. */
export function useShopVouchers(id: string) {
  return useQuery({
    queryKey: ['vendors', id, 'vouchers'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/vendors/{id}/vouchers', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** "Giảm 20%" or "Giảm 15.000 ₫". */
export function voucherTitle(v: ShopVoucher): string {
  return v.discountType === 'PERCENT' ? `Giảm ${v.discountValue}%` : `Giảm ${formatVnd(v.discountValue ?? 0)}`
}

/** "Đơn từ 50.000 ₫, giảm tối đa 20.000 ₫". */
export function voucherCondition(v: ShopVoucher): string {
  const parts = [v.minOrderValue ? `Đơn từ ${formatVnd(v.minOrderValue)}` : 'Mọi đơn hàng']
  if (v.maxDiscount) parts.push(`giảm tối đa ${formatVnd(v.maxDiscount)}`)
  return parts.join(', ')
}

export function voucherEnds(v: ShopVoucher): string {
  return v.validTo ? `Hết hạn ${formatDateTime(v.validTo)}` : ''
}

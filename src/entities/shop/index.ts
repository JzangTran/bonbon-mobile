import { useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type ShopApplication = components['schemas']['ShopApplicationView']
export type ShopStatus = 'NONE' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'CLOSED'

export const SHOP_QUERY_KEY = ['merchant', 'shop'] as const

/** The seller's own shop: status, open state and the saved application. */
export function useShop() {
  return useQuery({
    queryKey: SHOP_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/shop')
      if (error || !data) throw error
      return data
    },
  })
}

export function shopStatus(shop: ShopApplication | undefined): ShopStatus | undefined {
  return shop?.status as ShopStatus | undefined
}

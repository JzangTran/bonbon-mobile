import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'
import type { OrderStatus } from './model'

export type ShopOrderSummary = components['schemas']['ShopOrderSummary']
export type ShopOrderDetail = components['schemas']['ShopOrderDetail']

export const SHOP_ORDERS_KEY = ['merchant', 'orders'] as const

/** A page of the shop's own orders. {@code live} means a socket is open, so polling can be much slower. */
export function useShopOrders(statuses: OrderStatus[], oldestFirst: boolean, live: boolean, page = 0) {
  return useQuery({
    queryKey: [...SHOP_ORDERS_KEY, 'list', statuses, oldestFirst, page],
    placeholderData: keepPreviousData,
    refetchInterval: live ? 60_000 : 10_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/orders', {
        params: { query: { status: statuses, sort: oldestFirst ? 'oldest' : 'newest', page, size: 20 } },
      })
      if (error || !data) throw error
      return data
    },
  })
}

export function useShopOrder(id: string, live: boolean) {
  return useQuery({
    queryKey: [...SHOP_ORDERS_KEY, 'detail', id],
    refetchInterval: live ? 60_000 : 10_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/orders/{id}', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
  })
}

export type OrderAction =
  | { kind: 'confirm' }
  | { kind: 'reject'; reason: string }
  | { kind: 'cancel'; reason: string }
  | { kind: 'advance'; to: 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' }

/** Confirm, reject, move to the next step or cancel one order; the answer is the updated order. */
export function useOrderAction(id: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (action: OrderAction) => {
      const path = { params: { path: { id } } }
      const send = (): Promise<{ data?: ShopOrderDetail; error?: unknown }> => {
        switch (action.kind) {
          case 'confirm':
            return api.POST('/api/merchant/orders/{id}/confirm', path)
          case 'reject':
            return api.POST('/api/merchant/orders/{id}/reject', { ...path, body: { reason: action.reason } })
          case 'cancel':
            return api.POST('/api/merchant/orders/{id}/cancel', { ...path, body: { reason: action.reason } })
          case 'advance':
            return api.POST('/api/merchant/orders/{id}/status', { ...path, body: { to: action.to } })
        }
      }
      const result = await send()
      if (result.error || !result.data) throw result.error
      return result.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...SHOP_ORDERS_KEY, 'detail', id], data)
      void queryClient.invalidateQueries({ queryKey: [...SHOP_ORDERS_KEY, 'list'] })
    },
    onError: (error) => {
      toast.show(problemMessage(error), 'error')
      // Somebody else may have moved it first: show what it really is now.
      void queryClient.invalidateQueries({ queryKey: SHOP_ORDERS_KEY })
    },
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'
import type { OrderStatus } from './model'
import type { OrderDetail } from './place'

export type OrderSummary = components['schemas']['OrderSummary']

/** Every customer order query lives under this key, so one invalidation refreshes them all. */
export const MY_ORDERS_KEY = ['orders'] as const

/** Orders still moving: what the customer is waiting for. */
export const ACTIVE_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
export const PAST_STATUSES: OrderStatus[] = ['DELIVERED', 'REJECTED', 'CANCELLED', 'NOT_DELIVERED']

/** The customer's own orders, newest first. {@code live} means a socket is open, so polling can be slow. */
export function useMyOrders(statuses: OrderStatus[], live: boolean, page = 0) {
  return useQuery({
    queryKey: [...MY_ORDERS_KEY, 'list', statuses, page],
    placeholderData: keepPreviousData,
    refetchInterval: live ? 60_000 : 10_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/orders', { params: { query: { status: statuses, page, size: 20 } } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useMyOrder(id: string, live: boolean) {
  return useQuery({
    queryKey: [...MY_ORDERS_KEY, 'detail', id],
    // While the customer is paying in MoMo the order is checked every few seconds: nothing else tells us it arrived.
    refetchInterval: (query) => {
      const order = query.state.data
      if (order?.status === 'PENDING_PAYMENT') return 3_000
      // A refund going back through MoMo is done within seconds or minutes; one waiting for an admin is not polled fast.
      if (order?.refund?.mode === 'GATEWAY' && order.refund.status !== 'COMPLETED') return 5_000
      return live ? 60_000 : 10_000
    },
    queryFn: async () => {
      const { data, error } = await api.GET('/api/orders/{id}', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** Cancel (free until the shop starts preparing; an unpaid order can be abandoned) or confirm received; the answer is the updated order. */
export function useCustomerOrderAction(id: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (kind: 'cancel' | 'received') => {
      const path = { params: { path: { id } } }
      const result: { data?: OrderDetail; error?: unknown } =
        kind === 'cancel' ? await api.POST('/api/orders/{id}/cancel', path) : await api.POST('/api/orders/{id}/received', path)
      if (result.error || !result.data) throw result.error
      return result.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...MY_ORDERS_KEY, 'detail', id], data)
      void queryClient.invalidateQueries({ queryKey: [...MY_ORDERS_KEY, 'list'] })
    },
    onError: (error) => {
      toast.show(problemMessage(error), 'error')
      // The shop may have moved it first: show what it really is now.
      void queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
    },
  })
}

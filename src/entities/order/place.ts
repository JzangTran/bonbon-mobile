import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type OrderDetail = components['schemas']['OrderDetail']
export type PlaceOrderBody = components['schemas']['PlaceOrderRequest']

/** A key that stays the same across retries of one checkout, so a double tap or a lost response never creates two orders. */
export function newIdempotencyKey(): string {
  const random = () => Math.random().toString(36).slice(2, 10)
  return `${Date.now().toString(36)}-${random()}-${random()}`
}

/** Places an order, paid at the door or online with MoMo (place-order.md); the answer is the order as the server priced it. */
export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ body, idempotencyKey }: { body: PlaceOrderBody; idempotencyKey: string }) => {
      const { data, error } = await api.POST('/api/orders', { body, params: { header: { 'Idempotency-Key': idempotencyKey } } })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

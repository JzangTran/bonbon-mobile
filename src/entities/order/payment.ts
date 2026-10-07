import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { Linking, Platform } from 'react-native'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'
import { MY_ORDERS_KEY } from './customer'

export type OrderPayment = components['schemas']['OrderPayment']
export type OrderRefund = components['schemas']['OrderRefund']

/** The amounts MoMo's payment API accepts; outside them the customer pays at the door instead. */
export const ONLINE_MIN = 1_000
export const ONLINE_MAX = 50_000_000

export function canPayOnline(total: number): boolean {
  return total >= ONLINE_MIN && total <= ONLINE_MAX
}

/**
 * Takes the customer to MoMo: the deeplink opens the MoMo app; when it cannot (not installed, or on the web) the
 * payment page opens in the browser, where they pay by QR. Coming back proves nothing: only the order status from the
 * server says the payment arrived (pay-online.md).
 */
export async function openMomo(payment: OrderPayment | undefined): Promise<'app' | 'browser' | 'none'> {
  if (!payment) return 'none'
  if (Platform.OS !== 'web' && payment.deeplink) {
    try {
      await Linking.openURL(payment.deeplink)
      return 'app'
    } catch {
      // MoMo is not installed: fall through to the payment page.
    }
  }
  if (payment.payUrl) {
    if (Platform.OS === 'web') {
      await Linking.openURL(payment.payUrl)
    } else {
      await WebBrowser.openBrowserAsync(payment.payUrl)
    }
    return 'browser'
  }
  return 'none'
}

/** A fresh MoMo attempt for an order that is still unpaid; the answer is the order with the new payment link. */
export function useRetryPayment(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/orders/{id}/pay', { params: { path: { id: orderId } } })
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...MY_ORDERS_KEY, 'detail', orderId], data)
      void queryClient.invalidateQueries({ queryKey: [...MY_ORDERS_KEY, 'list'] })
    },
    onError: (error) => {
      toast.show(problemMessage(error), 'error')
      // The order may have been cancelled or paid meanwhile: show what it really is now.
      void queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
    },
  })
}

/** The bank account a refund goes to when MoMo could not send it back (process-refund.md). */
export function useRefundDestination(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (body: { bankName: string; accountNumber: string; accountName: string }) => {
      const { data, error } = await api.PUT('/api/orders/{orderId}/refund-destination', { params: { path: { orderId } }, body })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      toast.show('Đã nhận tài khoản. Chúng tôi sẽ chuyển khoản trong 24 giờ.')
      void queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

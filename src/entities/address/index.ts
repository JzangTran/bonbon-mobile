import { useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type DeliveryAddress = components['schemas']['DeliveryAddress']

export const ADDRESSES_QUERY_KEY = ['account', 'addresses'] as const

/** The customer's saved delivery addresses, default first. */
export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/addresses')
      if (error || !data) throw error
      return data
    },
  })
}

/** Server cap on saved addresses (manage-delivery-addresses.md). */
export const MAX_ADDRESSES = 10

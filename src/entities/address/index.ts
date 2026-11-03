import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api, type components } from '@/shared/api'

export type DeliveryAddress = components['schemas']['DeliveryAddress']

export const ADDRESSES_QUERY_KEY = ['account', 'addresses'] as const

/** The customer's saved delivery addresses, default first. Off for a guest (the list belongs to an account). */
export function useAddresses({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/addresses')
      if (error || !data) throw error
      return data
    },
  })
}

/** Server cap on saved addresses (manage-delivery-addresses.md). */
export const MAX_ADDRESSES = 10

/**
 * Where a guest (browsing before signing in) wants the food to go: a point picked from the address suggestions, kept on this
 * phone only. It is only used to find the shops that deliver there; ordering asks for an account and a saved address.
 */
export type GuestLocation = { label: string; formattedAddress: string; lat: number; lng: number }

const GUEST_KEY = 'bonbon.guestLocation'
const GUEST_QUERY_KEY = ['guest-location'] as const

export function useGuestLocation() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: GUEST_QUERY_KEY,
    staleTime: Infinity,
    queryFn: async (): Promise<GuestLocation | null> => {
      const raw = await AsyncStorage.getItem(GUEST_KEY)
      return raw ? (JSON.parse(raw) as GuestLocation) : null
    },
  })
  const save = useCallback(
    async (location: GuestLocation) => {
      await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(location))
      queryClient.setQueryData(GUEST_QUERY_KEY, location)
    },
    [queryClient],
  )
  return { location: query.data ?? null, loading: query.isPending, save }
}

/**
 * The point the shop list and menus are worked out for: the default saved address of a signed-in customer, or the guest's
 * picked location. `missing` means nothing is set yet (ask for an address).
 */
export function useDeliveryPoint(signedIn: boolean) {
  const addresses = useAddresses({ enabled: signedIn })
  const guest = useGuestLocation()
  if (signedIn) {
    const address = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0]
    return {
      loading: addresses.isPending,
      missing: !!addresses.data && !address,
      label: address?.label,
      text: address?.formattedAddress,
      position: address?.lat !== undefined && address?.lng !== undefined ? { lat: address.lat, lng: address.lng } : null,
    }
  }
  const location = guest.location
  return {
    loading: guest.loading,
    missing: !guest.loading && !location,
    // the full address already starts with the picked place's name; a "label: text" line would say it twice
    label: undefined,
    text: location?.formattedAddress,
    position: location ? { lat: location.lat, lng: location.lng } : null,
  }
}

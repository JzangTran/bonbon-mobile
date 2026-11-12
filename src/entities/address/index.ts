import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { useCallback, useEffect, useSyncExternalStore } from 'react'
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
      clearCurrentLocation()
    },
    [queryClient],
  )
  return { location: query.data ?? null, loading: query.isPending, save }
}

type Located = { text: string; placeId?: string; position: { lat: number; lng: number } }
type DeliveryState = { located: Located | null; chosen: Located | null; saved: boolean }

let state: DeliveryState = { located: null, chosen: null, saved: false }
let located = false
const watchers = new Set<() => void>()
function update(next: Partial<DeliveryState>) {
  state = { ...state, ...next }
  watchers.forEach((notify) => notify())
}
function useDeliveryState() {
  return useSyncExternalStore(
    (notify) => {
      watchers.add(notify)
      return () => watchers.delete(notify)
    },
    () => state,
    () => state,
  )
}

/** The customer chose a saved address: that wins over where the phone was when the app opened. */
export function clearCurrentLocation() {
  update({ chosen: null, saved: true })
}

/** Deliver to this place until the app closes or another is chosen. */
export function chooseDeliveryPlace(place: RecentPlace) {
  update({ chosen: { text: place.detail, placeId: place.placeId, position: { lat: place.lat, lng: place.lng } }, saved: false })
}

/** Where the phone was when the app opened, whatever is being delivered to. */
export function useLocatedPlace() {
  return useDeliveryState().located
}

/** Go back to delivering to where the phone is. */
export function deliverToHere() {
  update({ chosen: null, saved: false })
}

const FIX_TIMEOUT_MS = 12_000

/** Why the phone's position could not be read: not allowed (and whether asking again can still show the prompt), or no fix. */
export type LocateResult = { ok: true } | { ok: false; reason: 'denied'; canAskAgain: boolean } | { ok: false; reason: 'unavailable' }

/** Reads the phone's position once, asking for permission when the customer has not answered yet. */
export async function locateNow(): Promise<LocateResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (!permission.granted) return { ok: false, reason: 'denied', canAskAgain: permission.canAskAgain }
    // a fix indoors can take long or never come: the last known position is better than waiting forever
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS)),
    ])
    const coords = (fix ?? (await Location.getLastKnownPositionAsync()))?.coords
    if (!coords) return { ok: false, reason: 'unavailable' }
    const position = { lat: coords.latitude, lng: coords.longitude }
    const { data } = await api.GET('/api/geo/reverse', { params: { query: position } })
    update({ located: { text: data?.formattedAddress ?? 'Vị trí hiện tại', placeId: data?.placeId, position } })
    return { ok: true }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}

async function locateOnce() {
  // no position this time: the saved address or the picked place still works
  await locateNow()
}

/** Reads the phone's position once each time the app opens; it is never followed. */
export function useLocateOnAppOpen() {
  useEffect(() => {
    if (located) return
    located = true
    void locateOnce()
  }, [])
}

export type RecentPlace = { name: string; detail: string; placeId?: string; lat: number; lng: number }
const RECENT_PLACES = 10

/** Places this person delivered to or looked up lately, newest first, kept on this phone. */
export function useRecentPlaces(userId: string | undefined) {
  const queryClient = useQueryClient()
  const storageKey = `bonbon.recentPlaces.${userId ?? 'guest'}`
  const queryKey = ['recent-places', userId ?? 'guest']
  const recent = useQuery({
    queryKey,
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await AsyncStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as RecentPlace[]) : []
    },
  })
  const list = recent.data ?? []
  const add = (place: RecentPlace) => {
    const next = [place, ...list.filter((p) => p.lat !== place.lat || p.lng !== place.lng)].slice(0, RECENT_PLACES)
    queryClient.setQueryData(queryKey, next)
    void AsyncStorage.setItem(storageKey, JSON.stringify(next))
  }
  return { list, add }
}

/** A suggestion turned into a point on the map. */
export async function resolvePlace(place: { placeId: string; name: string; detail: string }): Promise<RecentPlace> {
  const { data, error } = await api.GET('/api/geo/place', { params: { query: { placeId: place.placeId } } })
  if (error || !data || data.lat === undefined || data.lng === undefined) throw error
  return { name: place.name, detail: data.formattedAddress ?? place.detail, placeId: place.placeId, lat: data.lat, lng: data.lng }
}

/** Straight-line distance in kilometres. */
export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = rad(to.lat - from.lat)
  const dLng = rad(to.lng - from.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

/**
 * The point the shop list and menus are worked out for: where the phone was when the app opened, else the default saved address of
 * a signed-in customer or the guest's picked location. `missing` means nothing is set yet (ask for an address).
 */
export function useDeliveryPoint(signedIn: boolean) {
  const addresses = useAddresses({ enabled: signedIn })
  const guest = useGuestLocation()
  const { located: phone, chosen, saved } = useDeliveryState()
  const here = chosen ?? (saved ? null : phone)
  if (here) return { loading: false, missing: false, label: undefined, text: here.text, position: here.position }
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

/** "Nhà" and "Công ty" name one address each; to change one, the old address goes first (owner decision 2026-11-12). */
const SINGLE_LABELS = ['nha', 'cong ty']
const labelKey = (label: string | null | undefined) =>
  (label ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').trim().toLowerCase().replace(/\s+/g, ' ')

/** The saved address that already carries this name when the name is one of the two that allow only one, else undefined. */
export function addressWithSingleLabel<T extends { label?: string | null }>(addresses: readonly T[], label: string): T | undefined {
  const key = labelKey(label)
  return SINGLE_LABELS.includes(key) ? addresses.find((a) => labelKey(a.label) === key) : undefined
}

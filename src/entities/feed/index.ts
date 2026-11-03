import AsyncStorage from '@react-native-async-storage/async-storage'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api'

/** A shop card of the home page: the shop and up to 10 dishes on sale now, discounted first. */
export type FeedDish = { id: string; name: string; photoUrl?: string | null; price: number; originalPrice?: number | null; discountPercent: number }
export type FeedShop = {
  id: string
  name: string
  logoUrl?: string | null
  open?: boolean
  distanceKm?: number | null
  ratingAverage?: number | null
  ratingCount?: number
  deliveryFee?: number
}
export type FeedCard = { shop: FeedShop; dishes: FeedDish[] }
export type FeedPage = { items: FeedCard[]; page: number; hasMore: boolean; total: number; dealMaxPercent: number }
export type DisplayCategory = { id: string; name: string; imageUrl?: string | null }

type Point = { lat: number; lng: number } | null

export const FEED_KEY = ['home-feed'] as const

/**
 * The home page's shops, 10 at a time (infinite list). With a delivery point: shops that deliver there, nearest first; without
 * (a guest who has not typed an address): every shop, best rated first. The server leaves out the signed-in customer's hidden
 * shops; a guest's own hidden shops are sent along.
 */
export function useHomeFeed({ position, displayCategoryId, deals = false, guestHidden = [] }: {
  position: Point
  displayCategoryId?: string | null
  deals?: boolean
  guestHidden?: string[]
}) {
  return useInfiniteQuery({
    queryKey: [...FEED_KEY, position?.lat ?? null, position?.lng ?? null, displayCategoryId ?? null, deals, guestHidden.join(',')],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/feed', {
        params: {
          query: {
            ...(position ? { lat: position.lat, lng: position.lng } : {}),
            ...(displayCategoryId ? { displayCategoryId } : {}),
            ...(deals ? { deals: true } : {}),
            ...(guestHidden.length ? { hide: guestHidden } : {}),
            page: pageParam,
          },
        },
      })
      if (error || !data) throw error
      return data as unknown as FeedPage
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}

/** The picture strip of the home page, in the administrator's order. */
export function useDisplayCategories() {
  return useQuery({
    queryKey: ['display-categories'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/display-categories')
      if (error || !data) throw error
      return data as unknown as DisplayCategory[]
    },
  })
}

export const FAVORITES_KEY = ['favorite-shops'] as const

/** The customer's favourite shops, newest first, each with its dishes like on the home page. */
export function useFavoriteShops(position: Point, enabled: boolean) {
  return useQuery({
    queryKey: [...FAVORITES_KEY, position?.lat ?? null, position?.lng ?? null],
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/favorite-shops', {
        params: { query: position ? { lat: position.lat, lng: position.lng } : {} },
      })
      if (error || !data) throw error
      return data as unknown as FeedCard[]
    },
  })
}

export function useFavoriteToggle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shopId, favorite }: { shopId: string; favorite: boolean }) => {
      const path = { params: { path: { vendorId: shopId } } }
      const { error } = favorite ? await api.PUT('/api/account/favorite-shops/{vendorId}', path) : await api.DELETE('/api/account/favorite-shops/{vendorId}', path)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FAVORITES_KEY }),
  })
}

const GUEST_HIDDEN_KEY = 'bonbon.hiddenShops'
const HIDE_DAYS = 30
type GuestHidden = Record<string, number>

/** A guest's hidden shops, kept on the phone (shop id → until, ms); the 30 days are checked when read. */
export function useGuestHiddenShops() {
  return useQuery({
    queryKey: ['guest-hidden-shops'],
    staleTime: Infinity,
    queryFn: async () => {
      const raw = await AsyncStorage.getItem(GUEST_HIDDEN_KEY)
      const all = raw ? (JSON.parse(raw) as GuestHidden) : {}
      const now = Date.now()
      return Object.keys(all).filter((id) => all[id] > now).slice(-100)
    },
  })
}

/** "Ẩn quán này": 30 days, on the server for a customer, on the phone for a guest. The shop leaves the list at once. */
export function useHideShop(signedIn: boolean) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shopId: string) => {
      if (signedIn) {
        const { error } = await api.PUT('/api/account/hidden-shops/{vendorId}', { params: { path: { vendorId: shopId } } })
        if (error) throw error
        return
      }
      const raw = await AsyncStorage.getItem(GUEST_HIDDEN_KEY)
      const all = raw ? (JSON.parse(raw) as GuestHidden) : {}
      all[shopId] = Date.now() + HIDE_DAYS * 24 * 3600_000
      await AsyncStorage.setItem(GUEST_HIDDEN_KEY, JSON.stringify(all))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['guest-hidden-shops'] })
      await queryClient.invalidateQueries({ queryKey: FEED_KEY })
    },
  })
}

/** "3.6 (6K+)": the rating count shortened past a thousand. */
export function ratingCountLabel(count: number): string {
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`
  return String(count)
}

/** "130 Điện Biên Phủ": the street part of a full address (before the ward and the city). */
export function streetOf(formattedAddress?: string | null): string | undefined {
  if (!formattedAddress) return undefined
  return formattedAddress.split(',')[0]?.trim() || formattedAddress
}

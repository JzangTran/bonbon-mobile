import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type Review = components['schemas']['Review']
export type ReviewReply = components['schemas']['ReviewReply']

/** Everything about reviews lives under this key; the shop's average rides on the vendor queries. */
export const REVIEWS_KEY = ['reviews'] as const
const PAGE_SIZE = 10

type Page = components['schemas']['ReviewPage']

function nextPage(last: Page): number | undefined {
  const page = last.page ?? 0
  return (page + 1) * (last.size ?? PAGE_SIZE) < (last.total ?? 0) ? page + 1 : undefined
}

/** The public reviews of a shop, newest first, one more page on demand. */
export function useShopReviews(vendorId: string) {
  return useInfiniteQuery({
    queryKey: [...REVIEWS_KEY, 'shop', vendorId],
    initialPageParam: 0,
    getNextPageParam: nextPage,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/vendors/{id}/reviews', {
        params: { path: { id: vendorId }, query: { page: pageParam, size: PAGE_SIZE } },
      })
      if (error || !data) throw error
      return data
    },
  })
}

/** The seller's own reviews; {@code unreplied} keeps only the ones still waiting for an answer. */
export function useSellerReviews(unreplied: boolean) {
  return useInfiniteQuery({
    queryKey: [...REVIEWS_KEY, 'seller', unreplied],
    initialPageParam: 0,
    getNextPageParam: nextPage,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/merchant/reviews', { params: { query: { unreplied, page: pageParam, size: PAGE_SIZE } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** The customer's own review of an order, with its edit deadline and the shop's reply; only asked once the order shows one. */
export function useMyOrderReview(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...REVIEWS_KEY, 'mine', orderId],
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/orders/{orderId}/review', { params: { path: { orderId } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** Posting, editing and deleting the customer's review of one order. */
export function useOrderReviewActions(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const refresh = () => {
    // The order shows "đã đánh giá" and the shop shows its new average.
    void queryClient.invalidateQueries({ queryKey: ['orders'] })
    void queryClient.invalidateQueries({ queryKey: ['vendors'] })
    void queryClient.invalidateQueries({ queryKey: REVIEWS_KEY })
  }
  const onError = (error: unknown) => {
    toast.show(problemMessage(error), 'error')
    // The window may have closed or the review been hidden meanwhile: show what it really is now.
    refresh()
  }
  const save = useMutation({
    mutationFn: async ({ rating, comment, existing }: { rating: number; comment: string; existing: boolean }) => {
      const body = { rating, comment: comment.trim() || undefined }
      const path = { params: { path: { orderId } }, body }
      const result = existing ? await api.PUT('/api/orders/{orderId}/review', path) : await api.POST('/api/orders/{orderId}/review', path)
      if (result.error || !result.data) throw result.error
      return result.data
    },
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE('/api/orders/{orderId}/review', { params: { path: { orderId } } })
      if (error) throw error
    },
    onSuccess: refresh,
    onError,
  })
  return { save, remove }
}

/** The shop's reply to a review: write, rewrite or remove it (within 24 hours of posting). */
export function useReplyActions() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...REVIEWS_KEY, 'seller'] })
  const onError = (error: unknown) => {
    toast.show(problemMessage(error), 'error')
    void refresh()
  }
  const save = useMutation({
    mutationFn: async ({ reviewId, text, existing }: { reviewId: string; text: string; existing: boolean }) => {
      const path = { params: { path: { id: reviewId } }, body: { text: text.trim() } }
      const result = existing ? await api.PUT('/api/merchant/reviews/{id}/response', path) : await api.POST('/api/merchant/reviews/{id}/response', path)
      if (result.error || !result.data) throw result.error
      return result.data
    },
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await api.DELETE('/api/merchant/reviews/{id}/response', { params: { path: { id: reviewId } } })
      if (error) throw error
    },
    onSuccess: refresh,
    onError,
  })
  return { save, remove }
}

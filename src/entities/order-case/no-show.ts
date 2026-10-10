import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { api, isApiProblem, problemMessage } from '@/shared/api'
import { useToast } from '@/shared/ui'
import { CASES_KEY, type PickedPhoto } from './api'

export type NoShowAnswer = 'UNABLE' | 'RECEIVED' | 'SHOP_NEVER_CAME'

/** The shop's side: a photo goes up first, to private storage, and its key is what the report names. */
async function uploadNoShowPhoto(orderId: string, photo: PickedPhoto): Promise<string> {
  const form = new FormData()
  const name = photo.fileName ?? 'photo.jpg'
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(photo.uri)).blob(), name)
  } else {
    form.append('file', { uri: photo.uri, name, type: photo.mimeType ?? 'image/jpeg' } as unknown as Blob)
  }
  const { data, error } = await api.POST('/api/merchant/orders/{id}/no-show-photo', {
    params: { path: { id: orderId } },
    body: { file: '' },
    bodySerializer: () => form,
  })
  if (error || !data?.photoKey) throw error
  return data.photoKey
}

/** Reports that the customer was not there when the food arrived (report-customer-no-show.md). */
export function useReportNoShow(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (input: { note: string; photo: PickedPhoto | null }) => {
      const photoKey = input.photo ? await uploadNoShowPhoto(orderId, input.photo) : undefined
      const { data, error } = await api.POST('/api/merchant/orders/{id}/no-show', {
        params: { path: { id: orderId } },
        body: { note: input.note.trim(), ...(photoKey ? { photoKey } : {}) },
      })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      toast.show('Đã báo. Khách có 2 giờ để trả lời.')
      void queryClient.invalidateQueries({ queryKey: CASES_KEY })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

/** The no-show case of one order, as the shop sees it; null when it has none. Looks among the cases that are not settled yet. */
export function useShopNoShow(orderId: string) {
  return useQuery({
    queryKey: [...CASES_KEY, 'shop', 'no-show', orderId],
    refetchInterval: 30_000,
    queryFn: async () => {
      for (const status of ['AWAITING_CUSTOMER', 'OPEN'] as const) {
        const { data, error } = await api.GET('/api/merchant/order-cases', { params: { query: { status, size: 50 } } })
        if (error || !data) throw error
        const found = (data.items ?? []).find((c) => c.orderId === orderId && c.type === 'CUSTOMER_NO_SHOW')
        if (found) return found
      }
      return null
    },
  })
}

/** The customer's side: what the shop said at the door, or null when nothing was reported. */
export function useMyNoShow(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...CASES_KEY, 'mine', 'no-show', orderId],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/orders/{id}/no-show', { params: { path: { id: orderId } } })
      if (isApiProblem(error) && error.code === 'CASE_NOT_FOUND') return null
      if (error || !data) throw error
      return data
    },
  })
}

export function useAnswerNoShow(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (input: { answer: NoShowAnswer; note?: string }) => {
      const { data, error } = await api.POST('/api/orders/{id}/no-show-answer', {
        params: { path: { id: orderId } },
        body: { answer: input.answer, ...(input.note?.trim() ? { note: input.note.trim() } : {}) },
      })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      toast.show('Đã gửi câu trả lời.')
      void queryClient.invalidateQueries({ queryKey: CASES_KEY })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

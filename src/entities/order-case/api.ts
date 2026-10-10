import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { api, isApiProblem, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type OrderCase = components['schemas']['OrderCase']
export type OrderCaseLine = components['schemas']['OrderCaseLine']
export type ShopCaseSummary = components['schemas']['OrderCaseSummary']
export type CaseStatus = 'AWAITING_SHOP' | 'AWAITING_CUSTOMER' | 'OPEN' | 'UPHELD' | 'DISMISSED'
export type IncidentType = 'MISSING_ITEM' | 'WRONG_ITEM' | 'QUALITY'
export type ClaimedLine = { orderItemId: string; quantity: number }
export type PickedPhoto = { uri: string; mimeType?: string | null; fileName?: string | null }

/** Everything about order cases lives under this key; a decision or a reply refreshes it all. */
export const CASES_KEY = ['order-cases'] as const

// --- the customer's side

/** The case the customer filed for an order, or null when there is none. */
export function useMyCase(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...CASES_KEY, 'mine', orderId],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/orders/{id}/case', { params: { path: { id: orderId } } })
      if (isApiProblem(error) && error.code === 'CASE_NOT_FOUND') return null
      if (error || !data) throw error
      return data
    },
  })
}

/** What the customer would get back for these lines, worked out by the server (the app never does the arithmetic). */
export function useIncidentQuote(orderId: string, lines: ClaimedLine[]) {
  return useQuery({
    queryKey: [...CASES_KEY, 'quote', orderId, lines],
    enabled: lines.length > 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.POST('/api/orders/{id}/incident/quote', { params: { path: { id: orderId } }, body: { lines } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useReportNotReceived(orderId: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/orders/{id}/report-not-received', { params: { path: { id: orderId } }, body: {} })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      toast.show('Đã gửi báo cáo. Quán sẽ trả lời sớm.')
      void queryClient.invalidateQueries({ queryKey: CASES_KEY })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

/** A photo goes to private storage first; the key it comes back with is what the report names. */
export async function uploadCasePhoto(orderId: string, photo: PickedPhoto): Promise<string> {
  const form = new FormData()
  const name = photo.fileName ?? 'photo.jpg'
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(photo.uri)).blob(), name)
  } else {
    form.append('file', { uri: photo.uri, name, type: photo.mimeType ?? 'image/jpeg' } as unknown as Blob)
  }
  const { data, error } = await api.POST('/api/orders/{id}/case-photos', {
    params: { path: { id: orderId } },
    body: { file: '' },
    bodySerializer: () => form,
  })
  if (error || !data?.photoKey) throw error
  return data.photoKey
}

export function useReportIncident(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { type: IncidentType; lines: ClaimedLine[]; photos: PickedPhoto[]; note: string }) => {
      const photoKeys: string[] = []
      for (const photo of input.photos) photoKeys.push(await uploadCasePhoto(orderId, photo))
      const { data, error } = await api.POST('/api/orders/{id}/incident', {
        params: { path: { id: orderId } },
        body: { type: input.type, lines: input.lines, photoKeys, ...(input.note.trim() ? { note: input.note.trim() } : {}) },
      })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      // The quote of an order that now has a case would only come back as a conflict.
      queryClient.removeQueries({ queryKey: [...CASES_KEY, 'quote', orderId] })
      void queryClient.invalidateQueries({ queryKey: [...CASES_KEY, 'mine', orderId] })
    },
  })
}

// --- the shop's side

export function useShopCases(status: CaseStatus, page = 0) {
  return useQuery({
    queryKey: [...CASES_KEY, 'shop', status, page],
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/order-cases', { params: { query: { status, page, size: 20 } } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useShopCase(id: string) {
  return useQuery({
    queryKey: [...CASES_KEY, 'shop', 'detail', id],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/order-cases/{id}', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useCaseAnswer(id: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const done = (message: string) => {
    toast.show(message)
    void queryClient.invalidateQueries({ queryKey: CASES_KEY })
  }
  const failed = (error: unknown) => {
    toast.show(problemMessage(error), 'error')
    void queryClient.invalidateQueries({ queryKey: CASES_KEY })
  }
  const accept = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/merchant/order-cases/{id}/accept', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => done('Đã chấp nhận. Khách được hoàn tiền.'),
    onError: failed,
  })
  const dispute = useMutation({
    mutationFn: async (note: string) => {
      const { data, error } = await api.POST('/api/merchant/order-cases/{id}/dispute', { params: { path: { id } }, body: { note: note.trim() } })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => done('Đã chuyển cho quản trị viên quyết định.'),
    onError: failed,
  })
  return { accept, dispute }
}

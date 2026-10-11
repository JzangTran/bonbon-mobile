import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type TicketSummary = components['schemas']['SupportTicketSummary']
export type TicketDetail = components['schemas']['SupportTicketDetail']
export type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null }

export const TICKETS_KEY = ['support-tickets'] as const

export const TICKET_STATUS_LABEL: Record<string, string> = { OPEN: 'Chờ hỗ trợ', ANSWERED: 'Đã trả lời', CLOSED: 'Đã đóng' }

export function useMyTickets() {
  return useQuery({
    queryKey: [...TICKETS_KEY, 'list'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/support/tickets', { params: { query: { page: 0, size: 50 } } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useMyTicket(id: string) {
  return useQuery({
    queryKey: [...TICKETS_KEY, 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/support/tickets/{id}', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
  })
}

async function uploadAttachment(image: PickedImage): Promise<string> {
  const form = new FormData()
  const name = image.fileName ?? 'photo.jpg'
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(image.uri)).blob(), name)
  } else {
    form.append('file', { uri: image.uri, name, type: image.mimeType ?? 'image/jpeg' } as unknown as Blob)
  }
  const { data, error } = await api.POST('/api/support/attachments', { body: { file: '' }, bodySerializer: () => form })
  if (error || !data?.attachmentKey) throw error
  return data.attachmentKey
}

/** Opens a ticket, optionally about one of the person's orders; the images are uploaded first. */
export function useOpenTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { subject: string; message: string; orderId?: string; images: PickedImage[] }) => {
      const attachmentKeys: string[] = []
      for (const image of input.images) attachmentKeys.push(await uploadAttachment(image))
      const { data, error } = await api.POST('/api/support/tickets', {
        body: { subject: input.subject.trim(), message: input.message.trim(), orderId: input.orderId, attachmentKeys },
      })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useReplyTicket(id: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (input: { body: string; images: PickedImage[] }) => {
      const attachmentKeys: string[] = []
      for (const image of input.images) attachmentKeys.push(await uploadAttachment(image))
      const { data, error } = await api.POST('/api/support/tickets/{id}/messages', { params: { path: { id } }, body: { body: input.body.trim(), attachmentKeys } })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

export function useCloseTicket(id: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/support/tickets/{id}/close', { params: { path: { id } } })
      if (error || !data) throw error
      return data
    },
    onSuccess: () => {
      toast.show('Đã đóng phiếu.')
      void queryClient.invalidateQueries({ queryKey: TICKETS_KEY })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

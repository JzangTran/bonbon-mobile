import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { api, isApiProblem, problemMessage, type components } from '@/shared/api'
import { useFeedback } from '@/shared/ui'

export type Conversation = components['schemas']['ConversationSummary']
export type ChatMessage = components['schemas']['ChatMessage']
export type PickedImage = { uri: string; mimeType?: string | null; fileName?: string | null }

/**
 * Everything about chat lives under this key. The live providers in the order entity invalidate the same literal
 * when a message arrives over the socket; polling covers a dropped connection.
 */
export const CHAT_KEY = ['chat'] as const

const PAGE = 30

export function useConversations(live: boolean) {
  return useQuery({
    queryKey: [...CHAT_KEY, 'list'],
    placeholderData: keepPreviousData,
    refetchInterval: live ? 60_000 : 15_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/conversations', { params: { query: { page: 0, size: 50 } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** The conversation the customer already has with this shop, or null (they have not written yet). */
export function useShopConversation(vendorId: string | undefined) {
  return useQuery({
    queryKey: [...CHAT_KEY, 'with-shop', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/shops/{vendorId}/conversation', { params: { path: { vendorId: vendorId! } } })
      if (isApiProblem(error) && error.status === 404) return null
      if (error || !data) throw error
      return data
    },
  })
}

/** Messages of one conversation, newest first; "load older" goes back in time. */
export function useThread(conversationId: string | null, live: boolean) {
  return useInfiniteQuery({
    queryKey: [...CHAT_KEY, 'thread', conversationId],
    enabled: !!conversationId,
    initialPageParam: undefined as string | undefined,
    refetchInterval: live ? false : 10_000,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/conversations/{id}/messages', {
        params: { path: { id: conversationId! }, query: { before: pageParam, size: PAGE } },
      })
      if (error || !data) throw error
      return data
    },
    getNextPageParam: (last) => (last.hasMore ? last.nextBefore : undefined),
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await api.POST('/api/conversations/{id}/read', { params: { path: { id: conversationId } } })
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CHAT_KEY, 'list'] }),
  })
}

async function uploadImage(image: PickedImage): Promise<string> {
  const form = new FormData()
  const name = image.fileName ?? 'photo.jpg'
  if (Platform.OS === 'web') {
    form.append('file', await (await fetch(image.uri)).blob(), name)
  } else {
    form.append('file', { uri: image.uri, name, type: image.mimeType ?? 'image/jpeg' } as unknown as Blob)
  }
  const { data, error } = await api.POST('/api/conversations/images', { body: { file: '' }, bodySerializer: () => form })
  if (error || !data?.imageKey) throw error
  return data.imageKey
}

type SendInput = { text: string; image: PickedImage | null; replyToMessageId?: string }

/**
 * Sends into an existing conversation, or, for a customer who has not written to the shop yet, to the shop (which creates
 * the conversation). The message that comes back says which conversation it landed in.
 */
export function useSendMessage(target: { conversationId?: string | null; vendorId?: string }) {
  const queryClient = useQueryClient()
  const feedback = useFeedback()
  return useMutation({
    mutationFn: async (input: SendInput) => {
      const imageKey = input.image ? await uploadImage(input.image) : undefined
      const body = { text: input.text.trim() || undefined, imageKey, replyToMessageId: input.replyToMessageId }
      const result = target.conversationId
        ? await api.POST('/api/conversations/{id}/messages', { params: { path: { id: target.conversationId } }, body })
        : await api.POST('/api/shops/{vendorId}/messages', { params: { path: { vendorId: target.vendorId! } }, body })
      if (result.error || !result.data) throw result.error
      return result.data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CHAT_KEY }),
    onError: (error) => feedback.error(problemMessage(error)),
  })
}

/** Close or reopen the conversation to the other side (send-message.md "Blocking a conversation"); ordering is never affected. */
export function useBlockConversation(conversationId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (block: boolean) => {
      if (!conversationId) return null
      const options = { params: { path: { id: conversationId } } }
      const { data, error } = block
        ? await api.POST('/api/conversations/{id}/block', options)
        : await api.DELETE('/api/conversations/{id}/block', options)
      if (error || !data) throw error
      return data
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CHAT_KEY }),
  })
}

export type AutoReply = components['schemas']['AutoReply']
const AUTO_REPLY_KEY = ['merchant', 'auto-reply'] as const

/** The shop's one auto-reply (configure-auto-reply.md). */
export function useAutoReply(enabled = true) {
  return useQuery({
    queryKey: AUTO_REPLY_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/shop/auto-reply')
      if (error || !data) throw error
      return data
    },
  })
}

export function useSaveAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AutoReply) => {
      const { data, error } = await api.PUT('/api/merchant/shop/auto-reply', { body })
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => queryClient.setQueryData(AUTO_REPLY_KEY, data),
  })
}

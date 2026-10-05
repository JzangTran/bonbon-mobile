import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type NotificationItem = components['schemas']['NotificationItem']

/** Every notification query lives under this key; live order events invalidate it. */
export const NOTIFICATIONS_KEY = ['notifications'] as const

/** The caller's notifications for the role they act as (a seller sees the shop's, a customer their own). */
export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'list', unreadOnly],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/notifications', { params: { query: { unread: unreadOnly, size: 50 } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** The number on the bell: unread notifications of the current role. */
export function useUnreadCount(): number {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'count'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/notifications', { params: { query: { unread: true, size: 1 } } })
      if (error || !data) throw error
      return data.unread ?? 0
    },
  }).data ?? 0
}

/** Acknowledges one notification (idempotent on the server) or all of them. */
export function useAcknowledge() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (id: string | 'all') => {
      const { error } = id === 'all' ? await api.POST('/api/notifications/ack-all') : await api.POST('/api/notifications/{id}/ack', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

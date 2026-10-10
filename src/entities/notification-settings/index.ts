import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type NotificationPreferences = components['schemas']['NotificationPreferences']
export type PushDevice = components['schemas']['PushDeviceView']

const KEY = ['notification-settings'] as const

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [...KEY, 'preferences'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/me/notification-preferences')
      if (error || !data) throw error
      return data
    },
  })
}

export function useUpdatePreference() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (change: { category: string; channel: 'PUSH' | 'EMAIL'; enabled: boolean }) => {
      const { data, error } = await api.PUT('/api/me/notification-preferences', { body: { changes: [change] } })
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => queryClient.setQueryData([...KEY, 'preferences'], data),
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

/** Both times, or neither to clear. */
export function useSetQuietHours() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (hours: { start?: string; end?: string }) => {
      const { data, error } = await api.PUT('/api/me/quiet-hours', { body: hours })
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => {
      toast.show(data.quietHours ? 'Đã đặt giờ yên lặng.' : 'Đã bỏ giờ yên lặng.')
      queryClient.setQueryData([...KEY, 'preferences'], data)
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

export function usePushDevices() {
  return useQuery({
    queryKey: [...KEY, 'devices'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/push-devices')
      if (error || !data) throw error
      return data
    },
  })
}

export function useRemoveDevice() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/push-devices/{id}', { params: { path: { id } } })
      if (error) throw error
    },
    onSuccess: () => {
      toast.show('Đã gỡ thiết bị.')
      void queryClient.invalidateQueries({ queryKey: [...KEY, 'devices'] })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

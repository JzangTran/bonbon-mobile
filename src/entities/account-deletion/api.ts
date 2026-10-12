import { useMutation, useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type DeletionCheck = components['schemas']['AccountDeletionCheck']
export type DeletionBlocker = components['schemas']['AccountDeletionBlocker']
export type DeletionScheduled = components['schemas']['AccountDeletionScheduled']

/** What stands in the way of deleting the account, how long the grace period is and whether a password is needed. */
export function useDeletionCheck(enabled: boolean) {
  return useQuery({
    queryKey: ['account', 'deletion-check'],
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/me/account/deletion-check')
      if (error || !data) throw error
      return data
    },
  })
}

/** Needs a sign-in from the last 10 minutes; every session ends at once and the account is anonymised after the grace period. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (body: { confirmation: string; password?: string }) => {
      const { data, error } = await api.POST('/api/me/account/delete', { body })
      if (error || !data) throw error
      return data
    },
  })
}

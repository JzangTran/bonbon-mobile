import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, problemMessage, type components } from '@/shared/api'
import { useToast } from '@/shared/ui'

export type Menu = components['schemas']['MenuView']
export type MenuSection = components['schemas']['MenuSectionView']
export type MenuItem = components['schemas']['MenuItemView']
export type OptionGroups = components['schemas']['OptionGroupsView']
export type CategoryNode = components['schemas']['CategoryNode']

export const MENU_QUERY_KEY = ['merchant', 'menu'] as const
export const OPTIONS_QUERY_KEY = ['merchant', 'option-groups'] as const

/** The seller's own menu: sections in display order, each with its dishes. */
export function useMenu() {
  return useQuery({
    queryKey: MENU_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/menu')
      if (error || !data) throw error
      return data
    },
  })
}

/** The seller's option groups, each with its options (for the sold-out switches). */
export function useOptionGroups() {
  return useQuery({
    queryKey: OPTIONS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/option-groups')
      if (error || !data) throw error
      return data
    },
  })
}

export type CategoryLeaf = { id: string; name: string }

/** Level-3 categories, the only ones a dish may sit on. */
export function useCategoryLeaves() {
  return useQuery({
    queryKey: ['categories'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/categories')
      if (error || !data) throw error
      const leaves: CategoryLeaf[] = []
      const walk = (nodes: CategoryNode[]) => {
        for (const n of nodes) {
          if (n.level === 3) leaves.push({ id: n.id!, name: n.name ?? '' })
          else walk(n.children ?? [])
        }
      }
      walk(data)
      return leaves
    },
  })
}

/** A menu endpoint answers with the whole menu; keep it as the cached copy and refresh the option attachments. */
export function useMenuMutation<T>(call: (input: T) => Promise<{ data?: Menu; error?: unknown }>, success?: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (input: T) => {
      const { data, error } = await call(input)
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(MENU_QUERY_KEY, data)
      void queryClient.invalidateQueries({ queryKey: OPTIONS_QUERY_KEY })
      if (success) toast.show(success)
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

/** An option-group endpoint answers with all groups; a sold-out option can also change a dish, so refresh the menu. */
export function useOptionMutation<T>(call: (input: T) => Promise<{ data?: OptionGroups; error?: unknown }>) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: async (input: T) => {
      const { data, error } = await call(input)
      if (error || !data) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(OPTIONS_QUERY_KEY, data)
      void queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEY })
    },
    onError: (error) => toast.show(problemMessage(error), 'error'),
  })
}

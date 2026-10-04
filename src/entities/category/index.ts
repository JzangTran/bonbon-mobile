import { useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type CategoryNode = components['schemas']['CategoryNode']

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

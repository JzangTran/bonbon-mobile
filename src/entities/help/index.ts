import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type HelpArticle = components['schemas']['HelpArticleSummary']

/** Published articles for the role in use (a guest or customer sees the customer's, a seller the seller's); accent-insensitive search. */
export function useHelpArticles(q: string) {
  return useQuery({
    queryKey: ['help', 'articles', q],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/help-articles', { params: { query: q.trim() ? { q: q.trim() } : {} } })
      if (error || !data) throw error
      return data
    },
  })
}

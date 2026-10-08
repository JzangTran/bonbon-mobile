import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type EarningsSummary = components['schemas']['EarningsSummary']
export type EarningsEntry = components['schemas']['EarningsEntry']

export const EARNINGS_KEY = ['merchant', 'earnings'] as const
const PAGE_SIZE = 20

type Page = components['schemas']['EarningsLedgerPage']

function nextPage(last: Page): number | undefined {
  const page = last.page ?? 0
  return (page + 1) * (last.size ?? PAGE_SIZE) < (last.total ?? 0) ? page + 1 : undefined
}

/** The balance between the shop and bonbon, in plain numbers (view-earnings.md). */
export function useEarnings() {
  return useQuery({
    queryKey: [...EARNINGS_KEY, 'summary'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/earnings')
      if (error || !data) throw error
      return data
    },
  })
}

/** The ledger behind the balance, newest first, one more page on demand. */
export function useEarningsLedger() {
  return useInfiniteQuery({
    queryKey: [...EARNINGS_KEY, 'ledger'],
    initialPageParam: 0,
    getNextPageParam: nextPage,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/merchant/earnings/ledger', { params: { query: { page: pageParam, size: PAGE_SIZE } } })
      if (error || !data) throw error
      return data
    },
  })
}

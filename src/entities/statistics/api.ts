import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api, type components } from '@/shared/api'

export type RevenueReport = components['schemas']['RevenueReport']
export type RevenueBucket = components['schemas']['RevenueBucket']
export type BestSellingDish = components['schemas']['BestSellingDish']

export const STATS_KEY = ['merchant', 'stats'] as const

/** Both ends are Vietnam-time days and inclusive; the server fills every day of the range, empty ones as zero. */
export function useRevenueStats(range: { from: string; to: string }) {
  return useQuery({
    queryKey: [...STATS_KEY, 'revenue', range],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/stats/revenue', { params: { query: { ...range, granularity: 'day' } } })
      if (error || !data) throw error
      return data
    },
  })
}

export function useBestSellingDishes(range: { from: string; to: string }) {
  return useQuery({
    queryKey: [...STATS_KEY, 'best-selling-dishes', range],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/merchant/stats/best-selling-dishes', { params: { query: { ...range, limit: 10 } } })
      if (error || !data) throw error
      return data
    },
  })
}

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { Vibration } from 'react-native'
import { useSession } from '@/entities/session'
import { SHOP_ORDERS_KEY, useShopOrders } from './api'
import { useOrderSocket, type OrderEvent, type SocketState } from './live'

type OrderLive = {
  state: SocketState
  /** New orders still waiting for the shop's answer: the number the seller must never miss. */
  waiting: number
}

const OrderLiveContext = createContext<OrderLive>({ state: 'connecting', waiting: 0 })

/** One socket for the whole seller area: every order screen refreshes from it, and new orders buzz until answered. */
export function OrderLiveProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const state = useOrderSocket(session?.accessToken ?? null, (event: OrderEvent) => {
    void queryClient.invalidateQueries({ queryKey: SHOP_ORDERS_KEY })
    if (event.channel === 'shop' && event.to === 'PLACED') Vibration.vibrate([0, 400, 200, 400])
  })
  const waiting = useShopOrders(['PLACED'], true, state === 'live').data?.total ?? 0

  // An unanswered order keeps buzzing every 30 s until the shop answers it (or the timeout does).
  useEffect(() => {
    if (waiting === 0) return
    const timer = setInterval(() => Vibration.vibrate([0, 400, 200, 400]), 30_000)
    return () => clearInterval(timer)
  }, [waiting])

  const value = useMemo(() => ({ state, waiting }), [state, waiting])
  return <OrderLiveContext.Provider value={value}>{children}</OrderLiveContext.Provider>
}

export function useOrderLive(): OrderLive {
  return useContext(OrderLiveContext)
}

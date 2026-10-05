import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from '@/entities/session'
import { MY_ORDERS_KEY } from './customer'
import { useOrderSocket, type OrderEvent, type SocketState } from './live'

const CustomerLiveContext = createContext<SocketState>('connecting')

/** One socket for the customer area: every order screen refreshes from it, and polling covers a dropped connection. */
export function CustomerLiveProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const state = useOrderSocket(session?.accessToken ?? null, (event: OrderEvent) => {
    if (event.channel === 'customer') void queryClient.invalidateQueries({ queryKey: MY_ORDERS_KEY })
  })
  return <CustomerLiveContext.Provider value={state}>{children}</CustomerLiveContext.Provider>
}

export function useCustomerLive(): SocketState {
  return useContext(CustomerLiveContext)
}

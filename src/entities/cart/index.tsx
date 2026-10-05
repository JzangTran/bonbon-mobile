import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/** The shop a cart belongs to, with what checkout needs to show the fee and the minimum before asking the server. */
export type CartShop = {
  id: string
  name: string
  deliveryFee: number
  freeDeliveryThreshold?: number | null
  minOrderValue?: number | null
}

export type CartOption = { id: string; group: string; name: string; priceDelta: number }

/** {@code basePrice} is only for display: the server re-prices every line when the order is placed. */
export type CartLine = {
  key: string
  menuItemId: string
  name: string
  basePrice: number
  options: CartOption[]
  quantity: number
  note?: string
}

type CartState = { shop: CartShop | null; lines: CartLine[] }

const EMPTY: CartState = { shop: null, lines: [] }
const STORAGE_KEY = 'bonbon.cart'
export const MAX_LINE_QUANTITY = 99

/** Two lines are the same line only if dish, sorted option set and note are identical (manage-menu-options.md). */
export function lineKey(menuItemId: string, optionIds: string[], note: string | undefined): string {
  return `${menuItemId}|${[...optionIds].sort().join(',')}|${(note ?? '').trim()}`
}

export const unitPrice = (line: CartLine) => line.basePrice + line.options.reduce((sum, o) => sum + o.priceDelta, 0)
export const lineTotal = (line: CartLine) => unitPrice(line) * line.quantity

export function cartTotals(cart: CartState) {
  const itemsTotal = cart.lines.reduce((sum, l) => sum + lineTotal(l), 0)
  const shop = cart.shop
  // The API sends null for a missing threshold or minimum, so test for a number rather than for undefined.
  const threshold = shop?.freeDeliveryThreshold
  const deliveryFee = !shop ? 0 : typeof threshold === 'number' && itemsTotal >= threshold ? 0 : shop.deliveryFee
  const count = cart.lines.reduce((sum, l) => sum + l.quantity, 0)
  const belowMinimum = typeof shop?.minOrderValue === 'number' && itemsTotal < shop.minOrderValue
  return { itemsTotal, deliveryFee, grandTotal: itemsTotal + deliveryFee, count, belowMinimum }
}

type CartApi = CartState & {
  /** False until the saved cart has been read, so a screen never flashes an empty cart. */
  ready: boolean
  totals: ReturnType<typeof cartTotals>
  /** Adds a line; {@code 'other-shop'} means the cart holds another shop's dishes and nothing was changed. */
  add: (shop: CartShop, line: Omit<CartLine, 'key'>) => 'added' | 'other-shop'
  /** Empties the cart first, then adds: what "start a new cart" does after the customer agreed. */
  replaceWith: (shop: CartShop, line: Omit<CartLine, 'key'>) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartApi | null>(null)

function addTo(state: CartState, shop: CartShop, line: Omit<CartLine, 'key'>): CartState {
  const key = lineKey(line.menuItemId, line.options.map((o) => o.id), line.note)
  const existing = state.lines.find((l) => l.key === key)
  const lines = existing
    ? state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + line.quantity) } : l))
    : [...state.lines, { ...line, key }]
  return { shop, lines }
}

/** The cart lives on the device (view-vendor-menu.md): one shop per cart, kept across app restarts. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(EMPTY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active && raw) setState(JSON.parse(raw) as CartState)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined)
  }, [state, ready])

  const add = useCallback(
    (shop: CartShop, line: Omit<CartLine, 'key'>) => {
      if (state.shop && state.shop.id !== shop.id && state.lines.length > 0) return 'other-shop' as const
      setState((current) => addTo(current, shop, line))
      return 'added' as const
    },
    [state.shop, state.lines.length],
  )
  const replaceWith = useCallback((shop: CartShop, line: Omit<CartLine, 'key'>) => setState(addTo(EMPTY, shop, line)), [])
  const setQuantity = useCallback((key: string, quantity: number) => {
    setState((current) => {
      const lines = quantity <= 0 ? current.lines.filter((l) => l.key !== key) : current.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l))
      return lines.length === 0 ? EMPTY : { ...current, lines }
    })
  }, [])
  const clear = useCallback(() => setState(EMPTY), [])

  const value = useMemo<CartApi>(
    () => ({ ...state, ready, totals: cartTotals(state), add, replaceWith, setQuantity, clear }),
    [state, ready, add, replaceWith, setQuantity, clear],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

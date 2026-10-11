import { useEffect, useRef, useState } from 'react'
import { env } from '@/shared/config/env'

export type OrderEvent = {
  type: 'order'
  channel: 'customer' | 'shop'
  orderId: string
  number: number
  from: string | null
  to: string
}

/** A chat message arrived for this side; the caller re-fetches the conversation list and thread. */
export type ChatEvent = {
  type: 'message'
  channel: 'customer' | 'shop'
  conversationId: string
  messageId: string
}

export type SocketState = 'connecting' | 'live' | 'offline'

/** Live order updates (track-order.md): auth in the first message, reconnect with a growing pause. The event is only a hint. */
export function useOrderSocket(accessToken: string | null, onEvent: (event: OrderEvent) => void, onMessage?: (event: ChatEvent) => void): SocketState {
  const [state, setState] = useState<SocketState>('connecting')
  const handler = useRef(onEvent)
  const messageHandler = useRef(onMessage)
  useEffect(() => {
    handler.current = onEvent
    messageHandler.current = onMessage
  })

  useEffect(() => {
    if (!accessToken) return
    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let attempt = 0
    let stopped = false

    const connect = () => {
      socket = new WebSocket(env.apiUrl.replace(/^http/, 'ws') + '/ws/orders')
      socket.onopen = () => socket?.send(JSON.stringify({ type: 'auth', token: accessToken }))
      socket.onmessage = (message) => {
        try {
          const body = JSON.parse(String(message.data)) as { type?: string }
          if (body.type === 'ready') {
            attempt = 0
            setState('live')
          } else if (body.type === 'order') {
            handler.current(body as OrderEvent)
          } else if (body.type === 'message') {
            messageHandler.current?.(body as ChatEvent)
          }
        } catch {
          // A malformed message is ignored: the next fetch tells the truth anyway.
        }
      }
      socket.onclose = () => {
        if (stopped) return
        setState('offline')
        attempt += 1
        retry = setTimeout(connect, Math.min(15_000, 1_000 * 2 ** Math.min(attempt, 4)))
      }
    }
    connect()

    return () => {
      stopped = true
      clearTimeout(retry)
      socket?.close()
    }
  }, [accessToken])

  return state
}

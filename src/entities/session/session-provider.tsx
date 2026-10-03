import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, setAuthHandlers } from '@/shared/api'
import { loadSession, saveLastRole, saveSession, SessionContext, toSession, type Session, type SignInInput } from './model'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [restoring, setRestoring] = useState(true)
  const current = useRef<Session | null>(null)
  const queryClient = useQueryClient()

  const update = useCallback(
    async (next: Session | null) => {
      const previous = current.current
      current.current = next
      // Cached server data belongs to whoever fetched it: another user or role must never see it.
      // New tokens for the same user and role (refresh, password change) keep the cache.
      if (previous?.userId !== next?.userId || previous?.role !== next?.role) {
        queryClient.clear()
      }
      setSession(next)
      await saveSession(next)
    },
    [queryClient],
  )

  useEffect(() => {
    loadSession().then((stored) => {
      current.current = stored
      setSession(stored)
      setRestoring(false)
    })
  }, [])

  useEffect(() => {
    setAuthHandlers({
      getAccessToken: () => current.current?.accessToken ?? null,
      refresh: async () => {
        const active = current.current
        if (!active) return null
        const { data, response } = await api.POST('/api/auth/refresh', { body: { refreshToken: active.refreshToken } })
        if (!response.ok || !data?.accessToken || !data.refreshToken) {
          await update(null)
          return null
        }
        await update(toSession({ ...active, accessToken: data.accessToken, refreshToken: data.refreshToken }))
        return data.accessToken
      },
    })
  }, [update])

  const signIn = useCallback(
    async (input: SignInInput) => {
      await saveLastRole(input.role)
      await update(toSession(input))
    },
    [update],
  )

  const signOut = useCallback(async (options?: { alreadyRevoked?: boolean }) => {
    const active = current.current
    if (active && !options?.alreadyRevoked) {
      await api.POST('/api/auth/logout', { body: { refreshToken: active.refreshToken } }).catch(() => undefined)
    }
    await update(null)
  }, [update])

  const value = useMemo(() => ({ session, restoring, signIn, signOut }), [session, restoring, signIn, signOut])
  return <SessionContext value={value}>{children}</SessionContext>
}

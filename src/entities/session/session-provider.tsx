import { useMemo, useState, type ReactNode } from 'react'
import { SessionContext, type Session } from './model'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const value = useMemo(() => ({ session, setSession }), [session])
  return <SessionContext value={value}>{children}</SessionContext>
}

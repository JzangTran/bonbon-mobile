import { createContext } from 'react'

/** One role is active per session; switching is an explicit action (switch-role flow). */
export type Role = 'CUSTOMER' | 'SELLER'

export type Session = {
  userId: string
  role: Role
  permissions: ReadonlySet<string>
}

export type SessionContextValue = {
  session: Session | null
  setSession: (session: Session | null) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

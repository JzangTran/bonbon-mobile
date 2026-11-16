import { createContext } from 'react'
import { secureStorage } from '@/shared/lib/secure-storage'

/** One role is active per session; switching is an explicit action (switch-role flow). */
export type Role = 'CUSTOMER' | 'SELLER'

/** A main account or member of a seller team: the login, the shop open now and the shops to switch to. */
export type TeamSession = {
  kind: 'MAIN_ACCOUNT' | 'MEMBER'
  login: string
  shopId: string | null
  shopName: string | null
  shops: { vendorId: string; name: string; status: string }[]
}

export type Session = {
  /** Only for a seller-team session; personal account pages are hidden for it. */
  team?: TeamSession
  userId: string
  email: string
  name: string
  role: Role
  availableRoles: Role[]
  permissions: ReadonlySet<string>
  accessToken: string
  refreshToken: string
}

export type SignInInput = Omit<Session, 'permissions'>

export type SessionContextValue = {
  session: Session | null
  /** True until the stored session has been read at startup. */
  restoring: boolean
  /** `remember: false` keeps the session for this run of the app only: nothing is stored, closing the app signs out. */
  signIn: (input: SignInInput, options?: { remember?: boolean }) => Promise<void>
  /** `alreadyRevoked`: the server ended every session already (logout-all), so only local state is cleared. */
  signOut: (options?: { alreadyRevoked?: boolean }) => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

const SESSION_KEY = 'bonbon.session'
const LAST_ROLE_KEY = 'bonbon.lastRole'

/** Permissions are read from the access token's `permissions` claim (for showing/hiding UI only). */
export function permissionsOf(accessToken: string): Set<string> {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(globalThis.atob(payload)) as { permissions?: string[] }
    return new Set(claims.permissions ?? [])
  } catch {
    return new Set()
  }
}

/** The `team` part of a server user summary. */
export function teamOf(raw: unknown): TeamSession | undefined {
  const t = raw as (Partial<TeamSession> & { shops?: { vendorId?: string; name?: string; status?: string }[] }) | null | undefined
  if (!t?.kind) return undefined
  return {
    kind: t.kind,
    login: t.login ?? '',
    shopId: t.shopId ?? null,
    shopName: t.shopName ?? null,
    shops: (t.shops ?? []).map((s) => ({ vendorId: s.vendorId ?? '', name: s.name ?? '', status: s.status ?? '' })),
  }
}

export function toSession(input: SignInInput): Session {
  return { ...input, permissions: permissionsOf(input.accessToken) }
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await secureStorage.get(SESSION_KEY)
    return raw ? toSession(JSON.parse(raw) as SignInInput) : null
  } catch {
    return null
  }
}

export async function saveSession(session: Session | null): Promise<void> {
  if (!session) {
    await secureStorage.remove(SESSION_KEY)
    return
  }
  const { permissions: _ignored, ...stored } = session
  void _ignored
  await secureStorage.set(SESSION_KEY, JSON.stringify(stored))
}

/** The role chosen last on this device (remembered per device, never synced: login-email-password.md). */
export async function loadLastRole(): Promise<Role | null> {
  const value = await secureStorage.get(LAST_ROLE_KEY)
  return value === 'CUSTOMER' || value === 'SELLER' ? value : null
}

export async function saveLastRole(role: Role): Promise<void> {
  await secureStorage.set(LAST_ROLE_KEY, role)
}

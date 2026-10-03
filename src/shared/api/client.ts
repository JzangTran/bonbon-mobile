import Constants from 'expo-constants'
import createClient, { type Middleware } from 'openapi-fetch'
import { env } from '@/shared/config/env'
import type { paths } from './generated/schema'

/** RFC 9457 body the backend returns for every error (see GlobalExceptionHandler). */
export type ApiProblem = {
  status: number
  code: string
  detail?: string
  errors?: { field: string; message: string }[]
}

type AuthHandlers = {
  getAccessToken: () => string | null
  /** Exchanges the stored refresh token; resolves to the new access token or null if the session is over. */
  refresh: () => Promise<string | null>
}

let auth: AuthHandlers = { getAccessToken: () => null, refresh: async () => null }

/** The session layer registers how to read and renew the access token (kept in expo-secure-store). */
export function setAuthHandlers(handlers: AuthHandlers) {
  auth = handlers
}

let refreshInFlight: Promise<string | null> | null = null

/** Many requests may fail with 401 at once; they all wait for the same single refresh call. */
function refreshOnce(): Promise<string | null> {
  refreshInFlight ??= auth.refresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

const appVersion = Constants.expoConfig?.version ?? 'dev'
const pending = new Map<string, Request>()

function isRefreshRequest(request: Request): boolean {
  return request.url.includes('/api/auth/refresh')
}

async function isTokenRejection(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as { code?: unknown }
    return body.code === 'UNAUTHENTICATED'
  } catch {
    return true
  }
}

const authMiddleware: Middleware = {
  onRequest({ request, id }) {
    request.headers.set('X-Client-Channel', 'MOBILE')
    request.headers.set('X-App-Version', appVersion)
    // The refresh call must not carry the (possibly expired) access token: the resource server rejects
    // any invalid bearer token, even on public endpoints.
    const token = isRefreshRequest(request) ? null : auth.getAccessToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    pending.set(id, request.clone())
    return request
  },
  async onResponse({ request, response, id }) {
    const original = pending.get(id)
    pending.delete(id)
    const wasAuthenticated = request.headers.has('Authorization')
    const isRefreshCall = isRefreshRequest(request)
    if (response.status !== 401 || !wasAuthenticated || isRefreshCall || !original) return response
    // A 401 for a wrong password on a re-auth action (change password, logout-all) is not an expired token.
    if (!(await isTokenRejection(response))) return response
    const fresh = await refreshOnce()
    if (!fresh) return response
    const retry = new Request(original, { headers: new Headers(original.headers) })
    retry.headers.set('Authorization', `Bearer ${fresh}`)
    return fetch(retry)
  },
  onError({ id }) {
    pending.delete(id)
  },
}

export const api = createClient<paths>({ baseUrl: env.apiUrl })
api.use(authMiddleware)

export function isApiProblem(value: unknown): value is ApiProblem {
  return typeof value === 'object' && value !== null && 'code' in value && 'status' in value
}

/** The stable error code (e.g. CAPTCHA_REQUIRED) of a failed call, if the body was a problem. */
export function problemCode(error: unknown): string | undefined {
  return isApiProblem(error) ? error.code : undefined
}

/** The backend's Vietnamese message for a problem, or a generic one. */
export function problemMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
  return isApiProblem(error) && error.detail ? error.detail : fallback
}

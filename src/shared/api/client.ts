import Constants from 'expo-constants'
import createClient, { type Middleware } from 'openapi-fetch'
import { env } from '@/shared/config/env'
import { reportLegalRequired, reportMaintenance, reportUpdateRequired } from './gate'
import { isOffline } from './network'
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
    if (env.appPlatform) request.headers.set('X-App-Platform', env.appPlatform)
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

/** Tells the app gate when the server refuses everything for a reason that is not about one call (too old, maintenance, legal re-acceptance). */
const gateMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.status !== 403 && response.status !== 426 && response.status !== 503) return response
    try {
      const body = (await response.clone().json()) as { code?: unknown }
      if (body.code === 'APP_UPDATE_REQUIRED') reportUpdateRequired()
      else if (body.code === 'MAINTENANCE') reportMaintenance()
      else if (body.code === 'LEGAL_ACCEPTANCE_REQUIRED') reportLegalRequired()
    } catch {
      // not a problem body: nothing to report
    }
    return response
  },
}

export const api = createClient<paths>({ baseUrl: env.apiUrl })
api.use(authMiddleware)
api.use(gateMiddleware)

export function isApiProblem(value: unknown): value is ApiProblem {
  return typeof value === 'object' && value !== null && 'code' in value && 'status' in value
}

/** The stable error code (e.g. CAPTCHA_REQUIRED) of a failed call, if the body was a problem. */
export function problemCode(error: unknown): string | undefined {
  return isApiProblem(error) ? error.code : undefined
}

/**
 * Whose problem a failed call is, so the message never leaves people guessing:
 * - `offline`: the phone has no network (theirs to fix: turn on Wi-Fi or data);
 * - `unreachable`: the phone is online but no answer came from bonbon (ours);
 * - `server`: bonbon answered with a failure of its own, 5xx (ours);
 * - `request`: bonbon refused what was sent, with a reason they can act on (wrong password, a field to fix...).
 */
export type ProblemKind = 'offline' | 'unreachable' | 'server' | 'request'

export type ProblemDescription = { kind: ProblemKind; title: string; message: string }

const SERVER_FAULT = 'Lỗi nằm ở phía bonbon, không phải do bạn. Vui lòng thử lại sau ít phút.'

export function describeProblem(error: unknown): ProblemDescription {
  if (isApiProblem(error)) {
    if (error.status >= 500) {
      // a specific 503 (maps, payment provider down) says what is down; anything else is a plain server fault
      const specific = error.code !== 'INTERNAL_ERROR' && error.detail ? `${error.detail} ` : ''
      return { kind: 'server', title: 'bonbon đang gặp sự cố', message: `${specific}${SERVER_FAULT}` }
    }
    return { kind: 'request', title: 'Chưa thực hiện được', message: error.detail ?? 'Yêu cầu chưa hợp lệ. Hãy kiểm tra lại thông tin rồi thử lại.' }
  }
  // no problem body: the request never got an answer (fetch failed), or a proxy answered with a page instead of bonbon
  if (isOffline()) {
    return {
      kind: 'offline',
      title: 'Không có kết nối mạng',
      message: 'Điện thoại của bạn đang không có mạng. Hãy bật Wi-Fi hoặc dữ liệu di động rồi thử lại.',
    }
  }
  if (typeof error === 'string' || error instanceof Response) {
    return { kind: 'server', title: 'bonbon đang gặp sự cố', message: SERVER_FAULT }
  }
  return {
    kind: 'unreachable',
    title: 'Không kết nối được tới bonbon',
    message: 'Mạng của bạn vẫn hoạt động nhưng máy chủ bonbon chưa phản hồi. Lỗi nằm ở phía bonbon, không phải do bạn. Vui lòng thử lại sau ít phút.',
  }
}

/**
 * One line for a failed call: the server's own reason when it gave one, otherwise whose problem it is and what to do.
 * {@code context} is what the screen was doing ("Không tải được đánh giá lúc này."): kept in front of a network or server
 * explanation when it says what failed, and used as the reason when the server refused without one.
 */
export function problemMessage(error: unknown, context?: string): string {
  const problem = describeProblem(error)
  if (problem.kind === 'request') {
    return isApiProblem(error) && error.detail ? error.detail : (context ?? problem.message)
  }
  const what = context && /^Không (tải|gửi|tính|lưu) được/.test(context) ? context.replace(/( lúc này)?\.?( Hãy thử lại\.)?$/, '') : null
  return what ? `${what}. ${problem.message}` : problem.message
}

/** Field-level messages of a VALIDATION_FAILED problem, keyed by field name. */
export function problemFieldErrors(error: unknown): Record<string, string> {
  if (!isApiProblem(error) || !error.errors) return {}
  return Object.fromEntries(error.errors.map((e) => [e.field, e.message]))
}

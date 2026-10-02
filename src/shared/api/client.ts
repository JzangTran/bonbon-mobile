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

let getAccessToken: () => string | null = () => null

/** The session layer registers how to read the current access token (kept in expo-secure-store). */
export function setAccessTokenProvider(provider: () => string | null) {
  getAccessToken = provider
}

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

export const api = createClient<paths>({ baseUrl: env.apiUrl })
api.use(authMiddleware)

export function isApiProblem(value: unknown): value is ApiProblem {
  return typeof value === 'object' && value !== null && 'code' in value && 'status' in value
}

import { useCallback } from 'react'
import { useSession, type Role } from '@/entities/session'
import { api, problemCode, problemMessage } from '@/shared/api'

/** The stable codes a call answers with when the sign-in is older than the action allows. */
export function isReauthRequired(error: unknown): boolean {
  const code = problemCode(error)
  return code === 'REAUTH_REQUIRED' || code === 'REAUTHENTICATION_REQUIRED'
}

/**
 * Signs the current person in again with their password, which stamps a fresh sign-in time into the tokens. Resolves to null on
 * success, else the message to show. The same user and role keep their cached data.
 */
export function useReauthenticate() {
  const { session, signIn } = useSession()
  return useCallback(
    async (password: string): Promise<string | null> => {
      if (!session) return 'Phiên đăng nhập đã hết.'
      const { data, error } = await api.POST('/api/auth/login', { body: { email: session.email, password } })
      if (!data) return problemMessage(error, 'Mật khẩu không đúng.')
      let login = data
      if (data.needsRoleSelection && data.roleToken) {
        const { data: picked, error: pickError } = await api.POST('/api/auth/select-role', { body: { role: session.role, roleToken: data.roleToken } })
        if (!picked) return problemMessage(pickError as unknown)
        login = picked
      }
      const tokens = login.tokens
      if (!tokens?.accessToken || !tokens.refreshToken) return 'Không đăng nhập lại được, hãy thử lại.'
      await signIn({ ...session, role: session.role as Role, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
      return null
    },
    [session, signIn],
  )
}

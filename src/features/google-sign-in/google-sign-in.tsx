import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { loadLastRole, useSession, type Role } from '@/entities/session'
import { api, isApiProblem, problemCode, problemMessage, type components } from '@/shared/api'
import { env } from '@/shared/config/env'
import { Button, Captcha, Card, Checkbox, Input, Notice, Text, spacing, useTheme } from '@/shared/ui'
import { GoogleButton } from './google-button'

type LoginResponse = components['schemas']['LoginResponse']
type Extras = { role?: Role; acceptedDocumentIds?: string[]; marketingConsent?: boolean; password?: string; captchaToken?: string }
type Step =
  | { kind: 'idle' }
  | { kind: 'signup'; email?: string; role: Role }
  | { kind: 'password'; captcha: boolean }
  | { kind: 'pickRole'; roleToken: string; roles: Role[] }

const ROLE_LABEL: Record<Role, string> = { CUSTOMER: 'Đặt món', SELLER: 'Bán hàng' }

function useDocument(type: 'CUSTOMER_TERMS' | 'SELLER_TERMS' | 'PRIVACY_POLICY', enabled: boolean) {
  return useQuery({
    queryKey: ['legal-document', type],
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/legal/documents/{type}', { params: { path: { type } } })
      if (error || !data) throw error
      return data
    },
  })
}

/**
 * "Continue with Google" (login-oauth.md). {@code role} is set on the register screen (the role chosen there);
 * on the login screen it is left out, so an existing identity signs in with its roles, while a new one is asked
 * for a role and consent first, and an existing email/password account is linked with its password.
 */
export function GoogleSignIn({ role }: { role?: Role }) {
  const theme = useTheme()
  const { signIn } = useSession()
  const [idToken, setIdToken] = useState<string | null>(null)
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const signupRole = step.kind === 'signup' ? step.role : 'CUSTOMER'
  const terms = useDocument(signupRole === 'SELLER' ? 'SELLER_TERMS' : 'CUSTOMER_TERMS', step.kind === 'signup')
  const privacy = useDocument('PRIVACY_POLICY', step.kind === 'signup')

  const finish = async (data: LoginResponse) => {
    const { tokens, user } = data
    const active = (user?.activeRole ?? tokens?.role) as Role | undefined
    if (!tokens?.accessToken || !tokens.refreshToken || !user?.id || !active) return
    await signIn({
      userId: user.id,
      email: user.email ?? '',
      name: user.name ?? '',
      role: active,
      availableRoles: ((user.availableRoles ?? [active]) as string[]).filter((r): r is Role => r === 'CUSTOMER' || r === 'SELLER'),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }

  const chooseRole = async (roleToken: string, picked: Role) => {
    const { data, error: problem } = await api.POST('/api/auth/select-role', { body: { role: picked, roleToken } })
    if (!data) {
      setStep({ kind: 'idle' })
      setError(problemMessage(problem as unknown))
      return
    }
    await finish(data)
  }

  const submit = async (token: string, extras: Extras = {}) => {
    setError(null)
    setBusy(true)
    const { data, error: problem } = await api.POST('/api/auth/login/oauth', {
      body: { provider: 'GOOGLE', token, role: extras.role ?? role, ...extras },
    })
    setBusy(false)
    if (data) {
      if (data.needsRoleSelection && data.roleToken) {
        const roles = ((data.availableRoles ?? []) as string[]).filter((r): r is Role => r === 'CUSTOMER' || r === 'SELLER')
        const last = await loadLastRole()
        if (last && roles.includes(last)) await chooseRole(data.roleToken, last)
        else setStep({ kind: 'pickRole', roleToken: data.roleToken, roles })
        return
      }
      await finish(data)
      return
    }
    const code = problemCode(problem)
    const extra = isApiProblem(problem) ? (problem as { email?: string; linkMethod?: string }) : {}
    if (code === 'OAUTH_SIGNUP_REQUIRED' || code === 'CONSENT_REQUIRED') {
      setStep({ kind: 'signup', email: extra.email, role: extras.role ?? role ?? 'CUSTOMER' })
      if (step.kind === 'signup') setError(problemMessage(problem))
      return
    }
    if (code === 'ACCOUNT_EXISTS_LINK_REQUIRED' && extra.linkMethod === 'PASSWORD') {
      setStep({ kind: 'password', captcha: false })
      return
    }
    if (code === 'CAPTCHA_REQUIRED') {
      setStep({ kind: 'password', captcha: true })
    }
    setError(problemMessage(problem))
  }

  return (
    <View style={styles.wrap}>
      <GoogleButton
        onIdToken={(token) => {
          setIdToken(token)
          setStep({ kind: 'idle' })
          void submit(token)
        }}
        onError={setError}
      />

      {step.kind === 'signup' && idToken ? (
        <Card>
          <Text variant="titleSm">{step.email ? `Tạo tài khoản cho ${step.email}` : 'Thêm vai trò cho tài khoản Google này'}</Text>
          {!role ? (
            <View style={styles.roles}>
              {(['CUSTOMER', 'SELLER'] as Role[]).map((r) => (
                <Button
                  key={r}
                  title={ROLE_LABEL[r]}
                  variant={step.role === r ? 'primary' : 'outline'}
                  style={styles.flex}
                  onPress={() => {
                    setStep({ ...step, role: r })
                    setAccepted(false)
                  }}
                />
              ))}
            </View>
          ) : null}
          <Checkbox checked={accepted} onChange={setAccepted}>
            Tôi đồng ý với{' '}
            <Text
              variant="bodySm"
              color={theme.primary}
              onPress={() => Linking.openURL(`${env.webUrl}/legal/${step.role === 'SELLER' ? 'SELLER_TERMS' : 'CUSTOMER_TERMS'}`)}
            >
              {terms.data?.title ?? 'Điều khoản sử dụng'}
            </Text>{' '}
            và đã đọc{' '}
            <Text variant="bodySm" color={theme.primary} onPress={() => Linking.openURL(`${env.webUrl}/legal/PRIVACY_POLICY`)}>
              {privacy.data?.title ?? 'Chính sách quyền riêng tư'}
            </Text>
            .
          </Checkbox>
          <Checkbox checked={marketing} onChange={setMarketing} muted>
            Nhận tin khuyến mãi qua email (không bắt buộc).
          </Checkbox>
          <Button
            title="Tiếp tục"
            size="lg"
            fullWidth
            loading={busy}
            disabled={!accepted || !terms.data?.id || !privacy.data?.id}
            onPress={() =>
              submit(idToken, {
                role: step.role,
                acceptedDocumentIds: [terms.data!.id!, privacy.data!.id!],
                marketingConsent: marketing,
              })
            }
          />
        </Card>
      ) : null}

      {step.kind === 'password' && idToken ? (
        <Card>
          <Text variant="bodySm">Email này đã có tài khoản bonbon. Nhập mật khẩu của tài khoản đó để liên kết với Google.</Text>
          <Input label="Mật khẩu bonbon" secureTextEntry value={password} onChangeText={setPassword} autoComplete="current-password" />
          {step.captcha ? <Captcha token={captchaToken} onToken={setCaptchaToken} /> : null}
          <Button
            title="Liên kết và đăng nhập"
            size="lg"
            fullWidth
            loading={busy}
            disabled={!password}
            onPress={() => submit(idToken, { password, captchaToken: captchaToken ?? undefined })}
          />
        </Card>
      ) : null}

      {step.kind === 'pickRole' ? (
        <Card>
          <Text variant="titleSm">Bạn muốn vào với vai trò nào?</Text>
          {step.roles.map((r) => (
            <Button
              key={r}
              title={r === 'CUSTOMER' ? 'Khách hàng — đặt món' : 'Người bán — quản lý quán'}
              variant={r === 'CUSTOMER' ? 'primary' : 'outline'}
              fullWidth
              onPress={() => chooseRole(step.roleToken, r)}
            />
          ))}
        </Card>
      ) : null}

      <Notice tone="error" message={error} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  roles: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
})

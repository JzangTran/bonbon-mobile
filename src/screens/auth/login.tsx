import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { z } from 'zod'
import { loadLastRole, teamOf, useSession, type Role } from '@/entities/session'
import { GoogleSignIn } from '@/features/google-sign-in'
import { api, problemCode, problemMessage, type components } from '@/shared/api'
import { useLocale, useTx, type Tx } from '@/shared/i18n'
import { Button, Captcha, Checkbox, Input, Notice, Text, spacing, useTheme, useToast } from '@/shared/ui'
import { AuthLink, AuthSheet, OrDivider } from '@/widgets/auth-sheet'

/** A seller team signs in as `name:main` (main account) or `name:code` (member). */
const TEAM_LOGIN = /^[a-z0-9._-]{2,40}:[a-z0-9._-]{2,40}$/
const isTeamLogin = (v: string) => TEAM_LOGIN.test(v.trim().toLowerCase())

const schemaFor = (tx: Tx) =>
  z.object({
    email: z
      .string()
      .trim()
      .refine((v) => isTeamLogin(v) || z.email().safeParse(v).success, tx('Nhập email, hoặc tên đăng nhập nhóm dạng tên:main / tên:mã', 'Enter an email, or a team login like name:main / name:code')),
    password: z.string().min(1, tx('Vui lòng nhập mật khẩu', 'Enter your password')),
  })
type Values = z.infer<ReturnType<typeof schemaFor>>
type LoginResponse = components['schemas']['LoginResponse']

export default function LoginScreen() {
  const theme = useTheme()
  const tx = useTx()
  const locale = useLocale()
  const { signIn } = useSession()
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [roleChoice, setRoleChoice] = useState<{ roleToken: string; roles: Role[] } | null>(null)
  const [remember, setRemember] = useState(true)
  const form = useForm<Values>({ resolver: zodResolver(schemaFor(tx)), defaultValues: { email: '', password: '' } })
  // a message left from the other language would not change with the rest of the screen
  useEffect(() => form.clearErrors(), [form, locale])

  const finish = async (data: LoginResponse) => {
    if (data.deletionCancelled) toast.show(tx('Việc xoá tài khoản đã được huỷ vì bạn đăng nhập lại.', 'Your account deletion was cancelled because you signed in again.'))
    const { tokens, user } = data
    const role = (user?.activeRole ?? tokens?.role) as Role | undefined
    if (!tokens?.accessToken || !tokens.refreshToken || !user?.id || !role) return
    await signIn({
      userId: user.id,
      email: user.email ?? '',
      name: user.name ?? '',
      role,
      availableRoles: ((user.availableRoles ?? [role]) as Role[]).filter((r) => r !== ('ADMIN' as Role)),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      team: teamOf((user as { team?: unknown }).team),
    }, { remember })
  }

  const chooseRole = async (roleToken: string, role: Role) => {
    setError(null)
    const { data, error: problem } = await api.POST('/api/auth/select-role', { body: { role, roleToken } })
    if (!data) {
      setRoleChoice(null)
      setError(problemMessage(problem as unknown))
      return
    }
    await finish(data)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setUnverifiedEmail(null)
    if (isTeamLogin(values.email)) {
      const { data: team, error: teamProblem } = await api.POST('/api/seller-team/login', {
        body: { login: values.email.trim().toLowerCase(), password: values.password, captchaToken: captchaToken ?? undefined },
      })
      if (!team) {
        if (problemCode(teamProblem) === 'CAPTCHA_REQUIRED') setNeedsCaptcha(true)
        setError(problemMessage(teamProblem))
        return
      }
      await finish(team)
      return
    }
    const { data, error: problem } = await api.POST('/api/auth/login', {
      body: { ...values, captchaToken: captchaToken ?? undefined },
    })
    if (!data) {
      if (problemCode(problem) === 'CAPTCHA_REQUIRED') setNeedsCaptcha(true)
      if (problemCode(problem) === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(values.email)
      setError(problemMessage(problem))
      return
    }
    if (data.needsRoleSelection && data.roleToken) {
      const roles = (data.availableRoles ?? []) as Role[]
      const last = await loadLastRole()
      if (last && roles.includes(last)) {
        await chooseRole(data.roleToken, last)
      } else {
        setRoleChoice({ roleToken: data.roleToken, roles })
      }
      return
    }
    await finish(data)
  })

  const resend = async () => {
    if (!unverifiedEmail) return
    await api.POST('/api/auth/resend-verification', { body: { email: unverifiedEmail } })
    setResent(true)
  }

  if (roleChoice) {
    return (
      <AuthSheet
        title={tx('Bạn muốn vào với vai trò nào?', 'Which role do you want?')}
        intro={tx('Có thể đổi lại bất cứ lúc nào trong phần Tài khoản. Lựa chọn được nhớ trên máy này.', 'You can change it any time in Account. The choice is remembered on this device.')}
      >
        {roleChoice.roles.map((role) => (
          <Button key={role} title={role === 'CUSTOMER' ? tx('Khách hàng — đặt món', 'Customer — order food') : tx('Người bán — quản lý quán', 'Seller — run the shop')} size="lg" fullWidth variant={role === 'CUSTOMER' ? 'primary' : 'outline'}
            onPress={() => chooseRole(roleChoice.roleToken, role)} />
        ))}
        <Notice tone="error" message={error} />
      </AuthSheet>
    )
  }

  return (
    <AuthSheet
      title={tx('Đăng nhập', 'Sign in')}
      footer={<AuthLink text={tx('Bạn chưa có tài khoản?', "Don't have an account?")} action={tx('Tạo tài khoản ngay', 'Create one now')} href="/register" />}
    >
      <Controller control={form.control} name="email" render={({ field, fieldState }) => (
        <Input label={tx('Email hoặc tên đăng nhập nhóm', 'Email or team login')} keyboardType="email-address" autoCapitalize="none" autoComplete="username" textContentType="username"
          value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="password" render={({ field, fieldState }) => (
        <Input label={tx('Mật khẩu', 'Password')} secureTextEntry autoComplete="current-password" textContentType="password"
          value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <View style={styles.options}>
        <View style={styles.flex}>
          <Checkbox checked={remember} onChange={setRemember}>{tx('Ghi nhớ đăng nhập', 'Remember me')}</Checkbox>
        </View>
        <Link href="/forgot-password">
          <Text variant="bodySm" color={theme.primary}>{tx('Quên mật khẩu?', 'Forgot password?')}</Text>
        </Link>
      </View>
      {needsCaptcha ? <Captcha token={captchaToken} onToken={setCaptchaToken} /> : null}
      <Notice tone="error" message={error} />
      {unverifiedEmail && !resent ? <Button title={tx('Gửi lại email xác thực', 'Resend verification email')} variant="outline" onPress={resend} /> : null}
      <Notice tone="success" message={resent ? tx('Nếu tài khoản cần xác thực, chúng tôi đã gửi lại liên kết.', 'If the account needs verifying, we have sent the link again.') : null} />
      <Button title={form.formState.isSubmitting ? tx('Đang đăng nhập…', 'Signing in…') : tx('Đăng nhập', 'Sign in')} size="lg" fullWidth
        loading={form.formState.isSubmitting} onPress={() => void onSubmit()} />
      <OrDivider />
      <GoogleSignIn icon remember={remember} />
    </AuthSheet>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  options: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
})

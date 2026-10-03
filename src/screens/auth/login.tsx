import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'
import { z } from 'zod'
import { loadLastRole, useSession, type Role } from '@/entities/session'
import { api, problemCode, problemMessage, type components } from '@/shared/api'
import { Button, Captcha, Card, Input, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'

const schema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
type Values = z.infer<typeof schema>
type LoginResponse = components['schemas']['LoginResponse']

const ROLE_LABEL: Record<Role, string> = { CUSTOMER: 'Khách hàng — đặt món', SELLER: 'Người bán — quản lý quán' }

export default function LoginScreen() {
  const theme = useTheme()
  const { signIn } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [roleChoice, setRoleChoice] = useState<{ roleToken: string; roles: Role[] } | null>(null)
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const finish = async (data: LoginResponse) => {
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
    })
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
      <Screen>
        <Text variant="headline">Bạn muốn vào với vai trò nào?</Text>
        <Text muted>Có thể đổi lại bất cứ lúc nào trong phần Tài khoản. Lựa chọn được nhớ trên máy này.</Text>
        {roleChoice.roles.map((role) => (
          <Button key={role} title={ROLE_LABEL[role]} size="lg" fullWidth variant={role === 'CUSTOMER' ? 'primary' : 'outline'}
            onPress={() => chooseRole(roleChoice.roleToken, role)} />
        ))}
        <Notice tone="error" message={error} />
      </Screen>
    )
  }

  return (
    <Screen>
      <Text variant="display" color={theme.primary}>
        bonbon
      </Text>
      <Text muted>Đặt món từ quán ăn trong khu của bạn.</Text>
      <Card>
        <Text variant="title">Đăng nhập</Text>
        <Controller control={form.control} name="email" render={({ field, fieldState }) => (
          <Input label="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )} />
        <Controller control={form.control} name="password" render={({ field, fieldState }) => (
          <Input label="Mật khẩu" secureTextEntry autoComplete="current-password" textContentType="password"
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )} />
        {needsCaptcha ? <Captcha token={captchaToken} onToken={setCaptchaToken} /> : null}
        <Notice tone="error" message={error} />
        {unverifiedEmail && !resent ? <Button title="Gửi lại email xác thực" variant="outline" onPress={resend} /> : null}
        <Notice tone="success" message={resent ? 'Nếu tài khoản cần xác thực, chúng tôi đã gửi lại liên kết.' : null} />
        <Button title={form.formState.isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'} size="lg" fullWidth
          loading={form.formState.isSubmitting} onPress={onSubmit} />
        <View style={styles.links}>
          <Link href="/forgot-password">
            <Text variant="bodySm" color={theme.primary}>Quên mật khẩu?</Text>
          </Link>
          <Link href="/register">
            <Text variant="bodySm" color={theme.primary}>Tạo tài khoản</Text>
          </Link>
        </View>
        {__DEV__ ? (
          <Link href="/dev-ui">
            <Text variant="caption" muted>Xem UI kit (dev)</Text>
          </Link>
        ) : null}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
})

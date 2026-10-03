import { Link } from 'expo-router'
import { useState } from 'react'
import { z } from 'zod'
import { api, problemMessage } from '@/shared/api'
import { Button, Card, Input, Notice, Screen, Text, useTheme } from '@/shared/ui'

/** The emailed link opens the web reset page, which works from any phone browser. */
export default function ForgotPasswordScreen() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | undefined>()

  const submit = async () => {
    setError(null)
    if (!z.email().safeParse(email.trim()).success) {
      setEmailError('Email không hợp lệ')
      return
    }
    setEmailError(undefined)
    setSubmitting(true)
    const { error: problem, response } = await api.POST('/api/auth/forgot-password', { body: { email: email.trim() } })
    setSubmitting(false)
    if (!response.ok) setError(problemMessage(problem))
    else setSent(true)
  }

  return (
    <Screen>
      <Text variant="headline">Quên mật khẩu</Text>
      <Card>
        {sent ? (
          <Notice tone="success" message="Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu (hiệu lực 1 giờ)." />
        ) : (
          <>
            <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={emailError} />
            <Notice tone="error" message={error} />
            <Button title="Gửi liên kết" size="lg" fullWidth loading={submitting} onPress={submit} />
          </>
        )}
      </Card>
      <Link href="/">
        <Text variant="bodySm" color={theme.primary}>Về đăng nhập</Text>
      </Link>
    </Screen>
  )
}

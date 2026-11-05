import { useState } from 'react'
import { z } from 'zod'
import { api, problemMessage } from '@/shared/api'
import { useTx } from '@/shared/i18n'
import { Button, Input, Notice } from '@/shared/ui'
import { AuthLink, AuthSheet } from '@/widgets/auth-sheet'

/** The emailed link opens the web reset page, which works from any phone browser. */
export default function ForgotPasswordScreen() {
  const tx = useTx()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState(false)

  const submit = async () => {
    setError(null)
    if (!z.email().safeParse(email.trim()).success) {
      setEmailError(true)
      return
    }
    setEmailError(false)
    setSubmitting(true)
    const { error: problem, response } = await api.POST('/api/auth/forgot-password', { body: { email: email.trim() } })
    setSubmitting(false)
    if (!response.ok) setError(problemMessage(problem))
    else setSent(true)
  }

  return (
    <AuthSheet
      title={tx('Quên mật khẩu', 'Forgot password')}
      footer={<AuthLink dismiss href="/login" action={tx('Về đăng nhập', 'Back to sign in')} />}
    >
      {sent ? (
        <Notice
          tone="success"
          message={tx(
            'Nếu email này có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu (hiệu lực 1 giờ).',
            'If this email has an account, we have sent a link to reset the password (valid for 1 hour).',
          )}
        />
      ) : (
        <>
          <Input
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={emailError ? tx('Email không hợp lệ', 'Invalid email') : undefined}
          />
          <Notice tone="error" message={error} />
          <Button title={tx('Gửi liên kết', 'Send link')} size="lg" fullWidth loading={submitting} onPress={submit} />
        </>
      )}
    </AuthSheet>
  )
}

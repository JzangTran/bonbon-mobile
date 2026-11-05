import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Linking } from 'react-native'
import { z } from 'zod'
import { GoogleSignIn } from '@/features/google-sign-in'
import { api, problemCode, problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { useLocale, useTx, type Tx } from '@/shared/i18n'
import { Button, Captcha, Checkbox, Input, Notice, Text, useTheme } from '@/shared/ui'
import { AuthLink, AuthSheet, OrDivider } from '@/widgets/auth-sheet'

const schemaFor = (tx: Tx) =>
  z
    .object({
      name: z.string().trim().min(1, tx('Vui lòng nhập họ tên', 'Enter your name')).max(100, tx('Tối đa 100 ký tự', 'At most 100 characters')),
      email: z.email(tx('Email không hợp lệ', 'Invalid email')).max(255),
      password: z.string().min(8, tx('Mật khẩu tối thiểu 8 ký tự', 'At least 8 characters')).max(100, tx('Tối đa 100 ký tự', 'At most 100 characters')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: tx('Mật khẩu nhập lại không khớp', 'The passwords do not match') })
type Values = z.infer<ReturnType<typeof schemaFor>>
type DocType = 'CUSTOMER_TERMS' | 'PRIVACY_POLICY'

function useCurrentDocument(type: DocType) {
  return useQuery({
    queryKey: ['legal-document', type],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/legal/documents/{type}', { params: { path: { type } } })
      if (error || !data) throw error
      return data
    },
  })
}

/** Sign-up in the app makes a customer account; selling is added to it later from the account page, with the same email and password. */
export default function RegisterScreen() {
  const theme = useTheme()
  const tx = useTx()
  const locale = useLocale()
  const terms = useCurrentDocument('CUSTOMER_TERMS')
  const privacy = useCurrentDocument('PRIVACY_POLICY')
  const [accepted, setAccepted] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string; roleAdded: boolean } | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schemaFor(tx)),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  // a message left from the other language would not change with the rest of the screen
  useEffect(() => form.clearErrors(), [form, locale])

  const openDocument = (type: DocType) => Linking.openURL(`${env.webUrl}/legal/${type}`)

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    if (!accepted) {
      setError(tx('Bạn cần đồng ý với điều khoản và chính sách quyền riêng tư.', 'Please agree to the terms and the privacy policy.'))
      return
    }
    if (!captchaToken) {
      setError(tx('Vui lòng xác nhận bạn không phải robot.', 'Please confirm you are not a robot.'))
      return
    }
    if (!terms.data?.id || !privacy.data?.id) return
    const { data, error: problem, response } = await api.POST('/api/auth/register', {
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        role: 'CUSTOMER',
        acceptedDocumentIds: [terms.data.id, privacy.data.id],
        marketingConsent: marketing,
        captchaToken,
      },
    })
    if (!response.ok) {
      if (problemCode(problem) === 'LEGAL_DOCUMENTS_CHANGED') {
        setAccepted(false)
        await Promise.all([terms.refetch(), privacy.refetch()])
      }
      setError(problemMessage(problem))
      return
    }
    setDone({ email: values.email, roleAdded: data?.status === 'ROLE_ADDED' })
  })

  const signInLink = <AuthLink text={tx('Đã có tài khoản?', 'Already have an account?')} action={tx('Đăng nhập ngay', 'Sign in now')} href="/login" dismiss />

  if (done) {
    return (
      <AuthSheet
        title={done.roleAdded ? tx('Đã thêm vai trò', 'Role added') : tx('Kiểm tra hộp thư của bạn', 'Check your inbox')}
        footer={<AuthLink action={tx('Về đăng nhập', 'Back to sign in')} href="/login" dismiss />}
      >
        <Notice
          tone="success"
          message={
            done.roleAdded
              ? tx(`Tài khoản ${done.email} giờ có thêm vai trò khách hàng. Đăng nhập để chọn vai trò sử dụng.`, `${done.email} now also has the customer role. Sign in to choose the role to use.`)
              : tx(`Chúng tôi đã gửi liên kết xác thực tới ${done.email}. Mở liên kết, rồi quay lại đây để đăng nhập.`, `We sent a verification link to ${done.email}. Open it, then come back here to sign in.`)
          }
        />
      </AuthSheet>
    )
  }

  return (
    <AuthSheet
      title={tx('Tạo tài khoản', 'Create account')}
      intro={tx('Đặt món từ các quán ngay trong khu của bạn.', 'Order from the shops right in your area.')}
      footer={signInLink}
    >
      {(['name', 'email', 'password', 'confirmPassword'] as const).map((name) => (
        <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
          <Input
            label={{ name: tx('Họ tên', 'Full name'), email: 'Email', password: tx('Mật khẩu', 'Password'), confirmPassword: tx('Nhập lại mật khẩu', 'Repeat password') }[name]}
            secureTextEntry={name === 'password' || name === 'confirmPassword'}
            keyboardType={name === 'email' ? 'email-address' : 'default'}
            autoCapitalize={name === 'name' ? 'words' : 'none'}
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message}
          />
        )} />
      ))}
      <Checkbox checked={accepted} onChange={setAccepted}>
        {tx('Tôi đồng ý với', 'I agree to the')}{' '}
        <Text variant="bodySm" color={theme.primary} onPress={() => openDocument('CUSTOMER_TERMS')}>
          {terms.data?.title ?? tx('Điều khoản sử dụng', 'Terms of use')}
        </Text>{' '}
        {tx('và đã đọc', 'and have read the')}{' '}
        <Text variant="bodySm" color={theme.primary} onPress={() => openDocument('PRIVACY_POLICY')}>
          {privacy.data?.title ?? tx('Chính sách quyền riêng tư', 'Privacy policy')}
        </Text>
        .
      </Checkbox>
      <Checkbox checked={marketing} onChange={setMarketing} muted>
        {tx('Nhận tin khuyến mãi qua email (không bắt buộc).', 'Get offers by email (optional).')}
      </Checkbox>
      <Captcha token={captchaToken} onToken={setCaptchaToken} />
      <Notice tone="error" message={error} />
      <Button title={form.formState.isSubmitting ? tx('Đang tạo tài khoản…', 'Creating account…') : tx('Đăng ký', 'Sign up')} size="lg" fullWidth
        loading={form.formState.isSubmitting} disabled={terms.isLoading || privacy.isLoading} onPress={() => void onSubmit()} />
      <OrDivider />
      <GoogleSignIn role="CUSTOMER" icon />
    </AuthSheet>
  )
}

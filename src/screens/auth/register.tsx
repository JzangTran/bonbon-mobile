import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Linking, StyleSheet, View } from 'react-native'
import { z } from 'zod'
import type { Role } from '@/entities/session'
import { api, problemCode, problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { Button, Captcha, Card, Checkbox, Input, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'

const schema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(100, 'Tối đa 100 ký tự'),
    email: z.email('Email không hợp lệ').max(255),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100, 'Tối đa 100 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
type Values = z.infer<typeof schema>
type DocType = 'CUSTOMER_TERMS' | 'SELLER_TERMS' | 'PRIVACY_POLICY'

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

export default function RegisterScreen() {
  const theme = useTheme()
  const [role, setRole] = useState<Role>('CUSTOMER')
  const terms = useCurrentDocument(role === 'SELLER' ? 'SELLER_TERMS' : 'CUSTOMER_TERMS')
  const privacy = useCurrentDocument('PRIVACY_POLICY')
  const [accepted, setAccepted] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ email: string; roleAdded: boolean } | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const openDocument = (type: DocType) => Linking.openURL(`${env.webUrl}/legal/${type}`)

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    if (!accepted) {
      setError('Bạn cần đồng ý với điều khoản và chính sách quyền riêng tư.')
      return
    }
    if (!captchaToken) {
      setError('Vui lòng xác nhận bạn không phải robot.')
      return
    }
    if (!terms.data?.id || !privacy.data?.id) return
    const { data, error: problem, response } = await api.POST('/api/auth/register', {
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        role,
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

  if (done) {
    return (
      <Screen>
        <Text variant="headline">{done.roleAdded ? 'Đã thêm vai trò' : 'Kiểm tra hộp thư của bạn'}</Text>
        <Notice
          tone="success"
          message={
            done.roleAdded
              ? `Tài khoản ${done.email} giờ có thêm vai trò ${role === 'SELLER' ? 'người bán' : 'khách hàng'}. Đăng nhập để chọn vai trò sử dụng.`
              : `Chúng tôi đã gửi liên kết xác thực tới ${done.email}. Mở liên kết, rồi quay lại đây để đăng nhập.`
          }
        />
        <Link href="/" asChild>
          <Button title="Về đăng nhập" variant="outline" />
        </Link>
      </Screen>
    )
  }

  return (
    <Screen>
      <Text variant="headline">Tạo tài khoản</Text>
      <Text muted>Đã có tài khoản? Đăng ký vai trò còn lại bằng cùng email và mật khẩu để dùng chung một tài khoản.</Text>
      <View style={styles.roles}>
        {(['CUSTOMER', 'SELLER'] as Role[]).map((r) => (
          <Button key={r} title={r === 'CUSTOMER' ? 'Đặt món' : 'Bán hàng'} variant={role === r ? 'primary' : 'outline'}
            style={styles.roleButton} onPress={() => { setRole(r); setAccepted(false) }} />
        ))}
      </View>
      <Card>
        {(['name', 'email', 'password', 'confirmPassword'] as const).map((name) => (
          <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
            <Input
              label={{ name: 'Họ tên', email: 'Email', password: 'Mật khẩu', confirmPassword: 'Nhập lại mật khẩu' }[name]}
              secureTextEntry={name === 'password' || name === 'confirmPassword'}
              keyboardType={name === 'email' ? 'email-address' : 'default'}
              autoCapitalize={name === 'name' ? 'words' : 'none'}
              value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message}
            />
          )} />
        ))}
        <Checkbox checked={accepted} onChange={setAccepted}>
          Tôi đồng ý với{' '}
          <Text variant="bodySm" color={theme.primary} onPress={() => openDocument(role === 'SELLER' ? 'SELLER_TERMS' : 'CUSTOMER_TERMS')}>
            {terms.data?.title ?? 'Điều khoản sử dụng'}
          </Text>{' '}
          và đã đọc{' '}
          <Text variant="bodySm" color={theme.primary} onPress={() => openDocument('PRIVACY_POLICY')}>
            {privacy.data?.title ?? 'Chính sách quyền riêng tư'}
          </Text>
          .
        </Checkbox>
        <Checkbox checked={marketing} onChange={setMarketing} muted>
          Nhận tin khuyến mãi qua email (không bắt buộc).
        </Checkbox>
        <Captcha token={captchaToken} onToken={setCaptchaToken} />
        <Notice tone="error" message={error} />
        <Button title={form.formState.isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'} size="lg" fullWidth
          loading={form.formState.isSubmitting} disabled={terms.isLoading || privacy.isLoading} onPress={onSubmit} />
      </Card>
      <Link href="/">
        <Text variant="bodySm" color={theme.primary}>Đã có tài khoản? Đăng nhập</Text>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  roles: { flexDirection: 'row', gap: spacing.sm },
  roleButton: { flex: 1 },
})

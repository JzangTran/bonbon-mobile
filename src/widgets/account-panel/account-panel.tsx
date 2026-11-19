import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useSession, type Role } from '@/entities/session'
import { unregisterPush } from '@/features/push'
import { api, problemMessage, type components } from '@/shared/api'
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native'
import { Button, Card, Input, Notice, PasswordStrength, Sheet, TEXT_SCALES, Text, fonts, radius, spacing, touchTarget, useTextScale, useTheme, useFeedback } from '@/shared/ui'
import { compactPhone, isPersonName, isVnPhone, passwordProblem } from '@/shared/lib/validate'
import { PrivacyCard } from './privacy-card'

type Profile = components['schemas']['Profile']

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(100, 'Tối đa 100 ký tự').refine(isPersonName, 'Họ tên chỉ gồm chữ cái và khoảng trắng'),
  phone: z.string().transform(compactPhone).refine((v) => v === '' || isVnPhone(v, 'mobile'), 'Số điện thoại di động Việt Nam không hợp lệ, ví dụ 0912345678'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(100, 'Tối đa 100 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
  .refine((v) => v.newPassword === '' || v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' })

const ROLE_NAME: Record<Role, string> = { CUSTOMER: 'Khách hàng', SELLER: 'Người bán' }

/**
 * Account basics on one page, for the seller Shop tab. The customer's Hồ sơ shows the same parts one per page (ProfileCard,
 * PasswordCard, PrivacyCard), so filling one form never runs into the next. Accounts are never deleted (owner 2026-11-19).
 */
export function AccountPanel() {
  const { session } = useSession()
  // a main account or member is not the shop owner: the owner's personal pages are closed to it
  if (session?.team) return <TeamCard />
  return <PersonalPanel />
}

export function TeamCard() {
  const { session, signOut } = useSession()
  const team = session?.team
  return (
    <Card>
      <Text variant="title3" accessibilityRole="header">{team?.kind === 'MAIN_ACCOUNT' ? 'Tài khoản chính' : 'Thành viên'}</Text>
      <Text variant="body">{team?.login}</Text>
      <Text variant="bodySm" muted>
        {team?.shopName ? `Đang làm việc ở ${team.shopName}. ` : ''}Thông tin cá nhân, mật khẩu và thành viên do chủ tài khoản chính quản lý trên trang người bán.
      </Text>
      <Button title="Đăng xuất" variant="outline" onPress={() => void signOut()} />
    </Card>
  )
}

function PersonalPanel() {
  const profile = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/me')
      if (error || !data) throw error
      return data
    },
  })
  return (
    <>
      <ProfileCard profile={profile.data} />
      <TextSizeCard />
      <RoleCard />
      {profile.data?.hasPassword !== false ? <PasswordCard /> : null}
      <SessionCard hasPassword={profile.data?.hasPassword !== false} />
      <PrivacyCard />
    </>
  )
}

/** A part of the account: a card with a title, or bare under the title of its own page. */
function Block({ bare, title, children, ...props }: ViewProps & { bare?: boolean; title: string }) {
  if (bare) return <View style={blockStyles.bare} {...props}>{children}</View>
  return (
    <Card {...props}>
      <Text variant="title3" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </Card>
  )
}

/** The main button of a form, a clear step below the last field (never stuck to it). */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <View style={blockStyles.actions}>{children}</View>
}

const blockStyles = StyleSheet.create({
  bare: { gap: spacing.lg },
  actions: { marginTop: spacing.md, gap: spacing.sm },
})

/** "Cỡ chữ": three sizes on top of the phone's own font size setting; saved on this device. */
export function TextSizeCard() {
  const theme = useTheme()
  const { id, setId } = useTextScale()
  return (
    <Card>
      <Text variant="title3" accessibilityRole="header">Cỡ chữ</Text>
      <Text variant="bodySm" muted>
        Chọn cỡ chữ dễ đọc với bạn. Cỡ chữ trong cài đặt của điện thoại vẫn được áp dụng thêm.
      </Text>
      <View style={sizeStyles.row} accessibilityRole="radiogroup">
        {TEXT_SCALES.map((s) => {
          const selected = s.id === id
          return (
            <Pressable
              key={s.id}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={`Cỡ chữ ${s.label.toLowerCase()}`}
              onPress={() => setId(s.id)}
              style={[sizeStyles.option, { backgroundColor: selected ? theme.primary : theme.surfaceMuted }]}
            >
              <Text variant="bodySm" color={selected ? theme.onPrimary : theme.text} style={{ fontFamily: fonts.semibold }}>
                {s.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </Card>
  )
}

const sizeStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: { flex: 1, minHeight: touchTarget.min, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
})

export function ProfileCard({ profile, bare }: { profile: Profile | undefined; bare?: boolean }) {
  const queryClient = useQueryClient()
  const { session, signIn } = useSession()
  const feedback = useFeedback()
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), defaultValues: { name: '', phone: '' } })
  useEffect(() => {
    if (profile) form.reset({ name: profile.name ?? '', phone: profile.phone ?? '' })
  }, [profile, form])
  const save = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const { data, error } = await api.PATCH('/api/account/me', { body: values })
      if (error || !data) throw error
      return data
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['account', 'me'], data)
      if (session && data.name) await signIn({ ...session, name: data.name })
      feedback.success('Đã lưu thông tin cá nhân. Tên và số điện thoại mới dùng cho các đơn từ bây giờ.')
    },
  })

  return (
    <Block bare={bare} title="Thông tin cá nhân">
      <Text variant="bodySm" muted>
        Email đăng nhập: {profile?.email ?? '…'}
      </Text>
      <Controller control={form.control} name="name" render={({ field, fieldState }) => (
        <Input label="Họ tên" autoCapitalize="words" autoComplete="name" textContentType="name" maxLength={100} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
          error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="phone" render={({ field, fieldState }) => (
        <Input label="Số điện thoại" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={15} placeholder="0912345678" value={field.value}
          onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Notice tone="error" message={save.isError ? problemMessage(save.error) : null} />
      <FormActions>
        <Button title="Lưu thay đổi" loading={save.isPending} disabled={!profile}
          onPress={() => void form.handleSubmit((values) => save.mutate(values))()} />
      </FormActions>
    </Block>
  )
}

export function RoleCard() {
  const { session, signIn } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  if (!session) return null
  const other: Role = session.role === 'CUSTOMER' ? 'SELLER' : 'CUSTOMER'
  const holdsOther = session.availableRoles.includes(other)

  const switchRole = async () => {
    setError(null)
    setSwitching(true)
    const { data, error: problem } = await api.POST('/api/auth/switch-role', { body: { role: other } })
    setSwitching(false)
    const tokens = data?.tokens
    if (!tokens?.accessToken || !tokens.refreshToken) {
      setError(problemMessage(problem as unknown))
      return
    }
    // The new role's route group replaces this one through the root layout's guards.
    await signIn({ ...session, role: other, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
  }

  return (
    <Card>
      <Text variant="title3" accessibilityRole="header">Vai trò</Text>
      <Text variant="bodySm" muted>
        Đang dùng với vai trò {ROLE_NAME[session.role].toLowerCase()}.
        {holdsOther || other === 'SELLER' ? '' : ' Muốn đặt món? Đăng xuất rồi tạo tài khoản bằng cùng email và mật khẩu.'}
      </Text>
      {holdsOther ? (
        <Button title={`Chuyển sang ${ROLE_NAME[other]}`} variant="outline" loading={switching} onPress={switchRole} />
      ) : null}
      <Notice tone="error" message={error} />
    </Card>
  )
}

export function PasswordCard({ bare, onDone }: { bare?: boolean; onDone?: () => void } = {}) {
  const { session, signIn } = useSession()
  const feedback = useFeedback()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const typedNew = useWatch({ control: form.control, name: 'newPassword' })

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    setError(null)
    const weak = passwordProblem(newPassword, session?.email, session?.name)
    if (weak) {
      form.setError('newPassword', { message: weak })
      return
    }
    const { data, error: problem } = await api.POST('/api/account/change-password', { body: { currentPassword, newPassword } })
    if (!data?.accessToken || !data.refreshToken || !session) {
      setError(problemMessage(problem as unknown))
      return
    }
    // Every other device is signed out; this one continues with the fresh pair.
    await signIn({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken })
    form.reset()
    feedback.success('Đã đổi mật khẩu. Các thiết bị khác bị đăng xuất; thiết bị này vẫn đăng nhập.')
    onDone?.()
  })

  return (
    <Block bare={bare} title="Đổi mật khẩu">
      <Text variant="bodySm" muted>
        Các thiết bị khác sẽ bị đăng xuất; thiết bị này vẫn giữ đăng nhập.
      </Text>
      {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((name) => (
        <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
          <Input
            label={{ currentPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới', confirmPassword: 'Nhập lại mật khẩu mới' }[name]}
            secureTextEntry autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} maxLength={100}
            value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message}
          />
        )} />
      ))}
      <PasswordStrength password={typedNew} email={session?.email} name={session?.name} />
      <Notice tone="error" message={error} />
      <FormActions>
        <Button title="Đổi mật khẩu" loading={form.formState.isSubmitting} onPress={() => void onSubmit()} />
      </FormActions>
    </Block>
  )
}

export function SessionCard({ hasPassword }: { hasPassword: boolean }) {
  const { signOut } = useSession()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const logoutAll = async () => {
    setError(null)
    setBusy(true)
    await unregisterPush()
    const { error: problem, response } = await api.POST('/api/auth/logout-all', {
      body: { password: hasPassword ? password : undefined },
    })
    setBusy(false)
    if (!response.ok) {
      setError(problemMessage(problem as unknown))
      return
    }
    setConfirming(false)
    await signOut({ alreadyRevoked: true })
  }

  return (
    <Card>
      <Button
        title="Đăng xuất"
        variant="outline"
        onPress={async () => {
          // While the access token is still valid, so this phone stops receiving this account's pushes.
          await unregisterPush()
          await signOut()
        }}
      />
      <Button title="Đăng xuất khỏi mọi thiết bị" variant="ghost" onPress={() => setConfirming(true)} />
      <Sheet visible={confirming} onClose={() => setConfirming(false)} title="Đăng xuất khỏi mọi thiết bị?">
        <Text variant="bodySm" muted>
          Dùng khi bạn nghi tài khoản bị người khác đăng nhập. Mọi thiết bị, kể cả máy này, sẽ phải đăng nhập lại.
        </Text>
        {hasPassword ? (
          <Input label="Nhập mật khẩu để xác nhận" secureTextEntry autoComplete="current-password" value={password}
            onChangeText={setPassword} />
        ) : null}
        <Notice tone="error" message={error} />
        <FormActions>
          <Button title="Đăng xuất mọi thiết bị" variant="destructive" loading={busy} disabled={hasPassword && !password}
            onPress={logoutAll} />
        </FormActions>
      </Sheet>
    </Card>
  )
}

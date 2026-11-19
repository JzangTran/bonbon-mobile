import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { KeyRound, LogOut, MonitorSmartphone, ShieldCheck, Store, UserRound } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSession } from '@/entities/session'
import { unregisterPush } from '@/features/push'
import { api, problemMessage } from '@/shared/api'
import { Button, Input, ListGroup, ListRow, Notice, Screen, Sheet, Text, spacing, useTheme } from '@/shared/ui'
import { FormActions, RoleCard, TeamCard, TextSizeCard } from '@/widgets/account-panel'

/**
 * "Hồ sơ" (owner 2026-11-19): a hub, not one long page of forms. Each form opens on its own page (personal details, password,
 * privacy), so filling one never runs into the next. Text size and the role switch are a tap each, so they stay here; opening a
 * shop and signing out moved here from the Account tab. Accounts cannot be deleted: orders, payments and reviews depend on them.
 */
export default function CustomerProfileScreen() {
  const { session } = useSession()
  if (session?.team) {
    return (
      <Screen>
        <TeamCard />
      </Screen>
    )
  }
  return <PersonalHub />
}

function PersonalHub() {
  const theme = useTheme()
  const router = useRouter()
  const { session, signOut } = useSession()
  const profile = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/me')
      if (error || !data) throw error
      return data
    },
  })
  const hasPassword = profile.data?.hasPassword !== false
  const [allOpen, setAllOpen] = useState(false)
  const icon = (I: typeof UserRound) => <I size={20} color={theme.textSecondary} strokeWidth={1.5} />
  const canOpenShop = session && !session.availableRoles.includes('SELLER')

  return (
    <Screen>
      <View style={styles.page}>
        <ListGroup title="Thông tin">
          <ListRow icon={icon(UserRound)} label="Thông tin cá nhân" onPress={() => router.push('/customer/profile-info')} />
          {hasPassword ? <ListRow icon={icon(KeyRound)} label="Đổi mật khẩu" onPress={() => router.push('/customer/change-password')} /> : null}
          <ListRow icon={icon(ShieldCheck)} label="Quyền riêng tư và dữ liệu" onPress={() => router.push('/customer/privacy')} />
        </ListGroup>

        <TextSizeCard />
        {session && session.availableRoles.length > 1 ? <RoleCard /> : null}

        {canOpenShop ? (
          <ListGroup title="Cơ hội">
            <ListRow icon={icon(Store)} label="Mở quán trên bonbon" onPress={() => router.push('/customer/become-seller')} />
          </ListGroup>
        ) : null}

        <ListGroup title="Đăng nhập">
          <ListRow icon={icon(MonitorSmartphone)} label="Đăng xuất khỏi mọi thiết bị" onPress={() => setAllOpen(true)} />
          <ListRow
            icon={<LogOut size={20} color={theme.danger} strokeWidth={1.5} />}
            label="Đăng xuất"
            tone="danger"
            chevron={false}
            onPress={async () => {
              // while the access token is still valid, so this phone stops receiving this account's pushes
              await unregisterPush()
              await signOut()
            }}
          />
        </ListGroup>
      </View>
      <LogoutAllSheet visible={allOpen} hasPassword={hasPassword} onClose={() => setAllOpen(false)} />
    </Screen>
  )
}

function LogoutAllSheet({ visible, hasPassword, onClose }: { visible: boolean; hasPassword: boolean; onClose: () => void }) {
  const { signOut } = useSession()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const logoutAll = async () => {
    setError(null)
    setBusy(true)
    await unregisterPush()
    const { error: problem, response } = await api.POST('/api/auth/logout-all', { body: { password: hasPassword ? password : undefined } })
    setBusy(false)
    if (!response.ok) {
      setError(problemMessage(problem as unknown))
      return
    }
    onClose()
    await signOut({ alreadyRevoked: true })
  }
  return (
    <Sheet visible={visible} onClose={onClose} title="Đăng xuất khỏi mọi thiết bị?">
      <Text variant="bodySm" muted>
        Dùng khi bạn nghi tài khoản bị người khác đăng nhập. Mọi thiết bị, kể cả máy này, sẽ phải đăng nhập lại.
      </Text>
      {hasPassword ? <Input label="Nhập mật khẩu để xác nhận" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} /> : null}
      <Notice tone="error" message={error} />
      <FormActions>
        <Button title="Đăng xuất mọi thiết bị" variant="destructive" loading={busy} disabled={hasPassword && !password} onPress={logoutAll} />
      </FormActions>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxl },
})

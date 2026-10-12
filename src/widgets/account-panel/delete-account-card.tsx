import { useRouter, type Href } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDeleteAccount, useDeletionCheck } from '@/entities/account-deletion'
import { useSession, type Role } from '@/entities/session'
import { useReauthGate } from '@/features/reauthenticate'
import { problemMessage } from '@/shared/api'
import { Button, Card, Input, Notice, Sheet, Text, fonts, spacing, useTheme, useToast } from '@/shared/ui'

/** Where each blocker is dealt with, by the role the person is using. */
const BLOCKER_ROUTE: Record<Role, Record<string, string>> = {
  CUSTOMER: { ORDERS: '/customer/orders', ORDER_CASES: '/customer/orders', SUPPORT_TICKETS: '/customer/support' },
  SELLER: { ORDERS: '/seller', ORDER_CASES: '/seller/order-cases', SUPPORT_TICKETS: '/seller/support', CLOSE_SHOP: '/seller/shop' },
}

const vnDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Deleting the account (delete-account.md), which the stores require to be possible inside the app: says what goes and what stays,
 * lists what still blocks it, and waits out a grace period during which signing in again cancels it.
 */
export function DeleteAccountCard() {
  const theme = useTheme()
  const router = useRouter()
  const toast = useToast()
  const { session, signOut } = useSession()
  const check = useDeletionCheck(true)
  const remove = useDeleteAccount()
  const gate = useReauthGate()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const data = check.data
  const routes = BLOCKER_ROUTE[session?.role ?? 'CUSTOMER']

  const submit = () => {
    setError(null)
    const attempt = () =>
      remove.mutate(
        { confirmation: confirmation.trim(), password: data?.needsPassword ? password : undefined },
        {
          onSuccess: async (scheduled) => {
            setOpen(false)
            // Every session ended on the server already.
            await signOut({ alreadyRevoked: true })
            toast.show(`Tài khoản sẽ được xoá vào ${vnDate.format(new Date(scheduled.executesAt ?? Date.now()))}. Đăng nhập lại trước đó sẽ huỷ việc xoá.`)
          },
          onError: (e) => {
            if (!gate.handle(e, attempt)) setError(problemMessage(e))
          },
        },
      )
    attempt()
  }

  return (
    <Card style={{ borderWidth: 1, borderColor: theme.danger }}>
      <Text variant="title">Xoá tài khoản</Text>
      <Text variant="bodySm" muted>
        Xoá toàn bộ tài khoản, gồm cả vai trò khách và người bán nếu bạn có cả hai.
      </Text>
      <View style={styles.gap}>
        <Text variant="bodySm">
          <Text variant="bodySm" style={styles.bold}>Sẽ bị xoá: </Text>
          tên, email, số điện thoại, ảnh, mật khẩu, địa chỉ giao hàng, cách đăng nhập và tuỳ chọn thông báo. Mọi phiên đăng nhập kết thúc ngay.
        </Text>
        <Text variant="bodySm">
          <Text variant="bodySm" style={styles.bold}>Được giữ lại: </Text>
          đơn hàng, thanh toán, sổ cái, đánh giá và tin nhắn, dưới tên “Người dùng đã xóa”, vì cần cho đối soát và pháp lý.
        </Text>
      </View>
      {check.isError ? <Notice tone="error" message={problemMessage(check.error)} /> : null}
      {data && !data.allowed ? (
        <View style={[styles.blockers, { backgroundColor: theme.warningSubtle }]}>
          <Text variant="bodySm" color={theme.onWarningSubtle} style={styles.bold}>
            Chưa xoá được vì còn việc chưa xong:
          </Text>
          {(data.blockers ?? []).map((b) => {
            const route = b.link ? routes[b.link] : undefined
            return (
              <View key={b.code} style={styles.gap}>
                <Text variant="bodySm" color={theme.onWarningSubtle}>
                  {b.message}
                </Text>
                {route ? <Button title="Xử lý" variant="outline" onPress={() => router.push(route as Href)} /> : null}
              </View>
            )
          })}
        </View>
      ) : null}
      {data ? (
        <Text variant="caption" muted>
          Sau khi xác nhận, tài khoản chờ {data.graceDays} ngày rồi mới bị xoá thật. Trong thời gian đó, đăng nhập lại sẽ huỷ việc xoá.
        </Text>
      ) : null}
      <Button title="Xoá tài khoản" variant="destructive" disabled={!data?.allowed} onPress={() => setOpen(true)} />

      <Sheet visible={open} onClose={() => setOpen(false)} title="Xoá tài khoản?">
        <Text variant="bodySm" muted>
          Gõ DELETE hoặc email {session?.email} để xác nhận{data?.needsPassword ? ' và nhập mật khẩu' : ''}. Bạn có {data?.graceDays} ngày để đổi ý bằng cách đăng nhập lại.
        </Text>
        <Input label="Xác nhận" autoCapitalize="none" autoCorrect={false} value={confirmation} onChangeText={setConfirmation} />
        {data?.needsPassword ? <Input label="Mật khẩu" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} /> : null}
        <Notice tone="error" message={error} />
        <Button
          title="Xoá tài khoản"
          variant="destructive"
          loading={remove.isPending}
          disabled={confirmation.trim() === '' || (!!data?.needsPassword && password === '')}
          onPress={submit}
        />
      </Sheet>
      {gate.sheet}
    </Card>
  )
}

const styles = StyleSheet.create({
  gap: { gap: spacing.xs },
  bold: { fontFamily: fonts.semibold },
  blockers: { borderRadius: 4, padding: spacing.md, gap: spacing.sm },
})

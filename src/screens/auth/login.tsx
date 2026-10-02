import { Link } from 'expo-router'
import { useSession, type Role } from '@/entities/session'
import { Button, Card, Screen, Text, spacing, useTheme } from '@/shared/ui'

/** Placeholder until the real login (Sprint 1). The shortcuts exist only in development builds. */
export default function LoginScreen() {
  const { setSession } = useSession()
  const theme = useTheme()
  const enter = (role: Role) => setSession({ userId: 'dev', role, permissions: new Set() })

  return (
    <Screen>
      <Text variant="display" color={theme.primary}>
        bonbon
      </Text>
      <Text muted>Đặt món từ quán ăn trong khu của bạn.</Text>
      <Card>
        <Text variant="title">Đăng nhập</Text>
        <Text variant="bodySm" muted>
          Màn hình đăng nhập thật làm ở Sprint 1.
        </Text>
        {__DEV__ ? (
          <>
            <Button title="Vào thử: Khách hàng" fullWidth onPress={() => enter('CUSTOMER')} />
            <Button title="Vào thử: Người bán" variant="outline" fullWidth onPress={() => enter('SELLER')} />
            <Link href="/dev-ui" style={{ marginTop: spacing.sm }}>
              <Text variant="bodySm" color={theme.primary}>
                Xem UI kit
              </Text>
            </Link>
          </>
        ) : null}
      </Card>
    </Screen>
  )
}

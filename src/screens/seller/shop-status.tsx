import { Linking, StyleSheet, View } from 'react-native'
import { shopStatus, useShop } from '@/entities/shop'
import { problemMessage } from '@/shared/api'
import { env } from '@/shared/config/env'
import { Button, Card, Notice, Screen, Text, spacing, useTheme } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

const STEP_NAMES = ['Thông tin quán', 'Giao hàng & giờ mở cửa', 'Thuế & tài khoản nhận tiền', 'Định danh']

/**
 * The seller side before approval (open-shop.md): where the application stands. The full wizard is filled on
 * the web; account settings (switch role, log out) stay reachable here.
 */
export default function ShopStatusScreen() {
  const theme = useTheme()
  const shop = useShop()
  const status = shopStatus(shop.data)
  const openWeb = () => Linking.openURL(`${env.webUrl}/seller/open-shop`)

  return (
    <Screen>
      <Text variant="headline">Cửa hàng của bạn</Text>
      {shop.isError ? (
        <Card>
          <Notice tone="error" message={problemMessage(shop.error)} />
          <Button title="Thử lại" variant="outline" onPress={() => shop.refetch()} />
        </Card>
      ) : null}
      {status === 'NONE' ? (
        <Card>
          <Text variant="titleSm">Bạn chưa mở cửa hàng</Text>
          <Text muted>Điền hồ sơ 5 bước (thông tin quán, giao hàng, thuế, định danh) rồi gửi duyệt. Làm trên máy tính sẽ thuận tiện hơn.</Text>
          <Button title="Mở cửa hàng trên web" size="lg" fullWidth onPress={openWeb} />
        </Card>
      ) : null}
      {status === 'DRAFT' ? (
        <Card>
          <Text variant="titleSm">Hồ sơ đang điền dở</Text>
          <StepList shop={shop.data} />
          <Button title="Tiếp tục hồ sơ trên web" size="lg" fullWidth onPress={openWeb} />
        </Card>
      ) : null}
      {status === 'PENDING' ? (
        <Card>
          <Text variant="titleSm">Hồ sơ đang chờ duyệt</Text>
          <Text muted>
            Quản trị viên đang xem hồ sơ cửa hàng {shop.data?.shop?.name}. Bạn sẽ nhận email khi có kết quả; trong lúc chờ, hồ sơ không
            sửa được.
          </Text>
        </Card>
      ) : null}
      {status === 'REJECTED' ? (
        <Card style={{ backgroundColor: theme.dangerSubtle }}>
          <Text variant="titleSm" color={theme.onDangerSubtle}>
            Hồ sơ chưa được duyệt
          </Text>
          <Text variant="bodySm">Lý do: {shop.data?.rejectionReason}</Text>
          <Text variant="caption" muted>
            Sửa thông tin rồi gửi lại, hồ sơ sẽ quay về trạng thái chờ duyệt.
          </Text>
          <Button title="Sửa và gửi lại trên web" size="lg" fullWidth onPress={openWeb} />
        </Card>
      ) : null}
      {status === 'SUSPENDED' || status === 'CLOSED' ? (
        <Card>
          <Text variant="titleSm">Cửa hàng đang bị khoá hoặc đã đóng</Text>
          <Text muted>Hãy liên hệ bộ phận hỗ trợ của bonbon.</Text>
        </Card>
      ) : null}
      <AccountPanel />
    </Screen>
  )
}

function StepList({ shop }: { shop: ReturnType<typeof useShop>['data'] }) {
  const theme = useTheme()
  return (
    <View style={styles.steps}>
      {(shop?.steps ?? []).map((s) => (
        <View key={s.step} style={styles.step}>
          <View style={[styles.dot, { backgroundColor: s.complete ? theme.success : theme.warningSubtle }]}>
            <Text variant="caption" color={s.complete ? theme.onPrimary : theme.text}>
              {s.complete ? '✓' : '!'}
            </Text>
          </View>
          <Text variant="bodySm">{STEP_NAMES[(s.step ?? 1) - 1]}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  steps: { gap: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 36 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
})

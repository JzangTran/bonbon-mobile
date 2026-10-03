import { Screen, Text } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

/** Shop profile and settings arrive in Sprint 2; until then this tab holds the account section. */
export default function SellerShopScreen() {
  return (
    <Screen>
      <Text variant="headline">Cửa hàng</Text>
      <Text muted>Thông tin cửa hàng làm ở Sprint 2.</Text>
      <AccountPanel />
    </Screen>
  )
}

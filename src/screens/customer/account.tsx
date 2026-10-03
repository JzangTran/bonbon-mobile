import { Screen, Text } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

export default function CustomerAccountScreen() {
  return (
    <Screen>
      <Text variant="headline">Tài khoản</Text>
      <AccountPanel />
    </Screen>
  )
}

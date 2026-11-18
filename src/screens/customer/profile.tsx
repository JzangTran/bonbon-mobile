import { Screen } from '@/shared/ui'
import { AccountPanel } from '@/widgets/account-panel'

/** "Hồ sơ": name and phone, text size, role switch, password, sessions, privacy and deleting the account. */
export default function CustomerProfileScreen() {
  return (
    <Screen>
      <AccountPanel />
    </Screen>
  )
}

import { Screen } from '@/shared/ui'
import { PrivacyCard } from '@/widgets/account-panel'

/** "Quyền riêng tư và dữ liệu": a copy of the data, requests and their history. */
export default function CustomerPrivacyScreen() {
  return (
    <Screen>
      <PrivacyCard bare />
    </Screen>
  )
}

import { useRouter } from 'expo-router'
import { Screen } from '@/shared/ui'
import { PasswordCard } from '@/widgets/account-panel'

/** "Đổi mật khẩu", on a page of its own; back to Hồ sơ once it is done. */
export default function CustomerChangePasswordScreen() {
  const router = useRouter()
  return (
    <Screen>
      <PasswordCard bare onDone={() => router.back()} />
    </Screen>
  )
}

import { useRouter } from 'expo-router'
import { Screen } from '@/shared/ui'
import { HelpCenter } from '@/widgets/help-center'

export default function CustomerHelpScreen() {
  const router = useRouter()
  return (
    <Screen>
      <HelpCenter onContact={() => router.push('/customer/support')} />
    </Screen>
  )
}

import { useRouter } from 'expo-router'
import { Screen } from '@/shared/ui'
import { HelpCenter } from '@/widgets/help-center'

export default function SellerHelpScreen() {
  const router = useRouter()
  return (
    <Screen title="Trợ giúp" onBack={() => router.replace('/seller/shop')}>
      <HelpCenter onContact={() => router.push('/seller/support')} />
    </Screen>
  )
}

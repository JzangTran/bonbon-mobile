import { useRouter } from 'expo-router'
import { HelpCenter } from '@/widgets/help-center'

/** "Trung tâm trợ giúp": the web help center inside the app, under the stack's own header. */
export default function CustomerHelpScreen() {
  const router = useRouter()
  return <HelpCenter onContact={() => router.push('/customer/support')} />
}

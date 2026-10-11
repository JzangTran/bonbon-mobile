import { useRouter } from 'expo-router'
import { Screen } from '@/shared/ui'
import { TicketList } from '@/widgets/support-tickets'

export default function CustomerSupportScreen() {
  const router = useRouter()
  return (
    <Screen>
      <TicketList onOpen={(id) => router.push({ pathname: '/customer/ticket', params: { id } })} />
    </Screen>
  )
}

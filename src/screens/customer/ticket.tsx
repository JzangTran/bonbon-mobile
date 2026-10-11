import { useLocalSearchParams } from 'expo-router'
import { Screen } from '@/shared/ui'
import { TicketThread } from '@/widgets/support-tickets'

export default function CustomerTicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <Screen>
      <TicketThread id={id} />
    </Screen>
  )
}

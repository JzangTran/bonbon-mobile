import { Redirect } from 'expo-router'
import { useSession } from '@/entities/session'
import PaymentsScreen from '@/screens/customer/payments'

/** Belongs to an account: the tab bar opens the sign-in sheet for a guest, and a link that lands here does the same. */
export default function PaymentsTab() {
  const { session } = useSession()
  if (!session) return <Redirect href="/login" />
  return <PaymentsScreen />
}

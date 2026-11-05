import { Redirect } from 'expo-router'
import { useSession } from '@/entities/session'
import OrdersScreen from '@/screens/customer/orders'

/** Belongs to an account: the tab bar opens the sign-in sheet for a guest, and a link that lands here does the same. */
export default function OrdersTab() {
  const { session } = useSession()
  if (!session) return <Redirect href="/login" />
  return <OrdersScreen />
}

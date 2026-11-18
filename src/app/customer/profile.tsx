import { Redirect } from 'expo-router'
import { useSession } from '@/entities/session'
import CustomerProfileScreen from '@/screens/customer/profile'

/** The profile belongs to an account: a guest is sent to sign in. */
export default function ProfileRoute() {
  const { session } = useSession()
  if (!session) return <Redirect href="/login" />
  return <CustomerProfileScreen />
}

import { Redirect } from 'expo-router'
import { useSession } from '@/entities/session'

/** The app opens on the home page: the shops, for a guest as for a customer; a seller goes to their shop. */
export default function Index() {
  const { session } = useSession()
  return <Redirect href={session?.role === 'SELLER' ? '/seller' : '/customer'} />
}

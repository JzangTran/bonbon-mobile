import { Redirect } from 'expo-router'
import { useSession } from '@/entities/session'
import FavoritesScreen from '@/screens/customer/favorites'

/** Favourites belong to an account: a guest is sent to sign in. */
export default function FavoritesRoute() {
  const { session } = useSession()
  if (!session) return <Redirect href="/login" />
  return <FavoritesScreen />
}

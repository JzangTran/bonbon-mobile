import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import { Screen } from '@/shared/ui'
import { ProfileCard } from '@/widgets/account-panel'

/** "Thông tin cá nhân": name and phone, on a page of their own. */
export default function CustomerProfileInfoScreen() {
  const profile = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/account/me')
      if (error || !data) throw error
      return data
    },
  })
  return (
    <Screen>
      <ProfileCard profile={profile.data} bare />
    </Screen>
  )
}
